import express from "express";
import { UserControllers } from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/create",
  validateRequest(userValidation.userRegisterValidationSchema),
  UserControllers.createUser
);
router.post("/signup-verification", UserControllers.signupVerification);
router.get("/", auth(UserRole.Admin), UserControllers.getUsers);
router.get("/:id", auth(), UserControllers.getSingleUser);
router.put(
  "/:id",
  validateRequest(userValidation.userUpdateValidationSchema),
  auth(UserRole.Admin),
  UserControllers.updateUser
);
router.delete("/:id", auth(UserRole.Admin), UserControllers.deleteUser);

export const userRoutes = router;
