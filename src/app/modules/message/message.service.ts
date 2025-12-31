import { Request } from "express";
import { paginationHelper } from "../../../shared/pagination";
import prisma from "../../../shared/prisma";
import { uploadInSpace } from "../../../helpers/uploadInSpace";

const urlGenerate = async (files: {
  [fieldName: string]: Express.Multer.File[];
}) => {
  const processImages = async (files?: Express.Multer.File[]) => {
    if (!files || files.length === 0) return null;
    return Promise.all(
      files.map((file) => uploadInSpace(file, "messages/files"))
    );
  };

  const [fileUrl] = await Promise.all([processImages(files["files"])]);
  return fileUrl;
};

const personalMessages = async (roomId: string, query: any) => {
  const { page, limit, skip } = paginationHelper(query);

  const messages = await prisma.message.findMany({
    where: {
      roomId,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip,
  });

  const messageCount = await prisma.message.count({
    where: {
      roomId,
    },
  });

  const totalPages = Math.ceil(messageCount / limit);

  return {
    messageCount,
    currentPage: page,
    totalPages,
    messages,
  };
};

export const messageService = {
  urlGenerate,
  personalMessages,
};
