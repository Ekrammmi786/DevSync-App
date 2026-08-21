import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getStreamToken,
  getOrCreateChannel,
  getVideoToken,
  uploadChatFile,
} from "../controllers/chat.controller.js";
import { uploadSingle } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.get("/video-token", protectRoute, getVideoToken);
router.post("/channel/:userId", protectRoute, getOrCreateChannel);
router.post("/upload", protectRoute, uploadSingle, uploadChatFile);

export default router;
