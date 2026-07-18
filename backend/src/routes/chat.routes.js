import express from "express";
import { protectRoute } from "../middleware/auth.middleware";
import { generateStreamToken } from "../lib/stream";

const router = express.Router();

router.get("/token",protectRoute,generateStreamToken)

export default router