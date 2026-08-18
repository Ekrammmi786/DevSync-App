import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import AsyncHandler from "../utils/asyncHandler.js";
import {
  getCache,
  setCache,
  delCache,
  delCacheByPattern,
} from "../lib/cache.js";
import { calculateDevScore } from "../services/devScore.service.js";
import { upsertStreamUser, deleteStreamChannel } from "../lib/stream.js";

export const getLeaderboard = AsyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = Math.max(parseInt(req.query.skip) || 0, 0);
  const cacheKey = `leaderboard-${limit}-${skip}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached.data,
      pagination: cached.pagination,
      source: "cache",
    });
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

  const responseData = {
    data: users,
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    },
  };
  setCache(cacheKey, responseData, 60);
  return res.status(200).json({
    success: true,
    ...responseData,
    source: "database",
  });
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

export const getRecommendedUser = AsyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);
  const skip = Math.max(parseInt(req.query.skip) || 0, 0);
  const cacheKey = `recommend-${req.user._id}-${limit}-${skip}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached.data,
      pagination: cached.pagination,
      source: "cache",
    });
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
  const responseData = {
    data: recommendedUsers,
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + limit < total,
    },
  };
  setCache(cacheKey, responseData, 30);
  res.status(200).json({
    success: true,
    ...responseData,
    source: "database",
  });
});

export async function getMyFriends(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const cacheKey = `friends-${req.user._id}-${limit}-${skip}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached.data,
        pagination: cached.pagination,
        source: "cache",
      });
    }

    const user = await User.findById(req.user._id).select("friends").populate({
      path: "friends",
      select:
        "fullname profilePic codinglanguage learninglanguage role techStack interests devScore badges experience",
      options: { skip, limit },
    });

    const total = await User.findById(req.user._id)
      .select("friends")
      .then((u) => u.friends.length);

    const responseData = {
      data: user.friends,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
    setCache(cacheKey, responseData, 60);
    res.status(200).json({
      success: true,
      ...responseData,
      source: "database",
    });
  } catch (error) {
    console.error("error in getmyfriends Controller ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const cacheKey = `incoming-requests-${req.user._id}-${limit}-${skip}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached.data,
        pagination: cached.pagination,
        source: "cache",
      });
    }

    const filter = { recipient: req.user._id, status: "pending" };

    const incomingReqs = await FriendRequest.find(filter)
      .skip(skip)
      .limit(limit)
      .populate(
        "sender",
        "fullname profilePic codinglanguage learninglanguage role techStack interests devScore badges location experience",
      );

    const total = await FriendRequest.countDocuments(filter);

    const responseData = {
      data: incomingReqs,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
    setCache(cacheKey, responseData, 60);
    return res.status(200).json({
      success: true,
      ...responseData,
      source: "database",
    });
  } catch (error) {
    console.error("error in getFriendRequests controller", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { id: recipientId } = req.params;

    if (!req.user.isOnBoarded) {
      return res.status(403).json({
        success: false,
        message: "Please complete onboarding before sending friend requests",
        code: "ONBOARDING_REQUIRED",
      });
    }

    if (myId === recipientId) {
      return res.status(400).json({
        success: false,
        message: "You can't send friend request to yourself",
        code: "SELF_REQUEST",
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
        code: "RECIPIENT_NOT_FOUND",
      });
    }

    if (recipient.friends.includes(myId)) {
      return res.status(400).json({
        success: false,
        message: "You are already friends with this user",
        code: "ALREADY_FRIENDS",
      });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
      status: { $ne: "rejected" },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "A pending request already exists between you and this user",
        code: "REQUEST_EXISTS",
      });
    }

    const friendrequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    delCacheByPattern(`incoming-requests-${recipientId}`);
    delCacheByPattern(`outgoing-requests-${myId}`);
    delCacheByPattern(`recommend-${myId}`);
    delCacheByPattern(`search-${myId}`);

    return res.status(201).json({
      success: true,
      data: friendrequest,
    });
  } catch (error) {
    console.error("error in send request controller", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const cacheKey = `outgoing-requests-${req.user._id}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached,
        source: "cache",
      });
    }
    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    }).populate(
      "recipient",
      "fullname profilePic codinglanguage learninglanguage role techStack interests devScore badges location experience",
    );

    setCache(cacheKey, outgoingRequests, 60);
    return res.status(200).json({
      success: true,
      data: outgoingRequests,
      source: "database",
    });
  } catch (error) {
    console.error("error in getOutgoingFriendReqs controller", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequestDoc = await FriendRequest.findById(requestId);

    if (!friendRequestDoc) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
        code: "NOT_FOUND",
      });
    }

    if (friendRequestDoc.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to accept this request",
        code: "UNAUTHORIZED",
      });
    }

    friendRequestDoc.status = "accepted";
    await friendRequestDoc.save();

    await User.findByIdAndUpdate(friendRequestDoc.recipient, {
      $addToSet: { friends: friendRequestDoc.sender },
    });

    await User.findByIdAndUpdate(friendRequestDoc.sender, {
      $addToSet: { friends: friendRequestDoc.recipient },
    });

    const senderId = friendRequestDoc.sender.toString();
    const recipientId = friendRequestDoc.recipient.toString();

    const [sender, recipient] = await Promise.all([
      User.findById(senderId).select("fullname profilePic"),
      User.findById(recipientId).select("fullname profilePic"),
    ]);

    if (sender) {
      await upsertStreamUser({
        id: sender._id.toString(),
        name: sender.fullname,
        image: sender.profilePic || "",
      });
    }

    if (recipient) {
      await upsertStreamUser({
        id: recipient._id.toString(),
        name: recipient.fullname,
        image: recipient.profilePic || "",
      });
    }

    delCacheByPattern(`friends-${senderId}`);
    delCacheByPattern(`friends-${recipientId}`);
    delCacheByPattern(`incoming-requests-${recipientId}`);
    delCacheByPattern(`outgoing-requests-${senderId}`);
    delCacheByPattern(`recommend-${senderId}`);
    delCacheByPattern(`recommend-${recipientId}`);
    delCacheByPattern(`search-${senderId}`);
    delCacheByPattern(`search-${recipientId}`);
    delCache("admin-dashboard");
    delCacheByPattern("admin-friend-requests-");

    res.status(200).json({
      success: true,
      data: { message: "Friend request accepted" },
    });
  } catch (error) {
    console.log("error in accept friend request controller", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

export async function rejectfriend(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequestDoc = await FriendRequest.findById(requestId);

    if (!friendRequestDoc) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found",
        code: "NOT_FOUND",
      });
    }

    if (friendRequestDoc.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to reject this request",
        code: "UNAUTHORIZED",
      });
    }

    friendRequestDoc.status = "rejected";
    await friendRequestDoc.save();

    delCacheByPattern(`incoming-requests-${req.user._id}`);
    delCacheByPattern(`outgoing-requests-${req.user._id}`);
    delCache("admin-dashboard");
    delCacheByPattern("admin-friend-requests-");

    return res.status(200).json({
      success: true,
      data: { message: "Friend request rejected" },
    });
  } catch (error) {
    console.log("error in reject friend request controller", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

export async function searchUsers(req, res) {
  try {
    const { fullname = "", role = "" } = req.body;

    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const cacheKey = `search-${req.user._id}-${fullname}-${role}-${limit}-${skip}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        data: cached.data,
        pagination: cached.pagination,
        source: "cache",
      });
    }

    const searchQuery = {};

    if (fullname.trim()) {
      searchQuery.fullname = { $regex: fullname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    }

    if (role.trim()) {
      searchQuery.role = { $regex: role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: "i" };
    }

    searchQuery.isOnBoarded = true;

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
    const friendIds = currentUser.friends.map((id) => id.toString());

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
      else if (pendingIds.includes(user._id.toString()))
        friendStatus = "pending";
      return { ...user, friendStatus };
    });

    const responseData = {
      data: usersWithStatus,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    };
    setCache(cacheKey, responseData, 30);
    return res.status(200).json({
      success: true,
      ...responseData,
      source: "database",
    });
  } catch (error) {
    console.log("error in searching users", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

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

export async function removeFriend(req, res) {
  try {
    const myId = req.user._id;
    const { id: friendId } = req.params;

    if (myId.toString() === friendId) {
      return res.status(400).json({
        success: false,
        message: "You can't remove yourself as a friend",
        code: "SELF_REMOVE",
      });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: "Friend not found",
        code: "FRIEND_NOT_FOUND",
      });
    }

    if (!friend.friends.includes(myId)) {
      return res.status(400).json({
        success: false,
        message: "This user is not your friend",
        code: "NOT_FRIENDS",
      });
    }

    await User.findByIdAndUpdate(myId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: myId },
    });

    await FriendRequest.updateMany(
      {
        $or: [
          { sender: myId, recipient: friendId },
          { sender: friendId, recipient: myId },
        ],
      },
      { $set: { status: "rejected" } },
    );

    await deleteStreamChannel(myId, friendId);

    delCacheByPattern(`friends-${myId.toString()}`);
    delCacheByPattern(`friends-${friendId}`);
    delCacheByPattern(`recommend-${myId.toString()}`);
    delCacheByPattern(`recommend-${friendId}`);
    delCacheByPattern(`search-${myId.toString()}`);
    delCacheByPattern(`search-${friendId}`);
    delCacheByPattern(`incoming-requests-${myId.toString()}`);
    delCacheByPattern(`outgoing-requests-${myId.toString()}`);
    delCache("admin-dashboard");
    delCacheByPattern("admin-friend-requests-");

    return res.status(200).json({
      success: true,
      data: { message: "Friend removed successfully" },
    });
  } catch (error) {
    console.error("error in removeFriend controller", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}