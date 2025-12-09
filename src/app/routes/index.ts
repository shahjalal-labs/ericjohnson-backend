import express from "express";
import { userRoutes } from "../modules/user/user.route";
import { authRoute } from "../modules/auth/auth.routes";
import { intentRoutes } from "../modules/intent/intent.routes";
import { matchRoutes } from "../modules/match/match.routes";
import { messageRoute } from "../modules/message/message.routes";
import { notificationsRoute } from "../modules/notifications/notification.route";
import { friendRoutes } from "../modules/friend/friend.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/intent",
    route: intentRoutes,
  },
  {
    path: "/match",
    route: matchRoutes,
  },
  {
    path: "/messages",
    route: messageRoute,
  },
  {
    path: "/notification",
    route: notificationsRoute,
  },
  { path: "/friend", route: friendRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
