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
  fcmToken: string;
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
    user.interests.length !== 0 &&
    user.galleryImages.length !== 0;

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
  fcmToken: string;
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
      user.interests.length !== 0 &&
      user.galleryImages.length !== 0;

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
      phoneNumber: "",
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

  // await sendNotification(
  //   newUser.id,
  //   "Your account create has been successfully done!",
  //   "Welcome!"
  // );

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
  const redisGeoKey = "userLocations"; // you can keep all users under one key

  // Use GEOADD to store location
  await redisClient.geoadd(
    redisGeoKey,
    userLocation.longitude,
    userLocation.latitude,
    userId
  );

  return;
};

export const getNearbyUsers = async (userId: string, radiusKm: number = 1) => {
  const userInfo = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      // intent: {
      //   select: {
      //     intent: true,
      //     transportCheckin: true,
      //     journeyCheckin: true,
      //   },
      // },
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
      // intent: {
      //   transportCheckin: userInfo.intent?.transportCheckin ?? undefined,
      //   journeyCheckin: userInfo.intent?.journeyCheckin ?? undefined,
      // },
    },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
      // galleryImages: true,
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
    select: {
      id: true,
      profileImage: true,
      fullName: true,
      email: true,
      bio: true,
      gender: true,
      address: true,
      phoneNumber: true,
      dob: true,
      // interests: true,
      // galleryImages: true,
      // interestedIn: true,
      // relationship: true,
      // ethinicity: true,
      // religion: true,
      // intention: true,
      profession: true,
    },
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

  return { ...user, friendsCount };
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
  const takeGalleryImages = files?.["galleryImages"] || [];

  const profileImage =
    takeProfileImage.length > 0 ? await processImages(takeProfileImage) : [];
  const galleryImages =
    takeGalleryImages.length > 0 ? await processImages(takeGalleryImages) : [];

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...userData,
      profileImage:
        takeProfileImage.length > 0 ? profileImage[0] : user.profileImage,
      galleryImages:
        takeGalleryImages.length > 0 ? galleryImages : user.galleryImages,
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
