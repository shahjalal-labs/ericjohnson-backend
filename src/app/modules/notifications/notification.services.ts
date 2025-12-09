import axios from "axios";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import config from "../../../config";
import admin from "../../../helpers/firebaseAdmin";

export const oneSignalNotify = async (
  userId: string,
  body: string,
  title: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  await prisma.notification.create({
    data: {
      userId,
      title,
      body,
    },
  });

  if (user?.fcmToken) {
    await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: config.onesignal.app_id,
        target_channel: "push",
        include_subscription_ids: [user.fcmToken],
        headings: { en: title },
        contents: { en: body },
      },
      {
        headers: {
          Authorization: `Basic ${config.onesignal.api_key}`,
          "Content-Type": "application/json",
        },
      }
    );
  }

  return;
};

export const oneSignalNotifies = async (
  userIds: string[],
  body: string,
  title: string
) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];

  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      fcmToken: { not: null },
    },
    select: { id: true, fcmToken: true },
  });

  await prisma.notification.createMany({
    data: ids.map((id) => ({
      userId: id,
      title,
      body,
    })),
  });

  const tokens = users.map((u) => u.fcmToken!);

  if (tokens.length > 0) {
    await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: config.onesignal.app_id,
        target_channel: "push",
        include_subscription_ids: tokens,
        headings: { en: title },
        contents: { en: body },
      },
      {
        headers: {
          Authorization: `Basic ${config.onesignal.api_key}`,
          "Content-Type": "application/json",
        },
      }
    );
  }

  return;
};

export const sendNotification = async (
  userId: string,
  body: string,
  title: string
) => {
  const userInfo = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  await prisma.notification.create({
    data: {
      userId,
      title,
      body,
    },
  });

  if (userInfo?.fcmToken) {
    const message = {
      notification: { title, body },
      token: userInfo.fcmToken,
    };

    await admin.messaging().send(message);
    return;
  }

  return;
};

export const sendNotifications = async (
  userIds: string[],
  body: string,
  title: string
) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  const users = await prisma.user.findMany({
    where: {
      id: { in: ids },
      fcmToken: { not: null },
    },
    select: { id: true, fcmToken: true },
  });

  await prisma.notification.createMany({
    data: ids.map((id) => ({
      userId: id,
      title,
      body,
    })),
  });

  const tokens = users.map((u) => u.fcmToken!);

  if (tokens.length > 0) {
    const message = {
      notification: { title, body },
      tokens,
    };

    await admin.messaging().sendEachForMulticast(message);
    return;
  }

  return;
};

const getNotificationsFromDB = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      userId: userId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (notifications.length === 0) {
    throw new ApiError(404, "No notifications found for the user");
  }

  return notifications;
};

const getSingleNotificationFromDB = async (notificationId: string) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
    },
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found for the user");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return notification;
};

export const notificationServices = {
  getNotificationsFromDB,
  getSingleNotificationFromDB,
};
