import express from "express";
import auth from "../../middlewares/auth";
import { intentControllers } from "./intent.controller";

const router = express.Router();

router.post("/create", auth(), intentControllers.createIntent);
router.get("/check", auth(), intentControllers.checkIntent);
router.get("/", auth(), intentControllers.getAllIntents);
router.get("/:id", auth(), intentControllers.getIntentById);
router.patch("/:id", auth(), intentControllers.updateIntent);
router.delete("/:id", auth(), intentControllers.deleteIntent);

export const intentRoutes = router;
