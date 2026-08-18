import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMyFriends } from "../hooks/useUser";
import { useVideoToken } from "../hooks/useChat";
import {
  StreamVideo,
  StreamVideoClient,
  Call,
  CallControls,
  ParticipantView,
} from "@stream-io/video-react-sdk";

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

  const client = videoToken
    ? new StreamVideoClient({ apiKey, token: videoToken, user: { id: user?._id, name: user?.fullname } })
    : null;

  const startCall = useCallback(
    (friendId) => {
      const callId = [user._id, friendId].sort().join("-");
      setActiveCallId(callId);
      setIsCallActive(true);
    },
    [user._id]
  );

  const endCall = useCallback(() => {
    setIsCallActive(false);
    setActiveCallId(null);
    navigate("/calls");
  }, [navigate]);

  useEffect(() => {
    const targetUserId = searchParams.get("userId");
    if (targetUserId && !isCallActive) {
      startCall(targetUserId);
    }
  }, [searchParams, startCall, isCallActive]);

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
      <div className="h-screen flex flex-col bg-base-200 overflow-hidden">
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
              <li><Link to="/chat">Chat</Link></li>
              <li><Link to="/calls" className="font-medium text-primary">Calls</Link></li>
              <li><Link to="/notifications">Notifications</Link></li>
            </ul>
          </div>
          <div className="navbar-end">
            <button onClick={endCall} className="btn btn-error text-white">
              End Call
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <StreamVideo client={client}>
            <Call callId={activeCallId} type="default" onCreate={async (call) => {
              await call.join({ create: true });
            }}>
              <div className="w-full max-w-4xl aspect-video bg-base-300 rounded-2xl overflow-hidden relative">
                <ParticipantView />
              </div>
              <CallControls />
            </Call>
          </StreamVideo>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-30">
        <div className="navbar-start">
          <Link to="/dashboard" className="flex items-center gap-2 px-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg text-primary">DevSync</span>
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><Link to="/dashboard" className="font-medium">Home</Link></li>
            <li><Link to="/find">Find Developers</Link></li>
            <li><Link to="/friends">Friends</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/calls" className="font-medium text-primary">Calls</Link></li>
            <li><Link to="/notifications">Notifications</Link></li>
          </ul>
        </div>
        <div className="navbar-end gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img src={user?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt="avatar" />
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow">
              <li className="menu-title px-4 py-2">
                {user?.fullname || 'User'} <br />
                <span className="text-xs font-normal text-base-content/60">{user?.email}</span>
              </li>
              <li><Link to="/onboarding">Edit Profile</Link></li>
            </ul>
          </div>
        </div>
      </div>

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
    </div>
  );
};

export default CallPage;
