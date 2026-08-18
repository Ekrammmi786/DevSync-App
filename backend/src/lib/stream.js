import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.error("Stream api key or secret is missing");
}

export const streamClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("error in upserting streamuser ", error);
  }
};

export const deleteStreamChannel = async (userId1, userId2) => {
  try {
    const channelId = [userId1, userId2].sort().join("-");
    const channel = streamClient.channel("messaging", channelId, {
      members: [userId1, userId2],
    });

    try {
      await channel.delete();
      console.log(`Stream channel deleted: ${channelId}`);
    } catch (deleteError) {
      if (deleteError.message?.includes("not found") || deleteError.statusCode === 404) {
        console.log(`Stream channel ${channelId} already deleted or not found`);
      } else {
        throw deleteError;
      }
    }

    try {
      await streamClient.channels.query({
        filter_conditions: {
          type: "messaging",
          members: { $in: [userId1, userId2] },
        },
      });
    } catch (queryError) {
      console.error("Error refreshing channel list after delete:", queryError);
    }
  } catch (error) {
    console.error("error deleting stream channel:", error);
  }
};

export const generateStreamToken = (userId) => {
  try {
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.log("error genrating stream token :", error);
  }
};
