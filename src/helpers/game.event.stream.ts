
import { io } from "./game/game.socket";
import { logger } from "./game/logger";

import { subscribeEvents } from "./game/pubsub";

let streamInitialized = false;

export const initEventStream = () => {
   if (streamInitialized) return;
subscribeEvents((event) => {
  if (!event) {
    logger.warn("Received null event");
    return;
  }

  const { roomId, type, payload } = event;

  io.to(roomId).emit("GAME_EVENT", {
    type,
    payload,
  });
});

   streamInitialized = true;
   logger.info("Event stream initialized");
};
