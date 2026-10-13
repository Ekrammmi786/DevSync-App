import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";

// User controllers (recommendations + profile)
import { getRecommendedUser, getUserProfileById } from "../controllers/user.controller.js";

// Friend controllers
import {
  getFriendRequests,
  acceptFriendRequest,
  sendFriendRequest,
  getMyFriends,
  getOutgoingFriendReqs,
  rejectFriendRequest,
  removeFriend,
} from "../controllers/friend.controller.js";

// Leaderboard controllers
import { getLeaderboard, getMyDevScore } from "../controllers/leaderboard.controller.js";

// Search controllers
import { searchUsers } from "../controllers/search.controller.js";

// Profile upload
import { uploadProfilePicture } from "../controllers/profile.controller.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protectRoute);

// User
router.get("/", getRecommendedUser);
router.get("/profile/:id", getUserProfileById);
router.post("/upload-profile-picture", upload.single("profilePic"), uploadProfilePicture);

// Friends
router.get("/friends", getMyFriends);
router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.put("/friend-request/:id/reject", rejectFriendRequest);
router.get("/friend-requests", getFriendRequests);
router.get("/outgoingfriendrequest", getOutgoingFriendReqs);
router.delete("/removeFriend/:id", removeFriend);

// Leaderboard
router.get("/leaderboard", getLeaderboard);
router.get("/my-dev-score", getMyDevScore);

// Search
router.post("/search", searchUsers);

export default router;
