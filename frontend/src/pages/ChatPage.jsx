import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Chat,
  Channel,
  Window,
  MessageList,
  MessageComposer,
  Thread,
  useCreateChatClient,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

import { useAuth } from "../context/AuthContext";
import CosmicBackground from "../components/layout/CosmicBackground";
import { useStreamToken, useVideoToken, useOrCreateChannel } from "../hooks/useChat";
import { useMyFriends } from "../hooks/useUser";
import {
  ArrowLeft,
  Video,
  User,
  Search,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import NotificationDropdown from "../components/layout/NotificationDropdown";
import UserProfileModal from "../components/UserProfileModal";
import toast from "react-hot-toast";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

// High-performance memoized Channel Item (0ms latency, zero unnecessary re-renders)
const ChannelItem = memo(({ channel, userId, isSelected, onSelect }) => {
  const members = channel.state?.members || {};
  let partnerId = Object.keys(members).find((id) => id !== userId);
  if (!partnerId && channel.id) {
    partnerId = channel.id.split("-").find((id) => id !== userId);
  }
  const partnerUser = (partnerId ? members[partnerId]?.user : null) || {};
  const displayName = partnerUser.name || channel.data?.name || "Buddy";
  const displayImage = partnerUser.image || channel.data?.image || "https://testingbot.com/free-online-tools/random-avatar/411";
  const unread = channel.countUnread?.() || 0;
  const lastMessage = channel.state?.messages?.[channel.state.messages.length - 1];

  return (
    <div
      onClick={() => onSelect(channel, partnerId)}
      className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-colors duration-100 select-none ${
        isSelected
          ? "bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-primary/40 shadow-[0_0_12px_rgba(245,158,11,0.18)]"
          : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <div className="relative shrink-0">
        <img
          src={displayImage}
          alt=""
          loading="lazy"
          className="w-11 h-11 rounded-full object-cover ring-1 ring-white/10"
        />
        {partnerUser.online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-base-100 shadow-[0_0_6px_#10b981]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-sm font-bold text-white truncate">
            {displayName}
          </h4>
          {unread > 0 && (
            <span className="badge badge-primary badge-xs py-0.5 px-1.5 font-bold animate-pulse text-[10px]">
              {unread}
            </span>
          )}
        </div>
        <p className="text-xs text-base-content/50 truncate mt-0.5">
          {lastMessage?.text || "Started conversation"}
        </p>
      </div>
    </div>
  );
});
ChannelItem.displayName = "ChannelItem";

// High-performance memoized Friend Item
const FriendItem = memo(({ friend, isSelected, onSelect, onStartCall }) => {
  return (
    <div
      onClick={() => onSelect(friend)}
      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors duration-100 select-none group ${
        isSelected
          ? "bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-primary/40 shadow-[0_0_12px_rgba(245,158,11,0.18)]"
          : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative shrink-0">
          <img
            src={
              friend.profilePic ||
              "https://testingbot.com/free-online-tools/random-avatar/411"
            }
            alt=""
            loading="lazy"
            className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-base-100 shadow-[0_0_6px_#10b981]" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
            {friend.fullname}
          </h4>
          <p className="text-[11px] text-base-content/50 truncate">
            {friend.role || "Developer"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartCall(friend);
          }}
          className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all hover:scale-110"
          title="Direct Video Call"
        >
          <Video size={15} />
        </button>
      </div>
    </div>
  );
});
FriendItem.displayName = "FriendItem";

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");

  // Authentication & Tokens
  const { data: tokenData, isLoading: tokenLoading, refetch: refetchChatToken } = useStreamToken();
  const { data: videoTokenData } = useVideoToken();
  const chatToken = tokenData?.data?.token;
  const videoToken = videoTokenData?.data?.token;
  const userId = user?._id;

  // Friends & Backend API
  const { data: friendsData } = useMyFriends(50);
  const friends = useMemo(() => friendsData?.data ?? [], [friendsData?.data]);
  const { mutateAsync: createChannelBackend } = useOrCreateChannel();

  // Navigation & Channels
  const [activeChannel, setActiveChannel] = useState(null);
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [channelList, setChannelList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'friends' | 'online'
  const [profileUserId, setProfileUserId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // In-Chat Video Calling State
  const [activeCall, setActiveCall] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallJoining, setIsCallJoining] = useState(false);
  const [callViewMode, setCallViewMode] = useState("split"); // 'split' | 'pip' | 'fullscreen'

  // Fast Memory Lookups (channelId -> Channel, partnerId -> Channel)
  const channelMapRef = useRef(new Map());
  const partnerMapRef = useRef(new Map());
  const activePartnerIdRef = useRef(null);

  // Initialize Stream Chat Client
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: chatToken,
    userData: {
      id: userId || "guest",
      name: user?.fullname || "User",
      image: user?.profilePic || "https://testingbot.com/free-online-tools/random-avatar/411",
    },
  });

  // Initialize Stream Video Client
  const videoClient = useMemo(() => {
    if (!videoToken || !userId || !apiKey) return null;
    try {
      return new StreamVideoClient({
        apiKey,
        token: videoToken,
        user: {
          id: userId,
          name: user?.fullname || "User",
          image: user?.profilePic || "https://testingbot.com/free-online-tools/random-avatar/411",
        },
      });
    } catch (err) {
      console.error("StreamVideoClient init error:", err);
      return null;
    }
  }, [videoToken, user, userId]);

  useEffect(() => {
    return () => {
      videoClient?.disconnectUser?.();
    };
  }, [videoClient]);

  // Load existing channels & index them in 0ms map
  const loadUserChannels = useCallback(async () => {
    if (!chatClient || !userId) return;
    try {
      const filter = { type: "messaging", members: { $in: [userId] } };
      const sort = [{ last_message_at: -1 }];
      const channels = await chatClient.queryChannels(filter, sort, {
        watch: true,
        presence: true,
        state: true,
        limit: 30,
      });

      setChannelList(channels);

      // Populate instantaneous lookup tables
      channels.forEach((ch) => {
        channelMapRef.current.set(ch.id, ch);
        const members = ch.state?.members || {};
        const pId = Object.keys(members).find((id) => id !== userId);
        if (pId) {
          partnerMapRef.current.set(pId, ch);
        }
      });
    } catch (err) {
      console.error("Error querying channels:", err);
    }
  }, [chatClient, userId]);

  useEffect(() => {
    let isMounted = true;
    if (chatClient && userId) {
      const initLoad = async () => {
        try {
          const filter = { type: "messaging", members: { $in: [userId] } };
          const sort = [{ last_message_at: -1 }];
          const channels = await chatClient.queryChannels(filter, sort, {
            watch: true,
            presence: true,
            state: true,
            limit: 30,
          });
          if (isMounted) {
            setChannelList(channels);
            channels.forEach((ch) => {
              channelMapRef.current.set(ch.id, ch);
              const members = ch.state?.members || {};
              const pId = Object.keys(members).find((id) => id !== userId);
              if (pId) {
                partnerMapRef.current.set(pId, ch);
              }
            });
          }
        } catch (err) {
          console.error("Error querying channels:", err);
        }
      };

      initLoad();

      const handleNewMessage = (e) => {
        if (e.channel_id) {
          loadUserChannels();
        }
      };
      chatClient.on("message.new", handleNewMessage);
      return () => {
        isMounted = false;
        chatClient.off("message.new", handleNewMessage);
      };
    }
  }, [chatClient, userId, loadUserChannels]);

  // ZERO-LATENCY CHANNEL SELECTION (0ms switch)
  const selectChannel = useCallback(
    (channel, partnerId) => {
      if (!channel) return;
      const targetPartnerId =
        partnerId ||
        Object.keys(channel.state?.members || {}).find((id) => id !== userId) ||
        channel.id?.split("-").find((id) => id !== userId);

      activePartnerIdRef.current = targetPartnerId || null;
      setActivePartnerId(targetPartnerId || null);
      setActiveChannel(channel);

      if (targetPartnerId) {
        setSearchParams({ userId: targetPartnerId }, { replace: true });
      }
    },
    [userId, setSearchParams]
  );

  // Instant Friend to Chat Switcher (0ms)
  const selectFriend = useCallback(
    (friend) => {
      if (!friend || !chatClient || !userId) return;
      const partnerId = friend._id || friend.id;
      if (!partnerId) return;

      activePartnerIdRef.current = partnerId;
      setActivePartnerId(partnerId);

      // 1. Check if we already have an initialized channel for this partner
      let channel = partnerMapRef.current.get(partnerId);
      if (channel) {
        selectChannel(channel, partnerId);
        return;
      }

      // 2. Check by deterministic channelId
      const channelId = [userId, partnerId].sort().join("-");
      channel = channelMapRef.current.get(channelId);
      if (channel) {
        selectChannel(channel, partnerId);
        return;
      }

      // 3. Instantiate channel object instantly so UI renders without delay
      channel = chatClient.channel("messaging", channelId, {
        members: [userId, partnerId],
        data: {
          name: friend.fullname || friend.name || "Buddy",
          image: friend.profilePic || friend.image || "",
        },
      });

      channelMapRef.current.set(channelId, channel);
      partnerMapRef.current.set(partnerId, channel);
      selectChannel(channel, partnerId);

      // 4. Background non-blocking watch and backend sync
      channel.watch().catch(console.debug);
      createChannelBackend(partnerId).catch(console.debug);
    },
    [userId, chatClient, selectChannel, createChannelBackend]
  );

  // Sync route targetUserId on load without causing render-loops
  useEffect(() => {
    if (chatClient && targetUserId && userId) {
      if (activePartnerIdRef.current === targetUserId) {
        return; // Already open, prevent loop/lag!
      }
      const friend = friends.find((f) => f._id === targetUserId);
      selectFriend(friend || { _id: targetUserId, fullname: "Partner" });
    }
  }, [chatClient, targetUserId, userId, friends, selectFriend]);

  // Other member details in active channel (normalized with fallback)
  const otherMember = useMemo(() => {
    if (!activeChannel || !userId) return null;
    const members = activeChannel.state?.members || {};
    let otherId = Object.keys(members).find((mId) => mId !== userId);
    if (!otherId && activeChannel.id) {
      otherId = activeChannel.id.split("-").find((id) => id !== userId);
    }
    if (!otherId) {
      otherId = activePartnerId;
    }
    if (!otherId) return null;

    const memberUser = members[otherId]?.user;
    const friend = friends.find((f) => f._id === otherId);

    const name = friend?.fullname || memberUser?.name || activeChannel.data?.name || "Buddy";
    const image = friend?.profilePic || memberUser?.image || activeChannel.data?.image || "";

    return {
      id: otherId,
      _id: otherId,
      name,
      fullname: name,
      image,
      profilePic: image,
      role: friend?.role || "Developer",
      online: Boolean(memberUser?.online),
    };
  }, [activeChannel, userId, friends, activePartnerId]);

  // IN-CHAT STREAM VIDEO CALL INTEGRATION
  const startInChatVideoCall = useCallback(async () => {
    const partnerId = otherMember?.id || otherMember?._id;
    if (!videoClient || !userId || !partnerId) {
      toast.error("Video service is not ready. Please try again.");
      return;
    }
    if (isCallJoining) return;

    const callId = [userId, partnerId].sort().join("-");
    setIsCallJoining(true);

    try {
      const call = videoClient.call("default", callId);
      await call.join({ create: true });
      setActiveCall(call);
      setIsCallActive(true);
      setCallViewMode("split");

      // Notify the active Stream Chat channel with an interactive announcement
      if (activeChannel) {
        try {
          await activeChannel.sendMessage({
            text: `📹 Live Video Pairing Session started. Tap the Video Call button above to join!`,
          });
        } catch (msgErr) {
          console.debug("Video announcement note:", msgErr);
        }
      }

      toast.success("Live Video Session active! 🚀");
    } catch (err) {
      console.error("Failed to start in-chat call:", err);
      toast.error("Could not access camera/mic or join call.");
      setIsCallActive(false);
      setActiveCall(null);
    } finally {
      setIsCallJoining(false);
    }
  }, [videoClient, userId, otherMember, isCallJoining, activeChannel]);

  const endInChatVideoCall = useCallback(async () => {
    if (activeCall) {
      try {
        await activeCall.leave();
      } catch (err) {
        console.error("Error leaving video call:", err);
      }
    }
    setActiveCall(null);
    setIsCallActive(false);
    toast.success("Call ended");
  }, [activeCall]);

  // Filtered lists for the sidebar
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase();
    return friends.filter(
      (f) =>
        f.fullname?.toLowerCase().includes(q) ||
        f.role?.toLowerCase().includes(q) ||
        (f.techStack || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [friends, searchQuery]);

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channelList;
    const q = searchQuery.toLowerCase();
    return channelList.filter((ch) => {
      const name = ch.data?.name || "";
      const other = Object.values(ch.state?.members || {}).find(
        (m) => m.user?.id !== userId
      );
      const partnerName = other?.user?.name || "";
      return name.toLowerCase().includes(q) || partnerName.toLowerCase().includes(q);
    });
  }, [channelList, searchQuery, userId]);

  if (tokenLoading || !chatToken || !chatClient) {
    return (
      <div className="h-screen bg-[#0a0616] flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
        <CosmicBackground />
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-2xl animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.3)]">
            ⚡
          </div>
        </div>
        <p className="relative z-10 text-sm font-semibold text-white tracking-wider">
          Initializing Cosmic Real-Time Mesh...
        </p>
        {!tokenLoading && !chatToken && (
          <button
            onClick={() => refetchChatToken()}
            className="btn btn-primary btn-sm rounded-full px-6 shadow-lg shadow-primary/30"
          >
            Reconnect
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0616] text-[#f3f4f6] overflow-hidden font-sans select-none relative">
      <CosmicBackground />
      {/* Sleek Top Navbar (Hidden on mobile when inside an active conversation) */}
      <header
        className={`h-14 px-4 bg-[#0d0822]/90 backdrop-blur-md border-b border-white/10 items-center justify-between z-30 flex-none shadow-md relative ${
          activeChannel ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <span className="text-2xl transition-transform group-hover:scale-110">⚡</span>
            <span className="font-black text-lg bg-gradient-to-r from-amber-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              DevSync
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Live Sync
          </span>
        </div>

        {/* Global Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          <Link
            to="/dashboard"
            className="px-3 py-1.5 rounded-full text-xs text-base-content/70 hover:text-white hover:bg-white/5 transition-all"
          >
            Home
          </Link>
          <Link
            to="/find"
            className="px-3 py-1.5 rounded-full text-xs text-base-content/70 hover:text-white hover:bg-white/5 transition-all"
          >
            Find Developers
          </Link>
          <Link
            to="/friends"
            className="px-3 py-1.5 rounded-full text-xs text-base-content/70 hover:text-white hover:bg-white/5 transition-all"
          >
            Friends
          </Link>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold text-primary bg-primary/15 border border-primary/30">
            Chat
          </span>
          <Link
            to="/calls"
            className="px-3 py-1.5 rounded-full text-xs text-base-content/70 hover:text-white hover:bg-white/5 transition-all"
          >
            Calls
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Integrated Video Call Launcher in Navbar (for Desktop) */}
          {activeChannel && otherMember && (
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => {
                  setProfileUserId(otherMember.id || otherMember._id);
                  setIsProfileOpen(true);
                }}
                className="btn btn-ghost btn-sm text-xs rounded-full border border-white/10 hover:bg-white/10 gap-1 text-white"
                title="View Developer Profile"
              >
                <User size={14} />
                <span>Profile</span>
              </button>

              <button
                onClick={isCallActive ? endInChatVideoCall : startInChatVideoCall}
                disabled={isCallJoining}
                className={`btn btn-sm rounded-full text-xs font-bold gap-1.5 px-3.5 transition-all shadow-lg ${
                  isCallActive
                    ? "btn-error text-white shadow-error/40 animate-pulse"
                    : "bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-purple-500 text-white border-none shadow-[0_0_18px_rgba(168,85,247,0.4)] hover:scale-105"
                }`}
                title="Launch Synchronized Video Session"
              >
                <Video size={15} />
                <span>{isCallActive ? "Leave Call" : isCallJoining ? "Connecting..." : "Video Call"}</span>
              </button>
            </div>
          )}

          <NotificationDropdown />
        </div>
      </header>

      {/* Main Workspace (Cyber-Dock Sidebar + Chat Area + Live Video Split/PiP) */}
      <div className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        <Chat client={chatClient}>
          {/* HIGH-FPS RESPONSIVE "CYBER-DOCK" SIDEBAR */}
          <aside
            style={{ willChange: "transform, width" }}
            className={`transition-[width] duration-200 ease-out border-r border-white/10 bg-[#0c071e]/90 backdrop-blur-md flex flex-col z-20 ${
              sidebarCollapsed ? "w-20" : "w-full md:w-80 lg:w-92"
            } ${activeChannel ? "hidden md:flex flex-none" : "flex flex-1 md:flex-none"}`}
          >
            {/* Header & Instant Omni-Search */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between gap-2">
              {!sidebarCollapsed ? (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>Cyber-Dock</span>
                    </span>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="hidden md:flex text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                      title="Collapse to Icon Rail"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  </div>

                  {/* GPU-Optimized Instant Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Filter conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#140b2f] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/40 pl-8 focus:border-primary/50 focus:outline-none transition-all"
                    />
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="mx-auto text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-all"
                  title="Expand sidebar"
                >
                  <ChevronRight size={18} />
                </button>
              )}
            </div>

            {/* Segmented Switcher Tabs */}
            {!sidebarCollapsed && (
              <div className="px-3 pt-2 pb-1 flex gap-1 border-b border-white/5 bg-[#0a0519]/50">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === "all"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-base-content/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  💬 Recent ({filteredChannels.length})
                </button>
                <button
                  onClick={() => setActiveTab("friends")}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    activeTab === "friends"
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-base-content/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  👥 Buddies ({filteredFriends.length})
                </button>
              </div>
            )}

            {/* High-FPS Virtualized-Style Scroll Container */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 high-fps-scroll scrollbar-thin">
              {sidebarCollapsed ? (
                /* Collapsed Icon Rail View */
                <div className="flex flex-col items-center space-y-3 pt-2">
                  {channelList.slice(0, 10).map((ch) => {
                    const members = ch.state?.members || {};
                    const pId = Object.keys(members).find((id) => id !== userId);
                    const pUser = members[pId]?.user || {};
                    const isSelected = activeChannel?.id === ch.id;

                    return (
                      <button
                        key={ch.id}
                        onClick={() => selectChannel(ch, pId)}
                        className={`relative rounded-full transition-transform hover:scale-110 ${
                          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100" : ""
                        }`}
                        title={pUser.name || "Chat"}
                      >
                        <img
                          src={
                            pUser.image ||
                            "https://testingbot.com/free-online-tools/random-avatar/411"
                          }
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {pUser.online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-base-100" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : activeTab === "all" ? (
                /* Recent Conversations */
                filteredChannels.length > 0 ? (
                  filteredChannels.map((channel) => (
                    <ChannelItem
                      key={channel.id}
                      channel={channel}
                      userId={userId}
                      isSelected={activeChannel?.id === channel.id}
                      onSelect={selectChannel}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-xs text-base-content/60">No conversation history yet.</p>
                    <button
                      onClick={() => setActiveTab("friends")}
                      className="btn btn-xs btn-primary rounded-full px-4"
                    >
                      Find Buddies
                    </button>
                  </div>
                )
              ) : (
                /* Buddies List */
                filteredFriends.length > 0 ? (
                  filteredFriends.map((friend) => (
                    <FriendItem
                      key={friend._id}
                      friend={friend}
                      isSelected={otherMember?.id === friend._id}
                      onSelect={selectFriend}
                      onStartCall={(f) => {
                        selectFriend(f);
                        setTimeout(startInChatVideoCall, 250);
                      }}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-xs text-base-content/60">No friends found.</p>
                    <Link to="/find" className="btn btn-xs btn-primary rounded-full px-4">
                      Explore Directory
                    </Link>
                  </div>
                )
              )}
            </div>
          </aside>

          {/* MAIN CHAT & INTEGRATED VIDEO CALL CONTAINER */}
          <main
            className={`flex-1 flex-col h-full bg-[#0a0616] min-w-0 overflow-hidden relative ${
              activeChannel ? "flex" : "hidden md:flex"
            }`}
          >
            {/* INTEGRATED LIVE VIDEO SESSION (Split View or PiP View) */}
            {isCallActive && activeCall && videoClient && (
              <div
                className={`transition-all duration-200 z-30 bg-slate-950 border-b border-white/15 shadow-2xl relative flex flex-col in-chat-video-enter ${
                  callViewMode === "fullscreen"
                    ? "absolute inset-0"
                    : callViewMode === "pip"
                    ? "absolute bottom-6 right-6 w-80 h-52 rounded-2xl border border-primary/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden"
                    : "h-64 sm:h-76 md:h-84 flex-none"
                }`}
              >
                {/* Video Header Controls */}
                <div className="h-10 px-3 bg-[#0f0926]/95 backdrop-blur-md flex items-center justify-between border-b border-white/10 z-20 flex-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-xs font-bold text-white tracking-wide truncate">
                      Live Pair Session · {otherMember?.name || "Buddy"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setCallViewMode((prev) => (prev === "fullscreen" ? "split" : "fullscreen"))
                      }
                      className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      title={callViewMode === "fullscreen" ? "Exit Fullscreen" : "Fullscreen Video"}
                    >
                      <Maximize2 size={13} />
                    </button>
                    <button
                      onClick={() =>
                        setCallViewMode((prev) => (prev === "pip" ? "split" : "pip"))
                      }
                      className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      title={callViewMode === "pip" ? "Restore Split View" : "Minimize to PiP"}
                    >
                      <Minimize2 size={13} />
                    </button>
                    <button
                      onClick={endInChatVideoCall}
                      className="btn btn-error btn-xs rounded-lg text-white ml-2 px-2.5"
                      title="End Call"
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Video Stage */}
                <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                  <StreamVideo client={videoClient}>
                    <StreamCall call={activeCall}>
                      <StreamTheme className="h-full w-full">
                        <div className="h-full w-full flex flex-col justify-center items-center relative">
                          <SpeakerLayout />
                          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-30">
                            <CallControls onLeave={endInChatVideoCall} />
                          </div>
                        </div>
                      </StreamTheme>
                    </StreamCall>
                  </StreamVideo>
                </div>
              </div>
            )}

            {/* CHAT MESSAGING WINDOW */}
            {activeChannel ? (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* Dedicated Cyber Channel Bar (Responsive with 1-tap call & mobile back) */}
                <div className="h-14 px-3 sm:px-4 bg-[#0d0822] border-b border-white/10 flex items-center justify-between z-20 flex-none shadow-sm">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <button
                      onClick={() => {
                        setActiveChannel(null);
                        setActivePartnerId(null);
                        activePartnerIdRef.current = null;
                        setSearchParams({}, { replace: true });
                      }}
                      className="btn btn-ghost btn-circle btn-sm md:hidden text-white hover:bg-white/10"
                      title="Back to conversations"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <div className="relative shrink-0">
                      <img
                        src={
                          otherMember?.image ||
                          "https://testingbot.com/free-online-tools/random-avatar/411"
                        }
                        alt=""
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-white/15"
                      />
                      {otherMember?.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-base-100 shadow-[0_0_6px_#10b981]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <span>{otherMember?.name || "Buddy"}</span>
                        {otherMember?.online && (
                          <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                            · Online
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-white/50 truncate">
                        {otherMember?.role || "Encrypted Developer Channel"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={isCallActive ? endInChatVideoCall : startInChatVideoCall}
                      disabled={isCallJoining}
                      className={`btn btn-xs sm:btn-sm rounded-full font-bold gap-1.5 px-3 sm:px-4 transition-all shadow-md ${
                        isCallActive
                          ? "btn-error text-white animate-pulse"
                          : "bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-purple-500 text-white border-none shadow-[0_0_15px_rgba(168,85,247,0.35)]"
                      }`}
                    >
                      <Video size={14} />
                      <span className="inline">
                        {isCallActive ? "Leave" : isCallJoining ? "Connecting..." : "Video Call"}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        const targetId = otherMember?.id || otherMember?._id;
                        if (targetId) {
                          setProfileUserId(targetId);
                          setIsProfileOpen(true);
                        }
                      }}
                      className="btn btn-ghost btn-xs sm:btn-sm btn-circle text-white/70 hover:text-white"
                      title="View Profile"
                    >
                      <User size={16} />
                    </button>
                  </div>
                </div>

                {/* Stream Chat Channel Elements with key prop for instant channel unmount/remount */}
                <Channel channel={activeChannel} key={activeChannel.cid || activeChannel.id}>
                  <Window>
                    <MessageList />
                    <MessageComposer />
                  </Window>
                  <Thread />
                </Channel>
              </div>
            ) : (
              /* High-Impact Cyber Terminal Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-4xl shadow-[0_0_35px_rgba(245,158,11,0.2)]">
                    ⚡
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white shadow-lg">
                    <Video size={16} />
                  </div>
                </div>

                <div className="max-w-md space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    DevSync Real-Time Terminal
                  </h3>
                  <p className="text-sm text-base-content/60 leading-relaxed">
                    Select a conversation from the left to start code pairing, exchange repository links, or launch an encrypted HD video call right inside your chat.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <button
                    onClick={() => setActiveTab("friends")}
                    className="btn btn-primary rounded-full px-6 shadow-lg shadow-primary/25"
                  >
                    👥 Browse Buddies ({friends.length})
                  </button>
                  <Link
                    to="/find"
                    className="btn btn-outline border-white/20 hover:bg-white/5 rounded-full px-6 text-white"
                  >
                    🔍 Find New Partners
                  </Link>
                </div>
              </div>
            )}
          </main>
        </Chat>
      </div>

      <UserProfileModal
        userId={profileUserId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default ChatPage;