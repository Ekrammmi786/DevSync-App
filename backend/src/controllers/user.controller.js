import User from "../models/user.js";
import FriendRequest from "../models/FriendRequest.js";

export async function getRecommendedUser(req, res) {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        {
          _id: {
            $nin: currentUser.friends,
          },
        },
        { isOnboarded: true },
      ],
    });

    res.status(200).json({
      recommendedUsers,
    });
  } catch (error) {
    console.error("error in getrecommendation ", error.message);
    res.status(500).json({
      message: "internal server problem",
    });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("friends")
      .populate(
        "friends",
        "fullname profilePic codingLanguage learningLanguage role",
      );


    res.status(200).json(user.friends);
  } catch (error) {
    console.error(
      "error in getmyfriends recommendation Controller ",
      error.message,
    );
    res.status(500).json({
      message: "internal server has problem",
    });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user._id,
      status: "pending",
    }).populate(
      "sender",
      "fullname profilePic codinglanguage learninglanguage role",
    );

    const acceptedReqs = await FriendRequest.find({
      sender: req.user._id,
      status: "accepted",
    }).populate(
      "recipient",
      "fullname profilePic codinglanguage learninglanguage role",
    );


    return res.status(200).json({ incomingReqs, acceptedReqs });

    
  } catch (error) {
    console.error("error in getFriendRequests controller", error.message);
    return res.status(500).json({ message: "internal server error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user._id;
    const { id: recipientId } = req.params;

    if (!req.user.isOnBoarded) {
      return res.status(403).json({
        message: "Please complete onboarding before sending friend requests",
      });
    }



    if (myId === recipientId) {
      return res.status(400).json({
        success: "false",
        message: "you can't send friend request to yourself",
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        message: "recipients not found",
      });
    }

    if (recipient.friends.includes(myId)) {
      return res.status(400).json({
        message: "you are already friends with this user",
      });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "a friend already exists between you and this user",
      });
    }

    const friendrequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    return res.status(201).json(friendrequest);
  } catch (error) {
    console.error("error is send request controller", error.message);
    return res.status(500).json({ message: "internal Server Error" });
  }
}


export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    }).populate(
      "recipient",
      "fullname profilePic codinglanguage learninglanguage role",
    );


    return res.status(200).json(outgoingRequests);
  } catch (error) {
    console.error("error in getOutgoingFriendReqs controller", error.message);
    return res.status(500).json({ message: "internal server error" });
  }
}

export async function acceptFriendRequest(req,res){
try{

const {id:requestId} =req.params

const friendRequestDoc = await FriendRequest.findById(requestId);

if(!friendRequestDoc){
  return res.status(404).json({
    message:"friend requests not found!"
  });
}

if(friendRequestDoc.recipient.toString()!==req.user._id.toString()){

  return res.status(403).json({
    message:"you are not authorized to accept this request"
  });
}

friendRequestDoc.status = "accepted"
await friendRequestDoc.save();

await User.findByIdAndUpdate(friendRequestDoc.recipient,{
  $addToSet:{friends:friendRequestDoc.sender}
});

await User.findByIdAndUpdate(friendRequestDoc.sender,{
  $addToSet:{friends:friendRequestDoc.recipient}
});

res.status(200).json({
  message:"friend request accepted"
});

}catch(error){
console.log("error in friendreq controller",error.message);
res.status(500).json({
  message:"internal server error"
})
}
}
