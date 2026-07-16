import { Server } from "http";
import app from "./app";
import config from "./config";
import { closeSocket, initSocket } from "./helpers/game/game.socket";
import { initEventStream } from "./helpers/game.event.stream";
import { initGameWorker, stopGameWorker } from "./queues/game.worker";
import { logger } from "./helpers/game/logger";
import { closePubSub } from "./helpers/game/pubsub";
import { disconnectRedis } from "./helpers/game/game.redis";

async function main() {
  const server: Server = app.listen(config.port, () => {
    console.log("✅ Server is running on", `http://localhost:${config.port}`);
    console.log(
      "📊 BullMQ Dashboard at",
      `http://localhost:${config.port}/admin/queues`,
    );
  });

  await initSocket(server);
  initEventStream();
  initGameWorker();

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info("Server closed!");
      });
    }
    process.exit(1);
  };
  process.on("uncaughtException", (error) => {
    console.log(error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.log(error);
    exitHandler();
  });

  const shutdown = async (signal: string) => {
    logger.info("Shutdown requested", { signal });
    server.close();
    await stopGameWorker();
    await closeSocket();
    await closePubSub();
    await disconnectRedis();
    // await disconnectPrisma();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main();
