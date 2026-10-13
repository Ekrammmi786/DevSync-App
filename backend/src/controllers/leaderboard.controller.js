import User from "../models/User.js";
import AsyncHandler from "../utils/asyncHandler.js";
import { getCache, setCache } from "../lib/cache.js";
import { calculateDevScore } from "../services/devScore.service.js";
import { parsePagination, buildPaginationResponse } from "../utils/paginationHelper.js";

export const getLeaderboard = AsyncHandler(async (req, res) => {
  const { limit, skip } = parsePagination(req.query);
  const cacheKey = `leaderboard-${limit}-${skip}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, ...cached, source: "cache" });
  }

  const users = await User.find({ isOnBoarded: true, devScore: { $gt: 0 } })
    .sort({ devScore: -1, createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .select(
      "fullname profilePic role codinglanguage techStack devScore badges location experience",
    )
    .lean();

  const total = await User.countDocuments({
    isOnBoarded: true,
    devScore: { $gt: 0 },
  });

  const responseData = buildPaginationResponse(users, { skip, limit, total });
  setCache(cacheKey, responseData, 60);
  return res.status(200).json({ success: true, ...responseData, source: "database" });
});

export const getMyDevScore = AsyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      code: "USER_NOT_FOUND",
    });
  }

  const result = calculateDevScore(user);

  const higherCount = await User.countDocuments({
    isOnBoarded: true,
    devScore: { $gt: result.score },
  });
  const rank = higherCount + 1;

  return res.status(200).json({
    success: true,
    data: {
      score: result.score,
      rank,
      breakdown: result.breakdown,
      badges: result.badges,
      missingFields: result.missingFields,
    },
  });
});
