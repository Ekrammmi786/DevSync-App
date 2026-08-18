import User from "../models/User.js";
import { generateStreamToken, streamClient } from "../lib/stream.js";
import { StreamVideoClient } from "@stream-io/node-sdk";
import "dotenv/config";

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

export async function getVideoToken(req, res) {
    try {
        const apiKey = process.env.STREAM_VIDEO_API_KEY || process.env.STREAM_API_KEY;
        const apiSecret = process.env.STREAM_VIDEO_API_SECRET || process.env.STREAM_API_SECRET;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({
                success: false,
                message: "Video API credentials not configured",
                code: "CONFIG_ERROR",
            });
        }

        const videoClient = new StreamVideoClient({ apiKey, secret: apiSecret });
        const token = videoClient.generateUserToken(req.user._id.toString());
        await videoClient.disconnect();

        res.status(200).json({ success: true, data: { token } });
    } catch (error) {
        console.log("error in getVideoToken controller:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "SERVER_ERROR",
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

        if (!isFriend) {
            return res.status(403).json({
                success: false,
                message: "You can only chat with friends",
                code: "NOT_FRIENDS",
            });
        }

        const channelId = [meId, userId].sort().join("-");
        const channel = streamClient.channel("messaging", channelId, {
            members: [meId, userId],
            created_by_id: meId,
        });

        try {
            await channel.create();
        } catch (createError) {
            if (createError.message?.includes("already exists") || createError.statusCode === 400) {
                console.log(`Channel ${channelId} already exists, watching instead`);
            } else {
                throw createError;
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                channelId,
                isFriend: true,
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
