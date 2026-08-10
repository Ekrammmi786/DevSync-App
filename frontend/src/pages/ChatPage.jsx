import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { useStreamToken, useOrCreateChannel } from "../hooks/useChat";
import { useMyFriends } from "../hooks/useUser";
import UserProfileModal from "../components/UserProfileModal";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

const filters = { type: "messaging" };
const options = { presence: true, state: true };
const sort = { last_message_at: -1 };

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");

  const { data: tokenData, isLoading: tokenLoading } = useStreamToken();
  const token = tokenData?.data?.token;
  const userId = user?._id;

  const { data: friendsData, isLoading: friendsLoading } = useMyFriends(50);
  const friends = friendsData?.data ?? [];

  const { mutateAsync: createChannelBackend } = useOrCreateChannel();

  const [activeTab, setActiveTab] = useState("chats");
  const [activeChannel, setActiveChannel] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: {
      id: userId || "guest",
      name: user?.fullname || "User",
      image: user?.profilePic,
    },
  });

  useEffect(() => {
    if (!client || !targetUserId || !userId) return;

    const initChannelWithUser = async () => {
      try {
        await createChannelBackend(targetUserId);

        const channelId = [userId, targetUserId].sort().join("-");
        const channel = client.channel("messaging", channelId, {
          members: [userId, targetUserId],
        });
        await channel.watch();
        setActiveChannel(channel);
        setActiveTab("chats");
      } catch (err) {
        console.error("Error creating or joining channel:", err);
      }
    };

    initChannelWithUser();
  }, [client, targetUserId, userId]);

  const handleStartChatWithFriend = async (friendId) => {
    if (!client || !userId) return;
    try {
      await createChannelBackend(friendId);
      const channelId = [userId, friendId].sort().join("-");
      const channel = client.channel("messaging", channelId, {
        members: [userId, friendId],
      });
      await channel.watch();
      setActiveChannel(channel);
      setActiveTab("chats");
      setSearchParams({ userId: friendId });
    } catch (err) {
      console.error("Failed to start chat with friend:", err);
    }
  };

  const handleOpenProfile = (id) => {
    setProfileUserId(id);
    setIsProfileOpen(true);
  };

  if (tokenLoading || !token || !client) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center space-y-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-medium text-base-content/70">Connecting to DevSync Chat...</p>
      </div>
    );
  }

  const otherMemberId = activeChannel
    ? Object.keys(activeChannel.state.members || {}).find((mId) => mId !== userId)
    : null;

  return (
    <div className="h-screen flex flex-col bg-base-200 overflow-hidden">
      {/* Top Navigation */}
      <div className="navbar bg-base-100 shadow-sm border-b border-base-200 z-20 flex-none px-4">
        <div className="navbar-start">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg text-primary">DevSync</span>
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><Link to="/dashboard">Home</Link></li>
            <li><Link to="/find">Find Developers</Link></li>
            <li><Link to="/friends">Friends</Link></li>
            <li><Link to="/chat" className="font-medium text-primary">Chat</Link></li>
            <li><Link to="/calls">Calls</Link></li>
            <li><Link to="/notifications">Notifications</Link></li>
          </ul>
        </div>
        <div className="navbar-end gap-2">
          {otherMemberId && (
            <button
              onClick={() => handleOpenProfile(otherMemberId)}
              className="btn btn-sm btn-outline btn-primary gap-1"
            >
              <span>👤</span> View Profile
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        <Chat client={client}>
          {/* Sidebar */}
          <div className="w-full md:w-80 lg:w-96 border-r border-base-300 bg-base-100 flex flex-col flex-none">
            {/* Sidebar Tab Switcher */}
            <div className="p-3 border-b border-base-200 bg-base-100">
              <div className="join w-full bg-base-200 p-1 rounded-xl">
                <button
                  className={`join-item flex-1 btn btn-sm border-none ${
                    activeTab === "chats" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
                  }`}
                  onClick={() => setActiveTab("chats")}
                >
                  💬 Chats
                </button>
                <button
                  className={`join-item flex-1 btn btn-sm border-none ${
                    activeTab === "friends" ? "btn-primary shadow-sm" : "btn-ghost text-base-content/70"
                  }`}
                  onClick={() => setActiveTab("friends")}
                >
                  👥 Friends ({friends.length})
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "chats" ? (
                <div className="h-full flex flex-col">
                  <ChannelList
                    sort={sort}
                    filters={{ ...filters, members: { $in: [userId] } }}
                    options={options}
                    onSelect={(channel) => {
                      setActiveChannel(channel);
                      const partner = Object.keys(channel.state.members || {}).find(
                        (mId) => mId !== userId
                      );
                      if (partner) setSearchParams({ userId: partner });
                    }}
                    EmptyStateIndicator={() => (
                      <div className="p-6 text-center space-y-4 my-auto">
                        <div className="text-4xl">💬</div>
                        <div>
                          <h4 className="font-bold text-base text-base-content">No active chats</h4>
                          <p className="text-xs text-base-content/60 mt-1">
                            Select a friend from the Friends tab to start chatting!
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab("friends")}
                          className="btn btn-sm btn-primary w-full"
                        >
                          👥 Start New Chat
                        </button>
                      </div>
                    )}
                  />
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 px-2 py-1">
                    Your Friends
                  </h4>

                  {friendsLoading ? (
                    <div className="space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                          <div className="w-10 h-10 rounded-full bg-base-300"></div>
                          <div className="flex-1 space-y-1">
                            <div className="h-3 bg-base-300 rounded w-24"></div>
                            <div className="h-2 bg-base-300 rounded w-16"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : friends.length > 0 ? (
                    friends.map((f) => (
                      <div
                        key={f._id}
                        className="flex items-center justify-between p-2.5 hover:bg-base-200 rounded-xl transition-colors group cursor-pointer"
                        onClick={() => handleStartChatWithFriend(f._id)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="avatar">
                            <div className="w-10 rounded-full ring-1 ring-primary/20">
                              <img
                                src={
                                  f.profilePic ||
                                  "https://testingbot.com/free-online-tools/random-avatar/411"
                                }
                                alt={f.fullname}
                              />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm text-base-content truncate">
                              {f.fullname}
                            </p>
                            <p className="text-xs text-base-content/60 truncate">
                              {f.role || "Developer"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProfile(f._id);
                            }}
                            className="btn btn-xs btn-ghost btn-circle text-base-content/60 hover:text-primary"
                            title="View Profile"
                          >
                            👤
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartChatWithFriend(f._id);
                            }}
                            className="btn btn-xs btn-primary gap-1"
                          >
                            💬
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-sm text-base-content/60">No friends added yet.</p>
                      <Link to="/find" className="btn btn-sm btn-outline btn-primary">
                        🔍 Find Developers
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Main Channel Area */}
          <div className="flex-1 flex flex-col h-full bg-base-100">
            {activeChannel ? (
              <Channel channel={activeChannel}>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageComposer />
                </Window>
                <Thread />
              </Channel>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-base-200/50 space-y-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl shadow-inner">
                  ⚡
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-xl font-bold text-base-content">DevSync Chat</h3>
                  <p className="text-sm text-base-content/60">
                    Select a conversation from the sidebar or click on any friend in your list to start collaborating!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("friends")}
                  className="btn btn-primary gap-2 shadow-lg"
                >
                  👥 Browse Friends List
                </button>
              </div>
            )}
          </div>
        </Chat>
      </div>

      {/* Profile Modal */}
      <UserProfileModal
        userId={profileUserId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default ChatPage;
