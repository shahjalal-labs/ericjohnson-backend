import ApiError from "../../../errors/ApiErrors";
import redisClient from "../../../helpers/redis";
import prisma from "../../../shared/prisma";
import { matchServices } from "../match/match.service";
import { sendNotification } from "../notifications/notification.services";

const sendFriendRequest = async (user1Id: string, user2Id: string) => {
  const myInfo = await prisma.user.findUnique({ where: { id: user1Id } });
  if (!myInfo) {
    throw new ApiError(404, "My information not found");
  }
  const userInfo = await prisma.user.findUnique({ where: { id: user2Id } });
  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  const uniqueKey = [user1Id, user2Id].sort().join("_");

  const existingRequest = await prisma.friend.findUnique({
    where: {
      uniqueKey: uniqueKey,
    },
  });

  if (existingRequest) {
    if (existingRequest.status === "Pending") {
      throw new ApiError(400, "Friend request already sent");
    } else if (existingRequest.status === "Accepted") {
      throw new ApiError(400, "You are already friends");
    }
  }

  await prisma.friend.create({
    data: {
      user1Id,
      user2Id,
      uniqueKey: uniqueKey,
    },
  });

  await sendNotification(
    user2Id,
    "You have a new friend request",
    `${myInfo.fullName} has sent you a friend request.`
  );
  return;
};

const myFriends = async (userId: string) => {
  const results = await prisma.friend.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      status: "Accepted",
    },
    select: {
      id: true,
      user1Id: true,
      user2Id: true,
      updatedAt: true,
      user1: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      user2: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const friends = results.map((friend) => {
    const isUser1 = friend.user1Id === userId;
    const user = isUser1 ? friend.user2 : friend.user1;

    return {
      friendshipId: friend.id,
      id: user.id,
      fullName: user.fullName,
      profileImage: user.profileImage,
      updatedAt: friend.updatedAt,
    };
  });

  return { friends };
};

const receiveRequests = async (userId: string) => {
  const results = await prisma.friend.findMany({
    where: {
      user2Id: userId,
      status: "Pending",
    },
    select: {
      id: true,
      user1: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    requests: results,
  };
};

const getFriendById = async (id: string) => {
  const result = await prisma.friend.findUnique({ where: { id } });
  return result;
};

const acceptRequest = async (requestId: string) => {
  const isExist = await prisma.friend.findUnique({
    where: { id: requestId },
  });
  if (!isExist) {
    throw new ApiError(404, "Friend request not found");
  }
  if (isExist.status === "Accepted") {
    throw new ApiError(400, "Friend request already accepted");
  }

  await prisma.friend.update({
    where: { id: requestId },
    data: { status: "Accepted" },
  });

  await sendNotification(
    isExist.user1Id,
    "Friend request accepted",
    `Your friend request has been accepted. You are now friends!`
  );
  return;
};

const removeRequest = async (id: string) => {
  const isExist = await prisma.friend.findUnique({
    where: { id, status: "Pending" },
  });
  if (!isExist) {
    throw new ApiError(404, "Friendship not found");
  }
  await prisma.friend.delete({ where: { id } });
  return;
};

const deleteFriend = async (id: string) => {
  const isExist = await prisma.friend.findUnique({
    where: { id },
  });
  if (!isExist) {
    throw new ApiError(404, "Friendship not found");
  }
  await prisma.friend.delete({ where: { id } });
  return;
};

export const friendServices = {
  sendFriendRequest,
  myFriends,
  receiveRequests,
  getFriendById,
  acceptRequest,
  removeRequest,
  deleteFriend,
};
