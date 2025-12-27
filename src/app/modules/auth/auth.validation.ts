import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  fcmToken: z.string().min(1, "FCM token is required").optional(),
});

const authLoginSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  fullName: z.string().min(1, "Full Name is required").optional(),
  fcmToken: z.string().min(1, "FCM token is required").optional(),
});

const locationUpdateSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be greater than or equal to -90")
    .max(90, "Latitude must be less than or equal to 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be greater than or equal to -180")
    .max(180, "Longitude must be less than or equal to 180"),
});

const VicesSchema = z.array(z.record(z.string()));
const updateProfileSchema = z
  .object({
    fullName: z.string().min(1),
    phoneNumber: z.string().min(7).max(20),
    gender: z.enum(["Male", "Female", "Other"]),
    visibleGender: z.boolean(),
    dob: z.string().datetime(),
    visibleDob: z.boolean(),
    profession: z.string().min(1),
    visibleProfession: z.boolean(),
    bio: z.string().max(500),
    visibleBio: z.boolean(),
    address: z.string().min(1),
    visibleAddress: z.boolean(),
    religiousBeliefs: z.string(),
    visibleReligiousBeliefs: z.boolean(),
    politics: z.string(),
    visiblePolitics: z.boolean(),
    languages: z.string(),
    visibleLanguages: z.boolean(),
    intention: z.string(),
    visibleIntention: z.boolean(),
    height: z.number().int().positive(),
    visibleHeight: z.boolean(),
    myEthnicity: z.string(),
    visibleMyEthnicity: z.boolean(),
    myChildren: z.string(),
    visibleMyChildren: z.boolean(),
    familyPlans: z.string(),
    visibleFamilyPlans: z.boolean(),
    vices: VicesSchema.optional(),
    visibleVices: z.boolean(),
    maxDistance: z.number().int().min(1).max(1000),
    interestedIn: z.enum(["Male", "Female", "Other"]),
    minAge: z.number().int().min(18),
    maxAge: z.number().int().max(100),
    relationship: z.string(),
    ethinicity: z.array(z.string()).min(1),
    isEthnicityBreak: z.boolean(),
    religion: z.array(z.string()).min(1),
    isReligionBreak: z.boolean(),
    interests: z.array(z.string()).min(1),
  })
  .partial();

export const authValidation = {
  updateProfileSchema,
  authLoginSchema,
  locationUpdateSchema,
  loginSchema,
};
