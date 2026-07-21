import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getFriendRequests,
  acceptFriendRequest,
  sendFriendRequest,
  getMyFriends,
  getRecommendedUser,
  getOutgoingFriendReqs,
  searchUsers,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute);
router.get("/", getRecommendedUser);
router.get("/friends", getMyFriends);
router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.get("/friend-requests", getFriendRequests);
router.get("/outgoingfriendrequest", getOutgoingFriendReqs);
router.post("/search", searchUsers);


export default router;

