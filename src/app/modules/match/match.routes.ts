import express from "express";
import { matchControllers } from "./match.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/create", auth(), matchControllers.createMatch);
router.get("/my-matches", auth(), matchControllers.myMatches);
router.get("/:id", matchControllers.getMatchById);
router.patch("/:id", matchControllers.updateMatch);
router.delete("/:id", matchControllers.deleteMatch);

export const matchRoutes = router;
