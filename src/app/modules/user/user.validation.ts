import { z } from "zod";

const userRegistrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone Number at least 10 Digit long"),
  fullName: z.string().min(2, "Full name must be at least 3 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const verificationSchema = z.object({
  email: z.string().min(10, "Phone Number min 10 Digit"),
  otp: z.string().min(4, "OTP must be at least 4 characters long"),
  fcmToken: z.string().optional(),
});

export const userValidation = {
  userRegistrationSchema,
  verificationSchema,
};
