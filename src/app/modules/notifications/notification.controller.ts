import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { notificationServices } from "./notification.services";

const getNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const notifications = await notificationServices.getNotificationsFromDB(
    userId
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notifications retrieved successfully",
    data: notifications,
  });
});

const getSingleNotificationById = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const notification = await notificationServices.getSingleNotificationFromDB(
    notificationId
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notification retrieved successfully",
    data: notification,
  });
});

export const notificationController = {
  getNotifications,
  getSingleNotificationById,
};
