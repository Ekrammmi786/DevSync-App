import { generateStreamToken } from "../lib/stream.js";

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
