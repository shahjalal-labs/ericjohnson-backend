import { WebSocket, WebSocketServer } from "ws";
import { Request } from "express";
import prisma from "../../../shared/prisma";
import { verifyWebSocketToken } from "./socket.service";
import { parse } from "url";
import { CustomWebSocket } from "./socket.interface";
import redisClient from "../../../helpers/redis";
import { v4 as uuidv4 } from "uuid";
import { removeInviteForUser } from "./utility";

const roomUsers = new Map<string, Set<WebSocket>>();
const connectedUsers = new Map<string, CustomWebSocket>();
const lastMatchesMap = new WeakMap<WebSocket, string[]>(); // only string arrays

let wss;

export function setupWebSocketServer(server: any) {
  wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: CustomWebSocket, req: Request) => {
    const { query } = parse(req.url!, true);
    let authToken = req.headers["x-token"] as string;
    if (!authToken && query["x-token"]) {
      authToken = Array.isArray(query["x-token"])
        ? query["x-token"][0]
        : query["x-token"];
    }

    const decoded = verifyWebSocketToken(ws, authToken);
    if (!decoded) {
      ws.close();
      return;
    }
    const userId = decoded.id;
    ws.userId = userId;
    connectedUsers.set(userId, ws);
    if (!roomUsers.has(userId)) roomUsers.set(userId, new Set());
    roomUsers.get(userId)?.add(ws);

    let roomId: string | null = null;

    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.ping();
    }, 30000);

    const conversations = await prisma.room.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
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
    const connectedUserIds = Array.from(connectedUsers.keys()).filter(
      (id) => !!id
    );

    const formattedConversations = await Promise.all(
      conversations.map(async (room) => {
        const partner = room.user1Id === userId ? room.user2 : room.user1;
        const isActive = connectedUserIds.includes(partner?.id as string);

        const redisKey = `room:${room.id}:messages`;
        const unreadKey = `room:${room.id}:unread:${userId}`;

        const [redisRaw, unreadCountStr] = await Promise.all([
          redisClient.lrange(redisKey, 0, -1),
          redisClient.get(unreadKey),
        ]);

        const unreadCount = parseInt(unreadCountStr || "0", 10);
        let latestMessage = null;

        if (redisRaw.length > 0) {
          const redisMessages = redisRaw.map((msg) => JSON.parse(msg));

          // Sort by createdAt descending
          redisMessages.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          const latestRedisMsg = redisMessages[0];

          latestMessage = {
            content:
              latestRedisMsg.content ??
              (latestRedisMsg.fileUrl ? "sent file" : null),
            createdAt: latestRedisMsg.createdAt,
          };
        }

        return {
          roomId: room.id,
          partner: {
            id: partner?.id,
            fullName: partner?.fullName,
            profileImage: partner?.profileImage,
            isActive,
          },
          lastMessage: latestMessage,
          unreadCount, // From Redis
        };
      })
    );

    ws.send(
      JSON.stringify({
        type: "conversation",
        conversations: formattedConversations,
      })
    );

    ws.on("message", async (message: any) => {
      try {
        const {
          type,
          receiverId,
          content,
          fileUrl,
          chatRoomId,
          longitude,
          latitude,
          gameId,
          roomId: incommingRoomId,
          userIds,
          avatar,
          userName,
          score,
        } = JSON.parse(message.toString());

        const getConversationsForUser = async (targetUserId: string) => {
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
              const partner =
                room.user1Id === targetUserId ? room.user2 : room.user1;
              const isActive = connectedUserIds.includes(partner?.id as string);

              const redisKey = `room:${room.id}:messages`;
              const unreadKey = `room:${room.id}:unread:${targetUserId}`;

              // Get the latest message from Redis
              const buffered = await redisClient.lrange(redisKey, -1, -1);
              const lastMessage =
                buffered.length > 0 ? JSON.parse(buffered[0]) : null;

              // Get unread count from Redis (fallback to 0 if not found)
              const unreadCountStr = await redisClient.get(unreadKey);
              const unreadCount = parseInt(unreadCountStr || "0", 10);

              // Determine content
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
            })
          );
        };

        switch (type) {
          case "subscribe": {
            if (!receiverId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "receiverId is required",
                })
              );
            }

            const [u1, u2] = [userId, receiverId].sort();

            let room = await prisma.room.upsert({
              where: {
                user1Id_user2Id: {
                  user1Id: u1,
                  user2Id: u2,
                },
              },
              update: {},
              create: { user1Id: u1, user2Id: u2 },
            });

            roomId = room.id;

            const unreadKey = `room:${roomId}:unread:${userId}`;
            await redisClient.set(unreadKey, "0");

            roomUsers.forEach((clients, key) => {
              if (clients.has(ws)) {
                clients.delete(ws);
                if (clients.size === 0) roomUsers.delete(key);
              }
            });

            if (!roomUsers.has(roomId)) {
              roomUsers.set(roomId, new Set());
            }
            roomUsers.get(roomId)?.add(ws);

            const redisKey = `room:${roomId}:messages`;
            const redisRaw = await redisClient.lrange(redisKey, -30, -1);
            const messages = redisRaw.reverse().map((msg) => JSON.parse(msg));

            ws.send(
              JSON.stringify({
                type: "past-messages",
                roomId,
                messages: messages,
              })
            );

            const senderConversations = await getConversationsForUser(userId);
            ws.send(
              JSON.stringify({
                type: "conversation",
                conversations: senderConversations,
              })
            );

            break;
          }

          case "send-message": {
            if (!roomId) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "You are not subscribed to any room",
                })
              );
            }

            const roomInfo = await prisma.room.findUnique({
              where: { id: roomId },
              select: { user1Id: true, user2Id: true },
            });

            if (!roomInfo) {
              return ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Room not found",
                })
              );
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
              const messagesToSaveRaw = await redisClient.lrange(
                redisKey,
                0,
                14
              );
              const messagesToSave = messagesToSaveRaw.map((msg) =>
                JSON.parse(msg)
              );

              await prisma.message.createMany({ data: messagesToSave });

              await redisClient.ltrim(redisKey, 15, -1);
            }

            // Update the room's updatedAt
            await prisma.room.update({
              where: {
                id: roomId,
              },
              data: {
                updatedAt: new Date(),
              },
            });

            //send message to only the receiver
            const target = connectedUsers.get(receiverId);

            if (target && target.readyState === WebSocket.OPEN) {
              const receiverConversations = await getConversationsForUser(
                receiverId
              );

              target.send(
                JSON.stringify({
                  type: "new-message",
                  message: messagePayload,
                  roomId,
                })
              );

              target.send(
                JSON.stringify({
                  type: "conversation",
                  conversations: receiverConversations,
                })
              );
            }

            const senderConversations = await getConversationsForUser(userId);
            ws.send(
              JSON.stringify({
                type: "conversation",
                conversations: senderConversations,
              })
            );

            break;
          }

          case "conversation": {
            const conversations = await prisma.room.findMany({
              where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
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

            const connectedUserIds = Array.from(connectedUsers.keys()).filter(
              (id) => !!id
            );

            const formattedConversations = await Promise.all(
              conversations.map(async (room) => {
                const partner =
                  room.user1Id === userId ? room.user2 : room.user1;
                const isActive = connectedUserIds.includes(
                  partner?.id as string
                );

                const redisKey = `room:${room.id}:messages`;
                const unreadKey = `room:${room.id}:unread:${userId}`;
                const latestRaw = await redisClient.lrange(redisKey, -1, -1);

                const latestMsg =
                  latestRaw.length > 0 ? JSON.parse(latestRaw[0]) : null;

                // Get unread count from Redis
                const unreadCountStr = await redisClient.get(unreadKey);
                const unreadCount = parseInt(unreadCountStr || "0", 10);

                const latestMessage = latestMsg
                  ? {
                      content:
                        latestMsg.content ??
                        (latestMsg.fileUrl ? "sent file" : null),
                      createdAt: latestMsg.createdAt,
                    }
                  : null;

                return {
                  roomId: room.id,
                  partner: {
                    id: partner?.id,
                    fullName: partner?.fullName,
                    profileImage: partner?.profileImage,
                    isActive,
                  },
                  lastMessage: latestMessage,
                  unreadCount,
                };
              })
            );

            ws.send(
              JSON.stringify({
                type: "conversation",
                conversations: formattedConversations,
              })
            );

            break;
          }

          case "unread-reset": {
            const unreadKey = `room:${chatRoomId}:unread:${userId}`;
            await redisClient.set(unreadKey, "0");

            const conversations = await prisma.room.findMany({
              where: {
                OR: [{ user1Id: userId }, { user2Id: userId }],
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

            const connectedUserIds = Array.from(connectedUsers.keys()).filter(
              (id) => !!id
            );

            const formattedConversations = await Promise.all(
              conversations.map(async (room) => {
                const partner =
                  room.user1Id === userId ? room.user2 : room.user1;
                const isActive = connectedUserIds.includes(
                  partner?.id as string
                );

                const redisKey = `room:${room.id}:messages`;
                const unreadKey = `room:${room.id}:unread:${userId}`;
                const latestRaw = await redisClient.lrange(redisKey, -1, -1);

                const latestMsg =
                  latestRaw.length > 0 ? JSON.parse(latestRaw[0]) : null;

                // Get unread count from Redis
                const unreadCountStr = await redisClient.get(unreadKey);
                const unreadCount = parseInt(unreadCountStr || "0", 10);

                const latestMessage = latestMsg
                  ? {
                      content:
                        latestMsg.content ??
                        (latestMsg.fileUrl ? "sent file" : null),
                      createdAt: latestMsg.createdAt,
                    }
                  : null;

                return {
                  roomId: room.id,
                  partner: {
                    id: partner?.id,
                    fullName: partner?.fullName,
                    profileImage: partner?.profileImage,
                    isActive,
                  },
                  lastMessage: latestMessage,
                  unreadCount,
                };
              })
            );

            ws.send(
              JSON.stringify({
                type: "conversation",
                conversations: formattedConversations,
              })
            );
            break;
          }

          // case "update-location": {
          //   if (
          //     typeof latitude !== "number" ||
          //     typeof longitude !== "number" ||
          //     Number.isNaN(latitude) ||
          //     Number.isNaN(longitude) ||
          //     latitude < -90 ||
          //     latitude > 90 ||
          //     longitude < -180 ||
          //     longitude > 180
          //   ) {
          //     ws.send(
          //       JSON.stringify({
          //         type: "error",
          //         message: "Invalid latitude or longitude",
          //       })
          //     );
          //     break;
          //   }

          //   const redisGeoKey = "userLocations";

          //   await redisClient.geoadd(redisGeoKey, longitude, latitude, userId);

          //   const matches = await getNearbyUsers(userId, 1);
          //   const currentIds = matches.map((m: any) => m.id).sort(); // normalize order

          //   // get last match IDs
          //   const lastMatches = lastMatchesMap.get(ws) ?? [];
          //   const lastIds = [...lastMatches].sort();

          //   // check if IDs are different
          //   const isDifferent =
          //     currentIds.length !== lastIds.length ||
          //     currentIds.some((id, i) => id !== lastIds[i]);

          //   if (isDifferent) {
          //     lastMatchesMap.set(ws, currentIds);

          //     ws.send(
          //       JSON.stringify({
          //         type: "matches",
          //         message: `You and ${matches.length} people are at the same location`,
          //         matches,
          //       })
          //     );
          //   }

          //   // also update other matched users
          //   for (const match of matches) {
          //     const matchUserId = match.id;
          //     const matchWs = connectedUsers.get(matchUserId);

          //     if (matchWs && matchWs.readyState === WebSocket.OPEN) {
          //       const theirMatches = await getNearbyUsers(matchUserId, 1);
          //       const theirCurrentIds = theirMatches
          //         .map((m: any) => m.id)
          //         .sort();

          //       const lastTheirMatches = lastMatchesMap.get(matchWs) ?? [];
          //       const lastTheirIds = [...lastTheirMatches].sort();

          //       const theirIsDifferent =
          //         theirCurrentIds.length !== lastTheirIds.length ||
          //         theirCurrentIds.some((id, i) => id !== lastTheirIds[i]);

          //       if (theirIsDifferent) {
          //         lastMatchesMap.set(matchWs, theirCurrentIds);

          //         matchWs.send(
          //           JSON.stringify({
          //             type: "matches",
          //             message: `You and ${theirMatches.length} people are at the same location`,
          //             matches: theirMatches,
          //           })
          //         );
          //       }
          //     }
          //   }

          //   break;
          // }

          //for host to invite players

          case "invite-player": {
            if (!gameId) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "gameId is required",
                })
              );
              break;
            }
            if (userIds === undefined || userIds.length === 0) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "userIds is required",
                })
              );
            }

            const roomId = uuidv4();
            const hostKey = `gameRoom:${roomId}:${gameId}:host`;
            const playersKey = `gameRoom:${roomId}:${gameId}:players`;

            // ✅ store hostId at room level
            await redisClient.set(hostKey, userId);

            // ✅ host joins as first ready player
            await redisClient.rpush(
              playersKey,
              JSON.stringify({
                userId,
                hostId: userId,
                avatar,
                userName,
                status: "ready",
                score: 0,
              })
            );

            const inviteLink = `https://playspark.smtsigma.com/game?gameId=${gameId}&roomId=${roomId}&hostId=${userId}`;

            const invitePayload = {
              gameId,
              roomId,
              hostId: userId,
              hostName: userName,
              inviteLink,
              invitedAt: new Date().toISOString(),
            };

            for (const invitedUserId of userIds) {
              const inviteKey = `user:${invitedUserId}:invites`;
              const invitedUsersKey = `gameRoom:${roomId}:${gameId}:invitedUsers`;

              await redisClient.rpush(inviteKey, JSON.stringify(invitePayload));
              await redisClient.sadd(invitedUsersKey, invitedUserId);

              // 🔔 Send realtime invite if online
              const client = connectedUsers.get(invitedUserId);
              if (client?.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "invite-link",
                    ...invitePayload,
                  })
                );
              }
            }

            const playersRaw = await redisClient.lrange(playersKey, 0, -1);
            const players = playersRaw.map((item) => JSON.parse(item));

            ws.send(
              JSON.stringify({
                type: "leader-board-data",
                gameId,
                roomId: roomId,
                players,
              })
            );

            break;
          }

          case "get-invited-games": {
            const inviteKey = `user:${userId}:invites`;

            const invitesRaw = await redisClient.lrange(inviteKey, 0, -1);
            const invites = invitesRaw.map((i) => JSON.parse(i));

            ws.send(
              JSON.stringify({
                type: "invited-games",
                games: invites,
              })
            );

            break;
          }

          //for player ready status
          case "user-ready": {
            if (!gameId || !incommingRoomId) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "gameId & roomId required",
                })
              );
              break;
            }

            const hostKey = `gameRoom:${incommingRoomId}:${gameId}:host`;
            const playersKey = `gameRoom:${incommingRoomId}:${gameId}:players`;

            const hostId = await redisClient.get(hostKey);
            if (!hostId) {
              ws.send(
                JSON.stringify({ type: "error", message: "Invalid room" })
              );
              break;
            }

            // remove existing entry
            const existing = await redisClient.lrange(playersKey, 0, -1);
            for (const item of existing) {
              if (JSON.parse(item).userId === userId) {
                await redisClient.lrem(playersKey, 1, item);
                break;
              }
            }

            // add / update player
            await redisClient.rpush(
              playersKey,
              JSON.stringify({
                userId,
                hostId,
                avatar,
                userName,
                status: "ready",
                score: 0,
              })
            );

            const playersRaw = await redisClient.lrange(playersKey, 0, -1);
            const players = playersRaw.map((item) => JSON.parse(item));

            // broadcast
            players.forEach((p) => {
              const client = connectedUsers.get(p.userId);
              if (client?.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "leader-board-data",
                    gameId,
                    roomId: incommingRoomId,
                    players,
                  })
                );
              }
            });

            await removeInviteForUser(
              redisClient,
              userId,
              gameId,
              incommingRoomId
            );

            const inviteKey = `user:${userId}:invites`;
            const invitesRaw = await redisClient.lrange(inviteKey, 0, -1);
            const invites = invitesRaw.map((i) => JSON.parse(i));

            ws.send(
              JSON.stringify({
                type: "invited-games",
                games: invites,
              })
            );

            break;
          }

          //only host can start the game
          case "start-game": {
            if (!gameId || !incommingRoomId) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "gameId & roomId required",
                })
              );
              break;
            }

            const hostKey = `gameRoom:${incommingRoomId}:${gameId}:host`;
            const playersKey = `gameRoom:${incommingRoomId}:${gameId}:players`;

            const hostId = await redisClient.get(hostKey);

            // 🔒 host-only guard
            if (userId !== hostId) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Only host can start the game",
                })
              );
              break;
            }

            const playersRaw = await redisClient.lrange(playersKey, 0, -1);
            const updatedPlayers = playersRaw.map((u) => {
              const p = JSON.parse(u);
              return { ...p, status: "playing" };
            });

            // replace list
            await redisClient.del(playersKey);
            for (const p of updatedPlayers) {
              await redisClient.rpush(playersKey, JSON.stringify(p));
            }

            // broadcast
            updatedPlayers.forEach((p) => {
              const client = connectedUsers.get(p.userId);
              if (client?.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "leader-board-data",
                    gameId,
                    roomId: incommingRoomId,
                    players: updatedPlayers,
                  })
                );

                client.send(
                  JSON.stringify({
                    type: "game-starting",
                    gameId,
                    roomId: incommingRoomId,
                  })
                );
              }
            });

            const invitedUsersKey = `gameRoom:${incommingRoomId}:${gameId}:invitedUsers`;
            const invitedUserIds = await redisClient.smembers(invitedUsersKey);

            for (const invitedUserId of invitedUserIds) {
              await removeInviteForUser(
                redisClient,
                invitedUserId,
                gameId,
                incommingRoomId
              );
            }
            await redisClient.del(invitedUsersKey);

            break;
          }

          case "score-update": {
            if (!gameId || !incommingRoomId) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "gameId & roomId required",
                })
              );
              break;
            }

            const playersKey = `gameRoom:${incommingRoomId}:${gameId}:players`;

            const playersRaw = await redisClient.lrange(playersKey, 0, -1);
            if (playersRaw.length === 0) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "No players found",
                })
              );
              break;
            }

            let updatedPlayers = [];
            let scoreUpdated = false;

            for (const item of playersRaw) {
              const player = JSON.parse(item);

              if (player.userId === userId) {
                if (player.status !== "playing") {
                  ws.send(
                    JSON.stringify({
                      type: "error",
                      message: "Game not started",
                    })
                  );
                  return;
                }

                player.score = (player.score || 0) + score;
                scoreUpdated = true;
              }

              updatedPlayers.push(player);
            }

            if (!scoreUpdated) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Player not found in room",
                })
              );
              break;
            }

            // 🔁 replace list
            await redisClient.del(playersKey);
            for (const p of updatedPlayers) {
              await redisClient.rpush(playersKey, JSON.stringify(p));
            }

            // 📢 broadcast updated leaderboard
            updatedPlayers.forEach((p) => {
              const client = connectedUsers.get(p.userId);
              if (client?.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "leader-board-data",
                    gameId,
                    roomId: incommingRoomId,
                    players: updatedPlayers,
                  })
                );
              }
            });

            break;
          }

          // User leaves the game
          case "leave-game": {
            if (!gameId || !incommingRoomId) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "gameId & roomId required",
                })
              );
              break;
            }

            const playersKey = `gameRoom:${incommingRoomId}:${gameId}:players`;

            const playersRaw = await redisClient.lrange(playersKey, 0, -1);
            const players = playersRaw.map((p) => JSON.parse(p));

            // Host leaving

            const updatedPlayers = players.map((p) =>
              p.userId === userId ? { ...p, status: "leave" } : p
            );

            // Broadcast updated players
            updatedPlayers.forEach((p) => {
              const client = connectedUsers.get(p.userId);
              if (client?.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "leader-board-data",
                    gameId,
                    roomId: incommingRoomId,
                    players: updatedPlayers,
                  })
                );
              }
            });
            break;
          }

          //if only one player is left, end the game
          case "end-game": {
            if (!gameId || !incommingRoomId) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "gameId & roomId required",
                })
              );
              break;
            }

            const hostKey = `gameRoom:${incommingRoomId}:${gameId}:host`;
            const playersKey = `gameRoom:${incommingRoomId}:${gameId}:players`;
            const playersRaw = await redisClient.lrange(playersKey, 0, -1);
            const players = playersRaw.map((p) => JSON.parse(p));

            if (players.length === 1) {
              const finishedPlayers = players.map((p) => ({
                ...p,
                status: "finished",
              }));

              await redisClient.del(playersKey);
              for (const p of finishedPlayers) {
                await redisClient.rpush(playersKey, JSON.stringify(p));
              }

              const topScore = Math.max(...finishedPlayers.map((p) => p.score));
              const topPlayers = finishedPlayers.filter(
                (p) => p.score === topScore
              );

              // Broadcast
              finishedPlayers.forEach((p) => {
                const client = connectedUsers.get(p.userId);
                if (client?.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      type: "leader-board-data",
                      gameId,
                      roomId: incommingRoomId,
                      players: finishedPlayers,
                    })
                  );

                  client.send(
                    JSON.stringify({
                      type: "game-end",
                      gameId,
                      roomId: incommingRoomId,
                    })
                  );
                }
              });

              topPlayers.forEach((p) => {
                const client = connectedUsers.get(p.userId);
                if (client?.readyState === WebSocket.OPEN) {
                  client.send(
                    JSON.stringify({
                      type: "congratulations",
                      message: `🎉 Congratulations! You have the highest score of ${p.score}!`,
                      gameId,
                      roomId: incommingRoomId,
                    })
                  );
                }
              });

              // Cleanup all Redis keys for this room
              await redisClient.del(playersKey);
              await redisClient.del(hostKey);
              await redisClient.del(
                `gameRoom:${incommingRoomId}:${gameId}:readyUsers`
              );
              await redisClient.del(
                `gameRoom:${incommingRoomId}:${gameId}:scoreUpdates`
              );
              break;
            }
          }

          default:
            ws.send(
              JSON.stringify({ type: "error", message: "Invalid message type" })
            );
        }
      } catch (err: unknown) {
        if (err instanceof SyntaxError) {
          ws.send(JSON.stringify({ type: "error", message: "Bad JSON" }));
        } else if (err instanceof Error) {
          ws.send(JSON.stringify({ type: "error", message: err }));
        } else {
          ws.send(
            JSON.stringify({ type: "error", message: "Unexpected error" })
          );
        }
      }
    });

    ws.on("close", async () => {
      const userId = (ws as CustomWebSocket).userId;
      if (userId) {
        connectedUsers.delete(userId);
      }

      if (roomId) {
        const clients = roomUsers.get(roomId);
        clients?.delete(ws);
        if (clients?.size === 0) roomUsers.delete(roomId);
      }
      console.log("WebSocket client disconnected!");
      clearInterval(interval);
    });
  });
}

export const socket = { wss, roomUsers };
