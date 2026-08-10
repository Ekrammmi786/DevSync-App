import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken, getOrCreateChannel } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.post("/channel/:userId", protectRoute, getOrCreateChannel);

export default router;
