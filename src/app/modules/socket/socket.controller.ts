import { Server, Socket } from "socket.io";
import prisma from "../../../shared/prisma";
import redisClient from "../../../helpers/redis";

// Chat messaging now runs on the shared socket.io server.
type ChatSocket = Socket & {
  userId?: string;
};

const onlineUsers = new Map<string, Set<string>>();

const getTokenFromSocket = (socket: any) => {
  const tokenCandidates = [
    socket.handshake?.auth?.token,
    socket.handshake?.headers?.["x-token"],
    socket.handshake?.query?.token,
    socket.handshake?.query?.["x-token"],
  ];

  const token = tokenCandidates.find((candidate) => !!candidate);
  return Array.isArray(token) ? token[0] : token;
};

const setUserOnline = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId) ?? new Set<string>();
  sockets.add(socketId);
  onlineUsers.set(userId, sockets);
};

const setUserOffline = (userId: string, socketId: string) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
  }
};

const isUserOnline = (userId?: string) => !!userId && onlineUsers.has(userId);

const buildConversationsForUser = async (targetUserId: string) => {
  const rooms = await prisma.room.findMany({
    where: {
      OR: [{ user1Id: targetUserId }, { user2Id: targetUserId }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      user1: {
        select: { id: true, fullName: true, profileImage: true },
      },
      user2: {
        select: { id: true, fullName: true, profileImage: true },
      },
    },
  });

  return Promise.all(
    rooms.map(async (room) => {
      const partner = room.user1Id === targetUserId ? room.user2 : room.user1;
      const isActive = isUserOnline(partner?.id as string);

      const redisKey = `room:${room.id}:messages`;
      const unreadKey = `room:${room.id}:unread:${targetUserId}`;

      const buffered = await redisClient.lrange(redisKey, -1, -1);
      const lastMessage = buffered.length > 0 ? JSON.parse(buffered[0]) : null;

      const unreadCountStr = await redisClient.get(unreadKey);
      const unreadCount = parseInt(unreadCountStr || "0", 10);

      const lastMessageContent =
        lastMessage?.content ||
        (lastMessage?.fileUrl?.length > 0 ? "sent file" : null);

      return {
        roomId: room.id,
        partner: {
          id: partner?.id,
          fullName: partner?.fullName,
          profileImage: partner?.profileImage,
          isActive,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessageContent,
              createdAt: lastMessage?.createdAt || null,
            }
          : null,
        unreadCount,
      };
    }),
  );
};

export const registerChatHandlers = (io: Server) => {
  io.on("connection", (socket: ChatSocket) => {
    const token = getTokenFromSocket(socket);
    const userId = socket.userId || (socket.handshake.auth?.userId as string);

    if (!token || !userId) {
      socket.disconnect(true);
      return;
    }

    socket.userId = userId;
    socket.join(userId);
    setUserOnline(userId, socket.id);

    const emitConversations = async (targetUserId: string) => {
      const conversations = await buildConversationsForUser(targetUserId);
      socket.emit("conversation", {
        conversations,
      });
    };

    socket.on("subscribe", async ({ receiverId }) => {
      if (!receiverId) {
        socket.emit("error", {
          message: "receiverId is required",
        });
        return;
      }

      const [u1, u2] = [userId, receiverId].sort();

      const room = await prisma.room.upsert({
        where: {
          user1Id_user2Id: {
            user1Id: u1,
            user2Id: u2,
          },
        },
        update: {},
        create: { user1Id: u1, user2Id: u2 },
      });

      if (socket.data.roomId && socket.data.roomId !== room.id) {
        socket.leave(socket.data.roomId);
      }

      socket.data.roomId = room.id;
      socket.join(room.id);

      const unreadKey = `room:${room.id}:unread:${userId}`;
      await redisClient.set(unreadKey, "0");

      const redisKey = `room:${room.id}:messages`;
      const redisRaw = await redisClient.lrange(redisKey, -30, -1);
      const messages = redisRaw.reverse().map((msg) => JSON.parse(msg));

      socket.emit("past-messages", {
        roomId: room.id,
        messages,
      });

      await emitConversations(userId);
    });

    socket.on("send-message", async ({ receiverId, content, fileUrl }) => {
      const roomId = socket.data.roomId;

      if (!roomId) {
        socket.emit("error", {
          message: "You are not subscribed to any room",
        });
        return;
      }

      if (!receiverId) {
        socket.emit("error", {
          message: "receiverId is required",
        });
        return;
      }

      const roomInfo = await prisma.room.findUnique({
        where: { id: roomId },
        select: { user1Id: true, user2Id: true },
      });

      if (!roomInfo) {
        socket.emit("error", {
          message: "Room not found",
        });
        return;
      }

      const messagePayload = {
        content,
        user1Id: userId,
        user2Id: receiverId,
        roomId,
        fileUrl: fileUrl ?? [""],
        createdAt: new Date().toISOString(),
      };

      const redisKey = `room:${roomId}:messages`;
      await redisClient.rpush(redisKey, JSON.stringify(messagePayload));

      const unreadKey = `room:${roomId}:unread:${receiverId}`;
      await redisClient.incr(unreadKey);

      const count = await redisClient.llen(redisKey);
      if (count >= 30) {
        const messagesToSaveRaw = await redisClient.lrange(redisKey, 0, 14);
        const messagesToSave = messagesToSaveRaw.map((msg) => JSON.parse(msg));

        await prisma.message.createMany({ data: messagesToSave });
        await redisClient.ltrim(redisKey, 15, -1);
      }

      await prisma.room.update({
        where: {
          id: roomId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      io.to(receiverId).emit("new-message", {
        message: messagePayload,
        roomId,
      });

      await emitConversations(receiverId);
      await emitConversations(userId);
    });

    socket.on("conversation", async () => {
      await emitConversations(userId);
    });

    socket.on("unread-reset", async ({ chatRoomId }) => {
      const roomId = chatRoomId || socket.data.roomId;

      if (!roomId) {
        socket.emit("error", {
          message: "chatRoomId is required",
        });
        return;
      }

      const unreadKey = `room:${roomId}:unread:${userId}`;
      await redisClient.set(unreadKey, "0");

      await emitConversations(userId);
    });

    socket.on("disconnect", () => {
      setUserOffline(userId, socket.id);
    });
  });
};
