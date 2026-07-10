import IORedis from "ioredis";
import env from "../helpers/game/game.env";

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const closeQueueRedis = async () => {
  await redisConnection.quit();
};
