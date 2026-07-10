import redis from "../redis";
import { logger } from "./logger";

export const pub = redis.duplicate({
  enableReadyCheck: false,
});

export const sub = redis.duplicate({
  enableReadyCheck: false,
});

let isPubSubReady = false;

export const initPubSub = async () => {
  if (isPubSubReady) return;

  isPubSubReady = true;
  logger.info("Redis pub/sub connected");
};

export const publishEvent = async (channel: string, data: any) => {
   if (!isPubSubReady) {
      throw new Error("Pub/Sub not initialized");
   }
   await pub.publish(channel, JSON.stringify(data));
};

export const subscribeEvents = async (
  handler: (data: any) => void
) => {
  if (!isPubSubReady) {
    throw new Error("Pub/Sub not initialized");
  }

  await sub.subscribe("GAME_EVENTS");

  sub.on("message", (channel, message) => {
    if (channel !== "GAME_EVENTS") return;

    try {
      const event = JSON.parse(message);

      console.log("Received event:", event);

      handler(event);
    } catch (err) {
      logger.error("Failed to parse Redis message", err);
    }
  });
};

export const closePubSub = async () => {
   if (!isPubSubReady) return;
   await Promise.all([pub.quit(), sub.quit()]);
   isPubSubReady = false;
   logger.info("Redis pub/sub disconnected");
};
