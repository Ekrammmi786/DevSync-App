import { useState, useCallback, useEffect } from "react";
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
import "@stream-io/video-react-sdk/dist/css/styles.css"; // Ensure styles are imported!

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: tokenData } = useVideoToken();
  const videoToken = tokenData?.data?.token;

  const { data: friendsData, isLoading: friendsLoading } = useMyFriends(50);
  const friends = friendsData?.data ?? [];

  const [activeCallId, setActiveCallId] = useState(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (videoToken && user?._id && !client) {
      const _client = new StreamVideoClient({
        apiKey,
        token: videoToken,
        user: { id: user._id, name: user.fullname },
      });
      setClient(_client);

      return () => {
        _client.disconnectUser();
      };
    }
  }, [videoToken, user?._id, user?.fullname, client]);

  const startCall = useCallback(
    async (friendId) => {
      if (!client || isJoining) return;
      const callId = [user._id, friendId].sort().join("-");
      setActiveCallId(callId);
      setIsCallActive(true);
      setIsJoining(true);
      
      try {
        const newCall = client.call("default", callId);
        await newCall.join({ create: true });
        setCall(newCall);
      } catch (err) {
        console.error("Failed to join video call:", err);
        setIsCallActive(false);
        setActiveCallId(null);
      } finally {
        setIsJoining(false);
      }
    },
    [user._id, client, isJoining]
  );

  const endCall = useCallback(async () => {
    if (call) {
      await call.leave();
    }
    setIsCallActive(false);
    setActiveCallId(null);
    setCall(null);
    navigate("/calls");
  }, [call, navigate]);

  useEffect(() => {
    const targetUserId = searchParams.get("userId");
    if (targetUserId && !isCallActive && client) {
      startCall(targetUserId);
    }
  }, [searchParams, startCall, isCallActive, client]);

  if (!videoToken || !client) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center space-y-3">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-sm font-medium text-base-content/70">Connecting to DevSync Calls...</p>
      </div>
    );
  }

  if (isCallActive && activeCallId) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-base-200 overflow-hidden">
        <div className="p-2 flex justify-end">
          <button onClick={endCall} className="btn btn-error text-white">
            Leave Call
          </button>
        </div>

        <div className="flex-1 bg-black overflow-hidden relative">
          <StreamVideo client={client}>
            {call ? (
              <StreamCall call={call}>
                <StreamTheme className="h-full">
                  <div className="h-full flex flex-col justify-center items-center">
                     <SpeakerLayout />
                     <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
                        <CallControls onLeave={endCall} />
                     </div>
                  </div>
                </StreamTheme>
              </StreamCall>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white">Joining call...</div>
            )}
          </StreamVideo>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Calls</h1>
          <p className="text-base-content/60 mt-1">Start a voice or video call with your friends.</p>
        </div>

        {friendsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-xl animate-pulse">
                <div className="card-body items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-base-300"></div>
                  <div className="h-4 w-24 bg-base-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((f) => (
              <div key={f._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body items-center text-center">
                  <div className="avatar">
                    <div className="w-16 rounded-full ring-2 ring-primary/20">
                      <img src={f.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={f.fullname} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base-content">{f.fullname}</h3>
                  <p className="text-sm text-base-content/60">{f.role || 'Developer'}</p>
                  <div className="flex gap-2 mt-3 w-full">
                    <button
                      className="btn btn-primary btn-sm flex-1"
                      onClick={() => startCall(f._id)}
                    >
                      📹 Video Call
                    </button>
                    <button
                      className="btn btn-outline btn-sm flex-1"
                      onClick={() => navigate(`/chat?userId=${f._id}`)}
                    >
                      💬 Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-10">
              <span className="text-5xl mb-3">📞</span>
              <p className="text-base-content/60">You don't have any friends to call yet.</p>
              <p className="text-sm text-base-content/50">Find developers to connect with.</p>
              <Link to="/find" className="btn btn-primary btn-sm mt-3">Find Developers</Link>
            </div>
          </div>
        )}
      </main>
  );
};

export default CallPage;
