import ApiError from "../../../errors/ApiErrors";
import redisClient from "../../../helpers/redis";
import prisma from "../../../shared/prisma";
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

const matchesUsers = async (userId: string) => {
  const userInfo = await prisma.user.findUnique({ where: { id: userId } });
  if (!userInfo) {
    throw new ApiError(404, "User not found");
  }

  const redisGeoKey = "userLocations";
  const radiusMile = userInfo.maxDistance || 50;
  const radiusKm = radiusMile * 1.60934;

  const nearbyRaw = (await redisClient.georadiusbymember(
    redisGeoKey,
    userId,
    radiusKm,
    "km",
    "WITHDIST",
    "WITHCOORD"
  )) as any[];

  if (!nearbyRaw || nearbyRaw.length === 0) return [];

  const nearbyIds = nearbyRaw
    .map((u: any) => u[0])
    .filter((id: string) => id !== userId);

  if (nearbyIds.length === 0) return [];

  const matchUsers = await prisma.user.findMany({
    where: {
      id: { not: userId, in: nearbyIds },
      gender: userInfo.interestedIn,
      relationship: userInfo.relationship,
      minAge: { gte: userInfo.minAge },
      maxAge: { lte: userInfo.maxAge },
      myEthnicity: { in: userInfo.ethinicity },
      religiousBeliefs: { in: userInfo.religion },
      intention: userInfo.intention,
      interests: { hasSome: userInfo.interests },
      politics: userInfo.politics,
      languages: userInfo.languages,
      height:
        userInfo.height == null
          ? undefined
          : userInfo.gender === "Female"
          ? { gte: userInfo.height }
          : { lte: userInfo.height },
      myChildren: userInfo.myChildren,
      familyPlans: userInfo.familyPlans,
    },
    select: {
      id: true,
      fullName: true,
      profileImage: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const matchedUsers = matchUsers.map((user) => {
    const friendId = [userId, user.id].sort().join("_");
    const existingFriendship = prisma.friend.findUnique({
      where: { uniqueKey: friendId },
    });
    return {
      ...user,
      isFriend: !!existingFriendship,
      isSendRequest: existingFriendship
        ? existingFriendship.then((f) => f?.status === "Pending")
        : false,
    };
  });

  //test commit

  return matchedUsers;
};

export const friendServices = {
  sendFriendRequest,
  myFriends,
  receiveRequests,
  getFriendById,
  acceptRequest,
  removeRequest,
  deleteFriend,
  matchesUsers,
};
