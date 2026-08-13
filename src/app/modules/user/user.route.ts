import express from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/create",
  validateRequest(userValidation.userRegistrationSchema),
  UserControllers.createUser,
);
router.post(
  "/signup-verification",
  validateRequest(userValidation.verificationSchema),
  UserControllers.signupVerification,
);
router.get("/:id", auth(), UserControllers.getSingleUser);
router.post("/use-token", auth(), UserControllers.useToken);
router.post(
  "/buy-token",
  auth(),
  validateRequest(userValidation.paymentSchema),
  UserControllers.buyToken,
);

export const userRoutes = router;
