import prisma from "../../../shared/prisma";

const createMatch = async (userId: string, userIds: []) => {
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

const myMatches = async (userId: string) => {
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

const getMatchById = async (id: string) => {
  const result = await prisma.match.findUnique({ where: { id } });
  return result;
};

const updateMatch = async (id: string, data: any) => {
  await prisma.match.update({ where: { id }, data });
  return;
};

const deleteMatch = async (id: string) => {
  await prisma.match.delete({ where: { id } });
  return;
};

export const matchServices = {
  createMatch,
  myMatches,
  getMatchById,
  updateMatch,
  deleteMatch,
};
