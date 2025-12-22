import express from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/create",
  validateRequest(userValidation.userRegisterValidationSchema),
  UserControllers.createUser
);
router.post("/signup-verification", UserControllers.signupVerification);
router.get("/:id", auth(), UserControllers.getSingleUser);

export const userRoutes = router;
