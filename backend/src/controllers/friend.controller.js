import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import Notification from "../models/notifications.js";
import AsyncHandler from "../utils/asyncHandler.js";
import { getCache, setCache, delCache, delCacheByPattern } from "../lib/cache.js";
import { upsertStreamUser, deleteStreamChannel } from "../lib/stream.js";
import { parsePagination, buildPaginationResponse } from "../utils/paginationHelper.js";

export const getMyFriends = AsyncHandler(async (req, res) => {
  const { limit, skip } = parsePagination(req.query);
  const cacheKey = `friends-${req.user._id}-${limit}-${skip}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, ...cached, source: "cache" });
  }

  const user = await User.findById(req.user._id).select("friends").populate({
    path: "friends",
    select:
      "fullname profilePic codinglanguage learninglanguage role techStack interests devScore badges experience",
    options: { skip, limit },
  });

  const total = await User.findById(req.user._id)
    .select("friends")
    .then((u) => u?.friends?.length || 0);

  const responseData = buildPaginationResponse(user.friends, { skip, limit, total });
  setCache(cacheKey, responseData, 60);
  res.status(200).json({ success: true, ...responseData, source: "database" });
});

export const getFriendRequests = AsyncHandler(async (req, res) => {
  const { limit, skip } = parsePagination(req.query);
  const cacheKey = `incoming-requests-${req.user._id}-${limit}-${skip}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, ...cached, source: "cache" });
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

  const responseData = buildPaginationResponse(incomingReqs, { skip, limit, total });
  setCache(cacheKey, responseData, 60);
  return res.status(200).json({ success: true, ...responseData, source: "database" });
});

export const sendFriendRequest = AsyncHandler(async (req, res) => {
  const myId = req.user._id;
  const { id: recipientId } = req.params;

  if (!req.user.isOnBoarded) {
    return res.status(403).json({
      success: false,
      message: "Please complete onboarding before sending friend requests",
      code: "ONBOARDING_REQUIRED",
    });
  }

  if (myId.toString() === recipientId) {
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

  await Notification.create({
    recipient: recipientId,
    sender: myId,
    type: "friend_request",
    message: `${req.user.fullname} sent you a friend request.`,
    relatedEntity: friendrequest._id,
  });

  delCacheByPattern(`incoming-requests-${recipientId}`);
  delCacheByPattern(`outgoing-requests-${myId}`);
  delCacheByPattern(`recommend-${myId}`);
  delCacheByPattern(`search-${myId}`);

  return res.status(201).json({ success: true, data: friendrequest });
});

export const acceptFriendRequest = AsyncHandler(async (req, res) => {
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

  await Notification.create({
    recipient: friendRequestDoc.sender,
    sender: friendRequestDoc.recipient,
    type: "friend_accepted",
    message: `${req.user.fullname} accepted your friend request.`,
    relatedEntity: friendRequestDoc._id,
  });

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

  res.status(200).json({ success: true, data: { message: "Friend request accepted" } });
});

export const rejectFriendRequest = AsyncHandler(async (req, res) => {
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

  return res.status(200).json({ success: true, data: { message: "Friend request rejected" } });
});

export const getOutgoingFriendReqs = AsyncHandler(async (req, res) => {
  const cacheKey = `outgoing-requests-${req.user._id}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, data: cached, source: "cache" });
  }

  const outgoingRequests = await FriendRequest.find({
    sender: req.user._id,
    status: "pending",
  }).populate(
    "recipient",
    "fullname profilePic codinglanguage learninglanguage role techStack interests devScore badges location experience",
  );

  setCache(cacheKey, outgoingRequests, 60);
  return res.status(200).json({ success: true, data: outgoingRequests, source: "database" });
});

export const removeFriend = AsyncHandler(async (req, res) => {
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

  await User.findByIdAndUpdate(myId, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: myId } });

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

  return res.status(200).json({ success: true, data: { message: "Friend removed successfully" } });
});
