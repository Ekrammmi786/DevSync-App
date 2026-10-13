import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import AsyncHandler from "../utils/asyncHandler.js";
import { getCache, setCache } from "../lib/cache.js";
import { parsePagination, buildPaginationResponse } from "../utils/paginationHelper.js";

export const getRecommendedUser = AsyncHandler(async (req, res) => {
  const { limit, skip } = parsePagination(req.query);
  const cacheKey = `recommend-${req.user._id}-${limit}-${skip}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, ...cached, source: "cache" });
  }

  const currentUser = await User.findById(req.user._id);
  const recommendedUsers = await User.aggregate([
    {
      $match: {
        _id: { $ne: currentUser._id, $nin: currentUser.friends },
        isOnBoarded: true,
      },
    },
    {
      $addFields: {
        relevanceScore: {
          $add: [
            {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $setIntersection: [
                          "$codinglanguage",
                          currentUser.codinglanguage,
                        ],
                      },
                    },
                    0,
                  ],
                },
                3,
                0,
              ],
            },
            { $cond: [{ $eq: ["$location", currentUser.location] }, 2, 0] },
            { $cond: [{ $eq: ["$role", currentUser.role] }, 1, 0] },
          ],
        },
      },
    },
    { $sort: { relevanceScore: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  const total = await User.countDocuments({
    _id: { $ne: currentUser._id, $nin: currentUser.friends },
    isOnBoarded: true,
  });

  const responseData = buildPaginationResponse(recommendedUsers, { skip, limit, total });
  setCache(cacheKey, responseData, 30);
  res.status(200).json({ success: true, ...responseData, source: "database" });
});

export const getUserProfileById = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const targetUser = await User.findById(id).select(
    "fullname email profilePic bio role codinglanguage learninglanguage location techStack interests lookingFor availability timezone githubUsername linkedinUsername portfolioUrl experience devScore badges completedProjects completedInterviews isOnBoarded friends createdAt"
  );

  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  const currentUser = await User.findById(req.user._id).select("friends");
  const isFriend = currentUser.friends.some(
    (fId) => fId.toString() === targetUser._id.toString()
  );

  const pendingReq = await FriendRequest.findOne({
    $or: [
      { sender: req.user._id, recipient: targetUser._id, status: "pending" },
      { sender: targetUser._id, recipient: req.user._id, status: "pending" },
    ],
  });

  let friendStatus = "none";
  if (isFriend) friendStatus = "friends";
  else if (pendingReq) friendStatus = "pending";

  return res.status(200).json({
    success: true,
    data: {
      ...targetUser.toObject(),
      friendStatus,
      isSelf: req.user._id.toString() === targetUser._id.toString(),
    },
  });
});