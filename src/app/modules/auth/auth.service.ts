import prisma from "../../../shared/prisma";
import bcrypt from "bcryptjs";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";
import { User } from "@prisma/client";
import generateOTP from "../../../helpers/generateOtp";
import redisClient from "../../../helpers/redis";
import { uploadInSpace } from "../../../helpers/uploadInSpace";
import {
  sendNotification,
  sendNotifications,
} from "../notifications/notification.services";
import { emailQueue } from "../../../queues/emailQueue";

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.status === "Deleted") {
    throw new ApiError(400, "This account was deleted");
  }
  if (user.status === "Blocked") {
    throw new ApiError(400, "This account was blocked");
  }

  const isPasswordValid = bcrypt.compareSync(payload.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (payload.fcmToken) {
    await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  const isSetup =
    user.address &&
    user.bio &&
    user.dob &&
    user.gender !== "Other" &&
    user.profession &&
    user.interests.length !== 0;

  return {
    accessToken,
    userId: user.id,
    email: user.email,
    role: user.role,
    isSetup: isSetup ?? false,
  };
};

const authLogin = async (payload: {
  email: string;
  fullName: string;
  fcmToken?: string;
  appleId?: string;
}) => {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { appleId: payload.appleId }],
    },
  });

  if (user) {
    if (user.status === "Blocked") {
      throw new ApiError(
        400,
        "This account was blocked, please contact support"
      );
    }
    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.jwt_secret as string,
      config.jwt.expires_in as string
    );
    const isSetup =
      user.address &&
      user.bio &&
      user.dob &&
      user.gender !== "Other" &&
      user.profession &&
      user.interests.length !== 0;

    return {
      accessToken,
      userId: user.id,
      email: user.email,
      role: user.role,
      isSetup: isSetup ?? false,
    };
  }

  const newUser = await prisma.user.create({
    data: {
      email: payload.email,
      fullName: payload.fullName,
      password: "123456",
      fcmToken: payload.fcmToken,
      appleId: payload.appleId,
    },
  });

  const accessToken = jwtHelpers.generateToken(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  await sendNotification(
    newUser.id,
    "Your account create has been successfully done!",
    "Welcome!"
  );

  return {
    accessToken,
    userId: newUser.id,
    email: newUser.email,
    role: newUser.role,
    isSetup: false,
  };
};

const userLocationUpdateInRedis = async (
  userId: string,
  userLocation: { longitude: number; latitude: number }
) => {
  console.log(userLocation.latitude, userLocation.longitude);
  const redisGeoKey = "userLocations"; // you can keep all users under one key

  // Use GEOADD to store location
  await redisClient.geoadd(
    redisGeoKey,
    userLocation.longitude,
    userLocation.latitude,
    userId
  );
  console.log(
    `Updated location for user ${userId}: (${userLocation.latitude}, ${userLocation.longitude})`
  );

  return;
};

export const getNearbyUsers = async (userId: string, radiusKm: number = 1) => {
  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
    },
  });

  if (!userInfo) throw new ApiError(404, "User not found");

  const redisGeoKey = "userLocations";

  const nearbyRaw = (await redisClient.georadiusbymember(
    redisGeoKey,
    userId,
    radiusKm,
    "km",
    "WITHDIST",
    "WITHCOORD"
  )) as any[];

  if (!nearbyRaw || nearbyRaw.length === 0) return [];

  const nearbyIds = nearbyRaw
    .map((u: any) => u[0])
    .filter((id: string) => id !== userId);

  if (nearbyIds.length === 0) return [];

  const matchedUsers = await prisma.user.findMany({
    where: {
      id: { in: nearbyIds },
    },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
    },
  });

  const notifyUserIds = matchedUsers.map((u) => u.id);

  if (notifyUserIds.length > 0) {
    await sendNotifications(
      notifyUserIds,
      `${nearbyIds.length} user${
        nearbyIds.length > 1 ? "s" : ""
      } matching in your location`,
      "Matching users"
    );
  }

  return matchedUsers;
};

const sendForgotPasswordOtpDB = async (email: string) => {
  const existringUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!existringUser) {
    throw new ApiError(404, "User not found");
  }
  // Generate OTP and expiry time
  const otp = generateOTP(); // 4-digit OTP

  await redisClient.set(`otp:${email}`, otp, "EX", 300),
    await emailQueue.add("forgotPasswordOtp", {
      email: existringUser.email,
      fullName: existringUser.fullName,
      otp: otp,
    });

  return otp;
};

const verifyForgotPasswordOtpCodeDB = async (payload: {
  email: string;
  otp: string;
}) => {
  const { email, otp } = payload;

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userId = user.id;

  const savedOtp = await redisClient.get(`otp:${email}`);
  if (!savedOtp) {
    throw new ApiError(400, "Invalid or expired OTP.");
  }

  if (otp !== savedOtp) {
    throw new ApiError(401, "Invalid OTP.");
  }

  // 2️⃣ Delete OTP from Redis after successful verification
  await redisClient.del(`otp:${email}`);

  const forgetToken = jwtHelpers.generateToken(
    { id: userId, email },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return { forgetToken };
};

const resetForgotPasswordDB = async (newPassword: string, userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }
  const email = existingUser.email as string;
  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      password: hashedPassword,
    },
  });
  return;
};

const myProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }

  const friendsCount = await prisma.friend.count({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: "Accepted",
    },
  });

  const matchedCount = await prisma.match.count({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
  });

  return { ...user, friendsCount, matchedCount };
};

const updateProfileIntoDB = async (userId: string, userData: User) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found for edit user");
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...userData,
    },
  });

  return;
};

const updateProfileImages = async (
  userId: string,
  files: { [fieldname: string]: Express.Multer.File[] },
  userData: User
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found for edit user");
  }
  const processImages = async (files?: Express.Multer.File[]) => {
    if (!files || files.length === 0) return [];
    return Promise.all(
      files.map((file) => uploadInSpace(file, "users/profileimages"))
    );
  };

  const takeProfileImage = files?.["profileImage"] || [];
  const takeGalleryImage1 = files?.["galleryImage1"] || [];
  const takeGalleryImage2 = files?.["galleryImage2"] || [];
  const takeGalleryImage3 = files?.["galleryImage3"] || [];
  const takeGalleryImage4 = files?.["galleryImage4"] || [];
  const takeGalleryImage5 = files?.["galleryImage5"] || [];
  const takeGalleryImage6 = files?.["galleryImage6"] || [];

  const profileImage =
    takeProfileImage.length > 0 ? await processImages(takeProfileImage) : [];
  const galleryImage1 =
    takeGalleryImage1.length > 0 ? await processImages(takeGalleryImage1) : [];
  const galleryImage2 =
    takeGalleryImage2.length > 0 ? await processImages(takeGalleryImage2) : [];
  const galleryImage3 =
    takeGalleryImage3.length > 0 ? await processImages(takeGalleryImage3) : [];
  const galleryImage4 =
    takeGalleryImage4.length > 0 ? await processImages(takeGalleryImage4) : [];
  const galleryImage5 =
    takeGalleryImage5.length > 0 ? await processImages(takeGalleryImage5) : [];
  const galleryImage6 =
    takeGalleryImage6.length > 0 ? await processImages(takeGalleryImage6) : [];

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...userData,
      profileImage:
        takeProfileImage.length > 0 ? profileImage[0] : user.profileImage,
      galleryImage1:
        galleryImage1.length > 0 ? galleryImage1[0] : user.galleryImage1,
      galleryImage2:
        galleryImage2.length > 0 ? galleryImage2[0] : user.galleryImage2,
      galleryImage3:
        galleryImage3.length > 0 ? galleryImage3[0] : user.galleryImage3,
      galleryImage4:
        galleryImage4.length > 0 ? galleryImage4[0] : user.galleryImage4,
      galleryImage5:
        galleryImage5.length > 0 ? galleryImage5[0] : user.galleryImage5,
      galleryImage6:
        galleryImage6.length > 0 ? galleryImage6[0] : user.galleryImage6,
    },
  });

  return;
};

const changePassword = async (
  userId: string,
  payload: { oldPassword: string; newPassword: string }
) => {
  const { oldPassword, newPassword } = payload;
  const userInfo = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  const isValidPassword = bcrypt.compareSync(oldPassword, userInfo.password);
  if (!isValidPassword) {
    throw new ApiError(409, "Your current password is wrong");
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  await sendNotification(
    userInfo.id,
    "Your password has been changed successfully done!",
    "Password changed!"
  );

  return;
};

const deleteAccount = async (userId: string) => {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new ApiError(404, "User not found for delete account");
  }
  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  return;
};

export const authService = {
  loginUserIntoDB,
  authLogin,
  myProfile,
  updateProfileIntoDB,
  userLocationUpdateInRedis,
  getNearbyUsers,
  sendForgotPasswordOtpDB,
  verifyForgotPasswordOtpCodeDB,
  resetForgotPasswordDB,
  updateProfileImages,
  changePassword,
  deleteAccount,
};
