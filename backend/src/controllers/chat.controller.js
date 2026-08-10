import User from "../models/User.js";
import { generateStreamToken, streamClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
    try {
        const token = generateStreamToken(req.user._id);
        res.status(200).json({ success: true, data: { token } });
    } catch (error) {
        console.log("error in getStreamToken controller:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "SERVER_ERROR"
        });
    }
}

export async function getOrCreateChannel(req, res) {
    try {
        const meId = req.user._id.toString();
        const { userId } = req.params;

        const otherUser = await User.findById(userId);
        if (!otherUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                code: "USER_NOT_FOUND",
            });
        }

        if (meId === userId) {
            return res.status(400).json({
                success: false,
                message: "You can't chat with yourself",
                code: "SELF_CHAT",
            });
        }

        const isFriend = req.user.friends.some(
            (id) => id.toString() === userId,
        );

        const channelId = [meId, userId].sort().join("-");
        const channel = streamClient.channel("messaging", channelId, {
            members: [meId, userId],
            created_by_id: meId,
        });

        await channel.create();

        return res.status(200).json({
            success: true,
            data: {
                channelId,
                isFriend,
            },
        });
    } catch (error) {
        console.log("error in getOrCreateChannel controller:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "SERVER_ERROR",
        });
    }
}
