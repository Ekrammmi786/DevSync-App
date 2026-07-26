import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUser(req, res) {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const filter = {
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnBoarded: true },
      ],
    };

    const recommendedUsers = await User.find(filter).skip(skip).limit(limit);
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: recommendedUsers,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("error in getrecommendation ", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "SERVER_ERROR",
    });
  }
}

export async function getMyFriends(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const user = await User.findById(req.user._id)
      .select("friends")
      .populate({
        path: "friends",
        select: "fullname profilePic codingLanguage learningLanguage role",
        options: { skip, limit },
      });

    const total = await User.findById(req.user._id)
      .select("friends")
      .then((u) => u.friends.length);

    res.status(200).json({
      success: true,
      data: user.friends,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
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
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const filter = { recipient: req.user._id, status: "pending" };

    const incomingReqs = await FriendRequest.find(filter)
      .skip(skip)
      .limit(limit)
      .populate(
        "sender",
        "fullname profilePic codinglanguage learninglanguage role"
      );

    const total = await FriendRequest.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: incomingReqs,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
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
    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    }).populate(
      "recipient",
      "fullname profilePic codinglanguage learninglanguage role"
    );

    return res.status(200).json({
      success: true,
      data: outgoingRequests,
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

    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;

    const searchQuery = {};

    if (fullname.trim()) {
      searchQuery.fullname = { $regex: fullname, $options: "i" };
    }

    if (role.trim()) {
      searchQuery.role = { $regex: role, $options: "i" };
    }

    searchQuery.isOnBoarded = true;

    const users = await User.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .select("fullname profilePic codinglanguage learninglanguage role location bio")
      .lean();

    const total = await User.countDocuments(searchQuery);

    const currentUser = await User.findById(req.user._id).select("friends").lean();
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
        : r.sender.toString()
    );

    const usersWithStatus = users.map((user) => {
      let friendStatus = "none";
      if (friendIds.includes(user._id.toString())) friendStatus = "friends";
      else if (pendingIds.includes(user._id.toString())) friendStatus = "pending";
      return { ...user, friendStatus };
    });

    return res.status(200).json({
      success: true,
      data: usersWithStatus,
      pagination: {
        page: Math.floor(skip / limit) + 1,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
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
