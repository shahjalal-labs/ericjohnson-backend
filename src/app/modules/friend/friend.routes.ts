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
router.get("/:id", auth(), friendControllers.getFriendById);
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

export const friendRoutes = router;
