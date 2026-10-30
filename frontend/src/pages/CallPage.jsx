import { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMyFriends } from "../hooks/useUser";
import { useVideoToken } from "../hooks/useChat";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  StreamTheme,
  CallControls,
  SpeakerLayout,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: tokenData, isLoading: tokenLoading, refetch: refetchToken } = useVideoToken();
  const videoToken = tokenData?.data?.token;

  const { data: friendsData, isLoading: friendsLoading } = useMyFriends(50);
  const friends = useMemo(() => friendsData?.data ?? [], [friendsData?.data]);

  const [activeCallId, setActiveCallId] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [call, setCall] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [callPartner, setCallPartner] = useState(null);

  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!isCallActive) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      setCallDuration(0);
    };
  }, [isCallActive]);

  const client = useMemo(() => {
    if (!videoToken || !user?._id || !apiKey) return null;
    try {
      return new StreamVideoClient({
        apiKey,
        token: videoToken,
        user: {
          id: user._id,
          name: user.fullname,
          image: user.profilePic || "https://testingbot.com/free-online-tools/random-avatar/411",
        },
      });
    } catch (err) {
      console.error("Error creating StreamVideoClient:", err);
      return null;
    }
  }, [videoToken, user]);

  useEffect(() => {
    return () => {
      client?.disconnectUser?.();
    };
  }, [client]);

  const startCall = useCallback(
    async (friendId, friendName = "Friend") => {
      if (!client || isJoining || !user?._id) return;
      const callId = [user._id, friendId].sort().join("-");
      setActiveCallId(callId);
      setIsCallActive(true);
      setIsJoining(true);
      setCallPartner(friendName);

      try {
        const newCall = client.call("default", callId);
        await newCall.join({ create: true });
        setCall(newCall);
        toast.success(`Joined video call session`);
      } catch (err) {
        console.error("Failed to join video call:", err);
        toast.error("Could not access camera/mic or join call");
        setIsCallActive(false);
        setActiveCallId(null);
        setCall(null);
      } finally {
        setIsJoining(false);
      }
    },
    [user, client, isJoining]
  );

  const endCall = useCallback(async () => {
    if (call) {
      try {
        await call.leave();
      } catch (err) {
        console.error("Error leaving call:", err);
      }
    }
    setIsCallActive(false);
    setActiveCallId(null);
    setCall(null);
    setCallPartner(null);
    navigate("/calls");
    toast.success("Call ended");
  }, [call, navigate]);

  useEffect(() => {
    const targetUserId = searchParams.get("userId");
    if (targetUserId && !isCallActive && client && friends.length > 0) {
      const friend = friends.find((f) => f._id === targetUserId);
      const timer = setTimeout(() => {
        startCall(targetUserId, friend?.fullname || "Partner");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, startCall, isCallActive, client, friends]);

  if (tokenLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-medium text-base-content/70">Connecting to DevSync Video Relay...</p>
      </div>
    );
  }

  if (!videoToken || !client) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
          📹
        </div>
        <h2 className="text-xl font-bold text-white">Video Service Initializing</h2>
        <p className="text-sm text-base-content/70 max-w-md">
          Connecting to secure WebRTC channels. Click below to reconnect if your session expired.
        </p>
        <button onClick={() => refetchToken()} className="btn btn-primary btn-sm px-6">
          🔄 Retry Connection
        </button>
      </div>
    );
  }



  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyCallLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Call link copied to clipboard! 📋");
  };

  // Active Video Room
  if (isCallActive && activeCallId) {
    return (
      <div className="h-[calc(100vh-4.5rem)] flex flex-col bg-slate-950 relative overflow-hidden border border-white/10 rounded-2xl m-2 sm:m-4 shadow-2xl">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-[#0d0822]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Live Pairing Session · {callPartner || "Active Room"}</span>
                <span className="badge badge-sm bg-primary/20 text-primary border-primary/30 font-mono text-[10px]">
                  {formatDuration(callDuration)}
                </span>
              </div>
              <div className="text-[11px] text-base-content/50">1080p HD Encrypted Stream</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyCallLink}
              className="btn btn-ghost btn-sm text-xs rounded-xl border border-white/10 hover:bg-white/10 text-white"
              title="Copy direct invite link"
            >
              📋 Copy Link
            </button>
            <button
              onClick={endCall}
              className="btn btn-error btn-sm text-white px-4 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              Leave Call
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
          <StreamVideo client={client}>
            {call ? (
              <StreamCall call={call}>
                <StreamTheme className="h-full w-full">
                  <div className="h-full w-full flex flex-col justify-center items-center relative">
                    <SpeakerLayout />
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-30">
                      <CallControls onLeave={endCall} />
                    </div>
                  </div>
                </StreamTheme>
              </StreamCall>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <span className="loading loading-spinner loading-lg text-primary"></span>
                <p className="text-sm font-medium text-white/80">Securing peer connection...</p>
              </div>
            )}
          </StreamVideo>
        </div>
      </div>
    );
  }

  // Calls Lobby & Friends List
  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>📹</span>
            <span className="bg-gradient-to-r from-amber-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              HD Video &amp; Voice Calls
            </span>
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            Launch instant 1-on-1 video rooms with your friends for mock interviews, pair programming, and code reviews.
          </p>
        </div>
        <Link to="/find" className="btn btn-outline btn-primary btn-sm rounded-full">
          🔍 Find More Partners
        </Link>
      </div>

      {friendsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card bg-base-100/80 backdrop-blur-xl border border-white/5 p-6 animate-pulse rounded-2xl">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-white/5"></div>
                <div className="h-4 w-28 bg-white/5 rounded"></div>
                <div className="h-3 w-20 bg-white/5 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : friends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {friends.map((f) => (
            <div
              key={f._id}
              className="card bg-base-100/75 backdrop-blur-xl border border-white/10 hover:border-primary/40 rounded-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="card-body items-center text-center p-6">
                <div className="avatar mb-2">
                  <div className="w-16 h-16 rounded-full ring-2 ring-primary/30 group-hover:ring-primary/70 transition-all overflow-hidden shadow-lg">
                    <img
                      src={f.profilePic || "https://testingbot.com/free-online-tools/random-avatar/411"}
                      alt={f.fullname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <h3 className="font-bold text-base text-white truncate max-w-full">
                  {f.fullname}
                </h3>
                <p className="text-xs text-base-content/60 truncate max-w-full mb-3">
                  {f.role || "Developer"}
                </p>

                {f.techStack && f.techStack.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mb-4">
                    {f.techStack.slice(0, 3).map((stk) => (
                      <span
                        key={stk}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-base-content/70"
                      >
                        {stk}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 w-full mt-auto">
                  <button
                    className="btn btn-primary btn-sm flex-1 rounded-xl shadow-md gap-1"
                    onClick={() => startCall(f._id, f.fullname)}
                  >
                    <span>📹</span> Call
                  </button>
                  <button
                    className="btn btn-ghost btn-sm flex-1 border border-white/10 rounded-xl hover:bg-white/5 gap-1"
                    onClick={() => navigate(`/chat?userId=${f._id}`)}
                  >
                    <span>💬</span> Chat
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card bg-base-100/75 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl mx-auto mb-4">
            📞
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Call Partners Yet</h3>
          <p className="text-sm text-base-content/60 max-w-sm mx-auto mb-6">
            Add friends with matching tech stacks to unlock live voice and 1080p HD video sessions.
          </p>
          <div>
            <Link to="/find" className="btn btn-primary btn-sm rounded-full px-6 shadow-lg">
              🔍 Discover Developers
            </Link>
          </div>
        </div>
      )}
    </main>
  );
};

export default CallPage;
