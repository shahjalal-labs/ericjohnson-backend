import express from "express";
import { matchControllers } from "./match.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/matching-users", auth(), matchControllers.matchingUsers);
router.get("/matched-me", auth(), matchControllers.matchedMe);
router.delete("/:matchedId", auth(), matchControllers.deleteMatch);

export const matchRoutes = router;
