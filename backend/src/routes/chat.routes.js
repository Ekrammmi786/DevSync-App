import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { generateStreamToken } from "../lib/stream.js";

const router = express.Router();

router.get("/token",protectRoute,generateStreamToken)

export default router