import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import admin from "../../../helpers/firebaseAdmin";

export const sendNotification = async (
  userId: string,
  title: string,
  body: string
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

    try {
      await admin.messaging().send(message);
    } catch (error) {
      console.log(error);
      return;
    }
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

  return notifications;
};

const singleNotificaton = async (notificationId: string) => {
  const notification = await prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found for the user");
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return notification;
};

export const notificationServices = {
  getNotificationsFromDB,
  singleNotificaton,
};
