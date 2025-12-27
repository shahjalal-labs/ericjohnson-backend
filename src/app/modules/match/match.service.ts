import ApiError from "../../../errors/ApiErrors";
import redisClient from "../../../helpers/redis";
import prisma from "../../../shared/prisma";

const createMatch = async (userId: string, userIds: string[]) => {
  if (!userIds || userIds.length === 0) return;

  const existingMatches = await prisma.match.findMany({
    where: {
      OR: [
        {
          user1Id: userId,
          user2Id: { in: userIds },
        },
        {
          user2Id: userId,
          user1Id: { in: userIds },
        },
      ],
    },
    select: {
      user1Id: true,
      user2Id: true,
    },
  });

  const existingUserIds = new Set(
    existingMatches.map((m) => (m.user1Id === userId ? m.user2Id : m.user1Id))
  );

  const newUserIds = userIds.filter((id) => !existingUserIds.has(id));
  if (newUserIds.length === 0) return;

  const matchData = newUserIds.map((otherUserId) => ({
    user1Id: userId,
    user2Id: otherUserId,
  }));

  await prisma.match.createMany({
    data: matchData,
  });
  return;
};

const matchingUsers = async (userId: string) => {
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
      AND: [
        {
          OR: [
            { myEthnicity: { in: userInfo.ethinicity } },
            { ethinicity: { hasSome: userInfo.ethinicity } },
          ],
        },
        {
          OR: [
            { religiousBeliefs: { in: userInfo.religion } },
            { religion: { hasSome: userInfo.religion } },
          ],
        },
      ],
      interests: { hasSome: userInfo.interests },
      intention: userInfo.intention,
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

  const matchedUserIds: string[] = matchUsers.map((u) => u.id);

  await matchServices.createMatch(userId, matchedUserIds);

  return matchUsers;
};

const matchedMe = async (userId: string) => {
  const results = await prisma.match.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    orderBy: {
      createdAt: "desc",
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
      user2: {
        select: {
          id: true,
          fullName: true,
          profileImage: true,
        },
      },
      createdAt: true,
    },
  });

  return results.map((match) => {
    const otherUser = match.user1.id === userId ? match.user2 : match.user1;

    return {
      id: match.id,
      user: otherUser,
      createdAt: match.createdAt,
    };
  });
};

const deleteMatch = async (matchedId: string) => {
  const match = await prisma.match.findUnique({ where: { id: matchedId } });
  if (!match) {
    throw new ApiError(404, "Match not found");
  }
  await prisma.match.delete({ where: { id: matchedId } });
  return;
};

export const matchServices = {
  createMatch,
  matchingUsers,
  matchedMe,
  deleteMatch,
};
