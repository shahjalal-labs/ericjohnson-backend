import { Intent } from "@prisma/client";
import prisma from "../../../shared/prisma";

const createIntent = async (userId: string, data: Intent) => {
  await prisma.intent.upsert({
    where: {
      userId,
    },
    create: {
      ...data,
      userId,
    },
    update: {
      ...data,
    },
  });
  return;
};

const checkIntent = async (userId: string) => {
  const isExist = await prisma.intent.findUnique({
    where: {
      userId,
    },
  });
  return {
    isExist: isExist ? true : false,
  };
};

const getAllIntents = async () => {
  const results = await prisma.intent.findMany();
  return results;
};

const getIntentById = async (id: string) => {
  const result = await prisma.intent.findUnique({ where: { id } });
  return result;
};

const updateIntent = async (id: string, data: any) => {
  await prisma.intent.update({ where: { id }, data });
  return;
};

const deleteIntent = async (id: string) => {
  await prisma.intent.delete({ where: { id } });
  return;
};

export const intentServices = {
  createIntent,
  checkIntent,
  getAllIntents,
  getIntentById,
  updateIntent,
  deleteIntent,
};
