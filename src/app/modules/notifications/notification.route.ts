import express from "express";
import { notificationController } from "./notification.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/", auth(), notificationController.getNotifications);
router.patch(
  "/:notificationId",
  auth(),
  notificationController.singleNotificaton
);

export const notificationsRoute = router;
