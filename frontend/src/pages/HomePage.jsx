import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  useRecommendedUsers,
  useLeaderboard,
  useMyDevScore,
  useFriendRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from '../hooks/useUser';
import UserProfileModal from '../components/UserProfileModal';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: recommendedData,
    isLoading: recLoading,
  } = useRecommendedUsers(9);
  const {
    data: leaderboardData,
    isLoading: lbLoading,
  } = useLeaderboard(10);
  const { data: devScoreData, isLoading: scoreLoading } = useMyDevScore();
  const { data: requestsData, isLoading: reqLoading } = useFriendRequests(5);

  const { mutate: sendRequest, isPending: sending } = useSendFriendRequest();
  const { mutate: acceptRequest } = useAcceptFriendRequest();
  const { mutate: rejectRequest } = useRejectFriendRequest();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const recommended = recommendedData?.data ?? [];
  const leaderboard = leaderboardData?.data ?? [];
  const requests = requestsData?.data ?? [];
  const devScore = devScoreData?.data;

  const handleOpenProfile = (id) => {
    setSelectedUserId(id);
    setIsProfileOpen(true);
  };

  const isNotOnboarded = user && !user.isOnBoarded;

  if (isNotOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {isNotOnboarded && (
          <div className="alert alert-warning shadow-lg rounded-2xl border border-warning/30 bg-warning/10 text-warning">
            <div className="flex-1">
              <span>⚠️</span>
              <span>Complete your profile to connect with developers &amp; appear on the leaderboard.</span>
            </div>
            <div className="flex-none">
              <button className="btn btn-sm btn-primary rounded-xl" onClick={() => navigate('/onboarding')}>
                Complete Profile
              </button>
            </div>
          </div>
        )}

        {!isNotOnboarded && !user?.isVerified && (
          <div className="alert alert-info shadow-lg rounded-2xl border border-cyan-400/30 bg-cyan-950/40 text-cyan-200">
            <div className="flex-1">
              <span>📧</span>
              <span>Verify your email to secure your account, restore access, and unlock community features.</span>
            </div>
            <div className="flex-none">
              <button className="btn btn-sm btn-primary rounded-xl" onClick={() => navigate('/verify-email')}>
                Verify Email
              </button>
            </div>
          </div>
        )}

        {/* Hero Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-base-100/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Welcome back, {user?.fullname?.split(' ')[0] || 'Dev'}</span>
              <span className="text-amber-400">⚡</span>
            </h1>
            <p className="text-base-content/70 text-sm mt-1">
              Pair up with learning buddies, boost your DevScore, and ship projects in real time.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm rounded-xl px-5" onClick={() => navigate('/onboarding')}>
              ⚙️ Edit Profile
            </button>
            <button className="btn btn-outline border-white/20 hover:bg-white/5 btn-sm rounded-xl text-white" onClick={() => navigate('/find')}>
              🔍 Find Buddies
            </button>
          </div>
        </div>

        {/* DevScore & Leaderboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DevScore Card */}
          <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl hover:border-amber-400/30 transition-all">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-base font-bold text-white">⚡ My DevScore</h2>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">Level Metric</span>
              </div>
              {scoreLoading ? (
                <div className="animate-pulse space-y-3 py-4 text-center">
                  <div className="h-20 w-20 rounded-full bg-white/5 mx-auto"></div>
                  <div className="h-4 w-28 bg-white/5 rounded mx-auto"></div>
                </div>
              ) : devScore ? (
                <div className="text-center py-4">
                  <div
                    className="radial-progress text-amber-400 font-black text-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)] mx-auto"
                    style={{ '--value': devScore.score * 10, '--size': '6rem', '--thickness': '6px' }}
                    role="progressbar"
                  >
                    {devScore.score}
                    <span className="text-xs font-normal text-white/50">/10</span>
                  </div>
                  <p className="mt-3 font-bold text-base text-white">Platform Rank #{devScore.rank}</p>
                  <p className="text-xs text-base-content/60 mt-0.5">Based on tech breadth &amp; collaboration</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                    {devScore.badges?.length ? (
                      devScore.badges.map((b) => (
                        <span key={b} className="badge badge-primary badge-outline text-xs py-2 px-3">
                          ✦ {b}
                        </span>
                      ))
                    ) : (
                      <span className="badge badge-outline border-white/10 text-base-content/60 text-xs">
                        No badge yet · Complete pairs to earn
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-base-content/60 py-6 text-sm">
                  Complete onboarding to initialize your DevScore
                </p>
              )}
            </div>
          </div>

          {/* Leaderboard Card */}
          <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl lg:col-span-2">
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <h2 className="card-title text-base font-bold text-white flex items-center gap-2">
                  <span>🏆</span> Leaderboard
                </h2>
                <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
                  Top Contributors
                </span>
              </div>
              {lbLoading ? (
                <div className="space-y-3 py-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3 p-2">
                      <div className="h-9 w-9 rounded-full bg-white/5"></div>
                      <div className="h-4 flex-1 bg-white/5 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : leaderboard.length ? (
                <ul className="space-y-1.5">
                  {leaderboard.map((u, idx) => (
                    <li
                      key={u._id}
                      className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition cursor-pointer group"
                      onClick={() => handleOpenProfile(u._id)}
                    >
                      <span className={`w-6 text-center font-bold text-sm ${idx < 3 ? 'text-amber-400 font-extrabold' : 'text-base-content/50'}`}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </span>
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full ring-1 ring-primary/20 overflow-hidden">
                          <img
                            src={u.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                            alt={u.fullname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-white group-hover:text-primary transition-colors truncate">
                          {u.fullname}
                        </p>
                        <p className="text-xs text-base-content/60 truncate">
                          {u.techStack?.slice(0, 3).join(' · ') || u.role || 'Developer'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="badge badge-primary badge-sm py-1 font-bold">
                          {u.devScore} pts
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-base-content/60 py-6 text-sm">No developers on leaderboard yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Friend Requests Alert / Card */}
        {!reqLoading && requests.length > 0 && (
          <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <h2 className="card-title text-base font-bold text-white flex items-center gap-2">
                  <span>📩</span> Pending Friend Requests ({requests.length})
                </h2>
                <Link to="/friends" className="text-xs text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requests.map((req) => (
                  <div
                    key={req._id}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                  >
                    <div className="avatar cursor-pointer" onClick={() => handleOpenProfile(req.sender?._id)}>
                      <div className="w-11 h-11 rounded-full ring-1 ring-primary/30 overflow-hidden">
                        <img
                          src={req.sender?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                          alt={req.sender?.fullname}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenProfile(req.sender?._id)}>
                      <p className="font-bold text-sm text-white truncate hover:text-primary transition-colors">
                        {req.sender?.fullname}
                      </p>
                      <p className="text-xs text-base-content/60 truncate">
                        {req.sender?.role || 'Developer'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        className="btn btn-sm btn-primary rounded-xl px-3"
                        onClick={() => acceptRequest(req._id)}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-sm btn-ghost hover:bg-white/10 rounded-xl px-2.5 text-base-content/70"
                        onClick={() => rejectRequest(req._id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommended Developers Directory */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>✨</span> Recommended Learning Buddies
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Matched according to your tech stack, goals, and timezone.
              </p>
            </div>
            <Link to="/find" className="btn btn-outline btn-primary btn-sm rounded-full">
              Explore All →
            </Link>
          </div>

          {recLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card bg-base-100/75 backdrop-blur-xl border border-white/5 p-6 animate-pulse rounded-3xl">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-white/5"></div>
                    <div className="h-4 w-28 bg-white/5 rounded"></div>
                    <div className="h-3 w-20 bg-white/5 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recommended.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommended.map((u) => (
                <div
                  key={u._id}
                  className="card bg-base-100/75 backdrop-blur-xl border border-white/10 hover:border-primary/40 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="card-body items-center text-center p-6">
                    <div className="avatar cursor-pointer mb-2" onClick={() => handleOpenProfile(u._id)}>
                      <div className="w-16 h-16 rounded-full ring-2 ring-primary/30 group-hover:ring-primary/70 transition-all overflow-hidden shadow-lg">
                        <img
                          src={u.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                          alt={u.fullname}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <h3
                      className="font-bold text-base text-white cursor-pointer hover:text-primary transition-colors truncate max-w-full"
                      onClick={() => handleOpenProfile(u._id)}
                    >
                      {u.fullname}
                    </h3>
                    <p className="text-xs text-base-content/60 truncate max-w-full">
                      {u.role || 'Developer'}
                    </p>
                    {u.location && (
                      <p className="text-[11px] text-base-content/40 mt-0.5">📍 {u.location}</p>
                    )}

                    <div className="flex flex-wrap justify-center gap-1 my-3">
                      {(u.techStack || []).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-base-content/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="badge badge-primary badge-sm py-1 font-bold">
                        {u.devScore ?? 0} DevScore
                      </span>
                      {u.badges?.[0] && (
                        <span className="badge badge-outline border-purple-400/40 text-purple-300 text-[10px]">
                          {u.badges[0]}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 w-full mt-auto">
                      <button
                        className="btn btn-outline border-white/20 hover:bg-white/10 btn-sm flex-1 rounded-xl text-white text-xs"
                        onClick={() => handleOpenProfile(u._id)}
                      >
                        Profile
                      </button>
                      <button
                        className="btn btn-primary btn-sm flex-1 rounded-xl text-white text-xs shadow-md"
                        onClick={() => sendRequest(u._id)}
                        disabled={sending}
                      >
                        + Connect
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-base-content/60">
              No recommendations available. Update your interests in profile onboarding!
            </div>
          )}
        </div>
      </main>

      <UserProfileModal
        userId={selectedUserId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default HomePage;
