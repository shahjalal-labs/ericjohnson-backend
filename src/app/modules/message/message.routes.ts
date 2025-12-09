import express from "express";
import { messageControllers } from "./message.controller";
import { fileUploader } from "../../../helpers/fileUploader";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/generate-url",
  fileUploader.uploadMultiple,
  messageControllers.generateFileUrl
);
router.get("/:roomId", auth(), messageControllers.personalMessages);

export const messageRoute = router;
