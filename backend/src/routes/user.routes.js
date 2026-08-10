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
  rejectfriend,
  getLeaderboard,
  getMyDevScore,
  getUserProfileById,
} from "../controllers/user.controller.js";
import { uploadProfilePicture } from "../controllers/profile.controller.js";
const router = express.Router();
import { upload } from "../middleware/upload.middleware.js";

router.use(protectRoute);
router.get("/", getRecommendedUser);
router.get("/friends", getMyFriends);
router.get("/leaderboard", getLeaderboard);
router.get("/my-dev-score", getMyDevScore);
router.get("/profile/:id", getUserProfileById);
router.post("/upload-profile-picture", upload.single("profilePic"), uploadProfilePicture);
router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.put("/friend-request/:id/reject",rejectfriend)
router.get("/friend-requests", getFriendRequests);
router.get("/outgoingfriendrequest", getOutgoingFriendReqs);
router.post("/search", searchUsers);


export default router;

