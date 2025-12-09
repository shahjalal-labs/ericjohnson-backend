import express from "express";
import { friendControllers } from "./friend.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/send-request/:userId",
  auth(),
  friendControllers.sendFriendRequest
);
router.get("/my-friends", auth(), friendControllers.myFriends);
router.get("/receive-requests", auth(), friendControllers.receiveRequests);
router.post(
  "/accept-request/:requestId",
  auth(),
  friendControllers.acceptRequest
);
router.delete(
  "/remove-request/:requestId",
  auth(),
  friendControllers.removeRequest
);
router.delete("/remove-friend/:id", auth(), friendControllers.deleteFriend);
router.get("/matches-users", auth(), friendControllers.matchesUsers);

export const friendRoutes = router;
