import { Server, Socket } from "socket.io";
import { recoverGameSession } from "../../../helpers/game/recover.game";
import {
  getSession,
  getUserActiveGame,
  saveSession,
} from "../../../helpers/game/service.game";
import { rateLimit } from "../../../helpers/game/limit";
import redis from "../../../helpers/redis";
import { activePlayers, gamesStarted } from "../../../helpers/game/metrics";
import { logger } from "../../../helpers/game/logger";
import { withAck } from "../../../helpers/game/withack";
import { GameConfigRegistry } from "../../../helpers/game/gameConfigRegistry";
import { GameRegistry } from "../../../helpers/game/gameRegistry";
import { verifyToken } from "../../../helpers/game/verifyGametoken";

export const registerSocketHandlers = (io: Server) => {
  // 🛡️ AUTH MIDDLEWARE
  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.query.token ||
      socket.handshake.headers["x-token"] ||
      socket.handshake.query["x-token"];

    if (!token) return next(new Error("Authentication error"));

    const decoded = verifyToken(token);
    if (!decoded) return next(new Error("Authentication error"));

    (socket as any).userId = decoded.userId || (decoded as any).id;

    if (!(socket as any).userId) return next(new Error("Authentication error"));
    next();
  });

  io.on("connection", (socket: Socket) => {
    // 🔁 RECONNECT STATE SYNC
    socket.on("RECONNECT_GAME", async ({ gameId }, ack) => {
      await withAck(async () => {
        const userId = (socket as any).userId;
        // 🧠 SMART RECONNECT: Handle users switching games
        const activeGameId = await getUserActiveGame(userId);
        if (activeGameId && activeGameId !== gameId) {
          const oldSession = await getSession(activeGameId);
          if (oldSession) {
            oldSession.players = oldSession.players.filter(
              (p: any) => p.id !== userId,
            );
            await saveSession(activeGameId, oldSession);
            io.to(activeGameId).emit("GAME_EVENT", {
              type: "NETWORK_STATUS",
              payload: {
                userId,
                isConnected: false,
                isHost: oldSession.hostId === userId,
                message: "User moved to another game",
              },
            });
            io.to(activeGameId).emit("GAME_EVENT", {
              type: "PLAYERS_UPDATE",
              payload: oldSession.players,
            });
          }
        }

        const session = await recoverGameSession(gameId);
        if (!session) throw new Error("Game not found");

        const player = session.players.find((p: any) => p.id === userId);

        if (player) {
          player.socketId = socket.id; // 🔁 update socket
          player.isConnected = true;
          player.hasNetworkIssue = false;
        }

        // 🛡️ Update Host Socket ID if the host is reconnecting
        if (session.hostId === userId) {
          session.hostSocketId = socket.id;
        }

        socket.join(gameId);

        await saveSession(gameId, session);

        io.to(gameId).emit("GAME_EVENT", {
          type: "NETWORK_STATUS",
          payload: {
            userId,
            isConnected: true,
            isHost: session.hostId === userId,
            message: `User ${userId} reconnected`,
          },
        });
        io.to(gameId).emit("GAME_EVENT", {
          type: "PLAYERS_UPDATE",
          payload: session.players,
        });

        // 🔥 full resume state
        return {
          session,
          currentRound: session.currentRoundIndex,
          roundState: session.roundState,
        };
      }, ack);
    });

    socket.on("CREATE_GAME", async ({ gameType }, ack) => {
      await withAck(async () => {
        const userId = (socket as any).userId;
        const gameId = "internet-bachelor-123";

        const session = {
          id: gameId,
          gameType,
          hostId: userId,
          hostSocketId: socket.id,
          players: [],
          status: "LOBBY",
        };

        await saveSession(gameId, session);

        socket.join(gameId);
        gamesStarted.inc();

        return { gameId };
      }, ack);
    });

    socket.on("JOIN_GAME", async ({ gameId, name, avatar }, ack) => {
      await withAck(async () => {
        const userId = (socket as any).userId;
        // 🧠 SMART JOIN: Remove from other games first
        const activeGameId = await getUserActiveGame(userId);
        if (activeGameId && activeGameId !== gameId) {
          const oldSession = await getSession(activeGameId);
          if (oldSession) {
            oldSession.players = oldSession.players.filter(
              (p: any) => p.id !== userId,
            );
            await saveSession(activeGameId, oldSession);
            io.to(activeGameId).emit("GAME_EVENT", {
              type: "NETWORK_STATUS",
              payload: {
                userId,
                isConnected: false,
                isHost: oldSession.hostId === userId,
                message: "User joined another game",
              },
            });
            io.to(activeGameId).emit("GAME_EVENT", {
              type: "PLAYERS_UPDATE",
              payload: oldSession.players,
            });
          }
        }

        const session = await getSession(gameId);
        if (!session) throw new Error("Game not found");

        let player = session.players.find((p: any) => p.id === userId);

        if (!player) {
          player = {
            id: userId,
            socketId: socket.id,
            name,
            avatar,
            isEliminated: false,
            isReady: false,
            isConnected: true,
            hasNetworkIssue: false,
            points: 0,
            hasSubmitted: false,
          };
          session.players.push(player);
        } else {
          // Update socket and connection status on reconnect
          player.socketId = socket.id;
          player.isConnected = true;
          player.hasNetworkIssue = false;
          // Update cosmetic info if provided
          if (name) player.name = name;
          if (avatar) player.avatar = avatar;
        }

        socket.join(gameId);

        await saveSession(gameId, session);

        io.to(gameId).emit("GAME_EVENT", {
          type: "NETWORK_STATUS",
          payload: {
            userId,
            isConnected: true,
            isHost: session.hostId === userId,
            message: `User ${userId} joined`,
          },
        });
        io.to(gameId).emit("GAME_EVENT", {
          type: "PLAYERS_UPDATE",
          payload: session.players,
        });
        activePlayers.set(session.players.length);

        return session;
      }, ack);
    });

    socket.on("GAME_EVENT", async (data, ack) => {
      await withAck(async () => {
        rateLimit(socket.id, "GAME_EVENT");

        const { gameId, type, payload } = data;

        const session = await getSession(gameId);
        if (!session) throw new Error("Game not found");

        const engine = GameRegistry[session.gameType];
        const config = GameConfigRegistry[session.gameType];
        if (!engine || !config) {
          throw new Error(`Unsupported game type: ${session.gameType}`);
        }

        // Get userId from socket (set by auth middleware)
        const userId = (socket as any).userId;

        await engine.handleEvent(
          type,
          payload,
          session,
          config,
          socket,
          userId,
        );

        await saveSession(gameId, session);

        return { ok: true };
      }, ack);
    });

    socket.on("disconnect", async () => {
      logger.info("Socket disconnected", { socketId: socket.id });

      // 🔌 Handle disconnect logic for games
      // We can find the session this socket belonged to and update player status
      const activeGames = await redis.keys("game:*");
      for (const key of activeGames) {
        const gameId = key.split(":")[1];
        const session = await getSession(gameId);
        if (!session) continue;

        const player = session.players.find(
          (p: any) => p.socketId === socket.id,
        );
        if (player) {
          player.isConnected = false;
          player.hasNetworkIssue = true;

          await saveSession(gameId, session);
          io.to(gameId).emit("GAME_EVENT", {
            type: "NETWORK_STATUS",
            payload: {
              userId: player.id,
              isConnected: false,
              isHost: session.hostId === player.id,
              message: `User ${player.id} disconnected`,
            },
          });
          io.to(gameId).emit("GAME_EVENT", {
            type: "PLAYERS_UPDATE",
            payload: session.players,
          });
        }
      }
    });
  });
};
