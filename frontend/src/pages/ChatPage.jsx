import {
  Chat,
  Channel,
  ChannelList,
  Window,
  ChannelHeader,
  MessageList,
  MessageComposer,
  Thread,
  useCreateChatClient,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { useAuth } from "../context/AuthContext";
import { useStreamToken } from "../hooks/useChat";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

const filters = { type: "messaging" };
const options = { presence: true, state: true };
const sort = { last_message_at: -1 };

const ChatPage = () => {
  const { user } = useAuth();
  const { data: tokenData, isLoading } = useStreamToken();
  const token = tokenData?.data?.token;
  const userId = user?._id;

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: { id: userId },
  });

  if (isLoading || !token || !client) return <div>Loading...</div>;

  return (
    <div className="h-screen">
      <Chat client={client}>
        <ChannelList sort={sort} filters={filters} options={options} />
        <Channel>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;
