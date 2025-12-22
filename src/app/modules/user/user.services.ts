import { User } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import bcrypt from "bcryptjs";
import prisma from "../../../shared/prisma";
import generateOTP from "../../../helpers/generateOtp";
import redisClient from "../../../helpers/redis";
import { sendNotification } from "../notifications/notification.services";
import { emailQueue } from "../../../queues/emailQueue";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import config from "../../../config";

//create new user
const createUserIntoDB = async (payload: User) => {
  const existingUser = await prisma.user.findFirst({
    where: { email: payload.email },
  });
  if (existingUser) throw new ApiError(409, "email already exist!");

  const hashedPassword = bcrypt.hashSync(payload.password, 10);

  // Prepare pending user object
  const pendingUserData = {
    email: payload.email,
    fullName: payload.fullName,
    phoneNumber: payload.phoneNumber,
    password: hashedPassword,
  };

  // Save pending user in Redis (store as JSON string)
  await redisClient.set(
    `pendingUser:${payload.email}`,
    JSON.stringify(pendingUserData),
    "EX",
    300 // Optional: expire after 5 minutes if you want
  );

  // Generate OTP and expiry time
  const otp = generateOTP(); // 4-digit OTP
  await redisClient.set(`otp:${payload.email}`, otp, "EX", 300);

  await emailQueue.add("sendOtp", {
    email: payload.email,
    fullName: payload.fullName,
    otp,
  });

  return otp;
};

// Verify user using OTP for signup
const signupVerification = async (payload: {
  email: string;
  otp: string;
  fcmToken?: string;
}) => {
  const { email, otp, fcmToken } = payload;

  const savedOtp = await redisClient.get(`otp:${email}`);
  if (!savedOtp) throw new ApiError(400, "Invalid or expired OTP.");

  if (otp !== savedOtp) throw new ApiError(401, "Invalid OTP.");

  const pendingUserStr = await redisClient.get(`pendingUser:${email}`);
  if (!pendingUserStr) {
    throw new ApiError(404, "No pending user found. Please sign up again.");
  }
  const pendingUser = JSON.parse(pendingUserStr);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: pendingUser.email,
        phoneNumber: pendingUser.phoneNumber,
        fullName: pendingUser.fullName,
        password: pendingUser.password,
        fcmToken: fcmToken || null,
      },
    });

    await sendNotification(
      createdUser.id,
      "Your account create has been successfully done!",
      "Welcome!"
    );
    return createdUser;
  });

  // 5️⃣ Clean up Redis data after successful user creation
  await Promise.all([
    redisClient.del(`otp:${email}`),
    redisClient.del(`pendingUser:${email}`),
  ]);

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as string,
    config.jwt.expires_in as string
  );

  return {
    accessToken,
    userId: user.id,
    email: user.email,
    role: user.role,
    isSetup: false,
  };
};

//get single user
const getSingleUserIntoDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(404, "user not found!");
  }
  return {
    id: user.id,
    email: user.email,
    profileImage: user.profileImage,
    fullName: user.fullName,
    bio: user.visibleBio ? user.bio : undefined,
    phoneNumber: user.phoneNumber,
    gender: user.visibleGender ? user.gender : undefined,
    dob: user.visibleDob ? user.dob : undefined,
    galleryImage1: user.galleryImage1,
    galleryImage2: user.galleryImage2,
    galleryImage3: user.galleryImage3,
    galleryImage4: user.galleryImage4,
    galleryImage5: user.galleryImage5,
    galleryImage6: user.galleryImage6,
    profession: user.visibleProfession ? user.profession : undefined,
    address: user.visibleAddress ? user.address : undefined,
    religiousBeliefs: user.visibleReligiousBeliefs
      ? user.religiousBeliefs
      : undefined,
    politics: user.visiblePolitics ? user.politics : undefined,
    languages: user.visibleLanguages ? user.languages : undefined,
    intention: user.visibleIntention ? user.intention : undefined,
    height: user.visibleHeight ? user.height : undefined,
    myEthnicity: user.visibleMyEthnicity ? user.myEthnicity : undefined,
    myChildren: user.visibleMyChildren ? user.myChildren : undefined,
    familyPlans: user.visibleFamilyPlans ? user.familyPlans : undefined,
    vices: user.visibleVices ? user.vices : undefined,
    maxDistance: user.maxDistance,
    interestedIn: user.interestedIn,
    minAge: user.minAge,
    maxAge: user.maxAge,
    relationship: user.relationship,
    ethnicity: user.ethinicity,
    isEthnicityBreak: user.isEthnicityBreak,
    religion: user.religion,
    isReligionBreak: user.isReligionBreak,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const userService = {
  createUserIntoDB,
  signupVerification,
  getSingleUserIntoDB,
};
