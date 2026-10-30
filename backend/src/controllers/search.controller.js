import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import AsyncHandler from "../utils/asyncHandler.js";
import { getCache, setCache } from "../lib/cache.js";
import { parsePagination, buildPaginationResponse } from "../utils/paginationHelper.js";

export const searchUsers = AsyncHandler(async (req, res) => {
  const { fullname = "", role = "" } = req.body;
  const { limit, skip } = parsePagination(req.query);
  const cacheKey = `search-${req.user._id}-${fullname}-${role}-${limit}-${skip}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, ...cached, source: "cache" });
  }

  const searchQuery = { isOnBoarded: true };

  if (fullname.trim()) {
    searchQuery.fullname = {
      $regex: fullname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  if (role.trim()) {
    searchQuery.role = {
      $regex: role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      $options: "i",
    };
  }

  const users = await User.find(searchQuery)
    .skip(skip)
    .limit(limit)
    .select(
      "fullname profilePic codinglanguage learninglanguage role location bio techStack interests devScore badges experience",
    )
    .lean();

  const total = await User.countDocuments(searchQuery);

  const currentUser = await User.findById(req.user._id)
    .select("friends")
    .lean();
  const friendIds = (currentUser?.friends || []).map((id) => id.toString());

  const pendingRequests = await FriendRequest.find({
    $or: [
      { sender: req.user._id, status: "pending" },
      { recipient: req.user._id, status: "pending" },
    ],
  }).lean();

  const pendingIds = pendingRequests.map((r) =>
    r.sender.toString() === req.user._id.toString()
      ? r.recipient.toString()
      : r.sender.toString(),
  );

  const usersWithStatus = users.map((user) => {
    let friendStatus = "none";
    if (friendIds.includes(user._id.toString())) friendStatus = "friends";
    else if (pendingIds.includes(user._id.toString())) friendStatus = "pending";
    return { ...user, friendStatus };
  });

  const responseData = buildPaginationResponse(usersWithStatus, { skip, limit, total });
  setCache(cacheKey, responseData, 30);
  return res.status(200).json({ success: true, ...responseData, source: "database" });
});
