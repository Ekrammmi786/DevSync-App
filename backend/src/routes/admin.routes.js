import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/admin.middleware.js";
import {
  seedAdmin,
  getDashboard,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleAdmin,
  getFriendRequests,
  getSettings,
  updateSettings,
  shutdownServer,
  getHealth,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/seed", seedAdmin);

router.use(protectRoute, adminOnly);

router.get("/dashboard", getDashboard);
router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.put("/users/:id/toggle-admin", toggleAdmin);
router.get("/friend-requests", getFriendRequests);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.post("/shutdown", shutdownServer);
router.get("/health", getHealth);

export default router;
