import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useAuth';
import {
  useRecommendedUsers,
  useLeaderboard,
  useMyDevScore,
  useFriendRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
} from '../hooks/useUser';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate: logout } = useLogout();

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

  const recommended = recommendedData?.data ?? [];
  const leaderboard = leaderboardData?.data ?? [];
  const requests = requestsData?.data ?? [];
  const devScore = devScoreData?.data;

const isNotOnboarded = user && !user.isOnBoarded;

  if (isNotOnboarded) {
    return <Navigate to="/onboarding" replace />;
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
            <li><Link to="/calls">Calls</Link></li>
            <li><Link to="/notifications">Notifications</Link></li>
            {user?.isAdmin && <li><Link to="/admin">Admin</Link></li>}
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
              <li><button onClick={() => logout()}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {isNotOnboarded && (
          <div className="alert alert-warning shadow-lg">
            <div className="flex-1">
              <span>⚠️</span>
              <span>Complete your profile to connect with developers &amp; appear on the leaderboard.</span>
            </div>
            <div className="flex-none">
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/onboarding')}>Complete Profile</button>
            </div>
          </div>
        )}

        {!isNotOnboarded && !user?.isVerified && (
          <div className="alert alert-info shadow-lg">
            <div className="flex-1">
              <span>📧</span>
              <span>Verify your email to secure your account, restore access, and unlock community features.</span>
            </div>
            <div className="flex-none">
              <button className="btn btn-sm btn-primary" onClick={() => navigate('/verify-email')}>Verify Email</button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Welcome back, {user?.fullname?.split(' ')[0] || 'Dev'} 👋</h1>
            <p className="text-base-content/60 mt-1">Find learning buddies, grow your dev score, and ship together.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>+ Edit Profile</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg">My Dev Score</h2>
              {scoreLoading ? (
                <div className="animate-pulse space-y-2 py-2">
                  <div className="h-16 w-16 rounded-full bg-base-300 mx-auto"></div>
                  <div className="h-4 w-24 bg-base-300 rounded mx-auto"></div>
                </div>
              ) : devScore ? (
                <div className="text-center py-2">
                  <div className="radial-progress text-primary" style={{ '--value': devScore.score * 10 }} role="progressbar">{devScore.score}/10</div>
                  <p className="mt-3 font-semibold text-base-content">Rank #{devScore.rank}</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {devScore.badges?.length ? devScore.badges.map((b) => (<span key={b} className="badge badge-primary badge-lg">{b}</span>)) : (<span className="badge badge-outline badge-lg">No badge yet</span>)}
                  </div>
                </div>
              ) : (
                <p className="text-center text-base-content/60 py-4">Complete onboarding to see your score</p>
              )}
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl lg:col-span-2">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <h2 className="card-title text-lg">🏆 Leaderboard</h2>
                <span className="badge badge-outline">Top developers</span>
              </div>
              {lbLoading ? (
                <div className="space-y-3 py-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-base-300"></div>
                      <div className="h-4 flex-1 bg-base-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : leaderboard.length ? (
                <ul className="space-y-2">
                  {leaderboard.map((u, idx) => (
                    <li key={u._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition">
                      <span className="w-6 text-center font-bold text-base-content/60">{idx + 1}</span>
                      <div className="avatar">
                        <div className="w-9 rounded-full"><img src={u.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={u.fullname} /></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.fullname}</p>
                        <p className="text-xs text-base-content/60 truncate">{u.techStack?.slice(0, 2).join(' · ') || u.role || 'Developer'}</p>
                      </div>
                      <span className="badge badge-primary badge-sm">{u.devScore}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-base-content/60 py-4">No developers on leaderboard yet</p>
              )}
            </div>
          </div>
        </div>

        {!reqLoading && requests.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg">📩 Friend Requests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requests.map((req) => (
                  <div key={req._id} className="flex items-center gap-3 p-3 border border-base-300 rounded-lg">
                    <div className="avatar">
                      <div className="w-10 rounded-full"><img src={req.sender?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={req.sender?.fullname} /></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{req.sender?.fullname}</p>
                      <p className="text-xs text-base-content/60 truncate">{req.sender?.role || 'Developer'}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-primary" onClick={() => acceptRequest(req._id)}>Accept</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => rejectRequest(req._id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-base-content">Recommended Developers</h2>
            <span className="text-sm text-base-content/60">Based on your interests</span>
          </div>

          {recLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-base-300"></div>
                    <div className="h-4 w-24 bg-base-300 rounded"></div>
                    <div className="h-3 w-32 bg-base-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recommended.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended.map((u) => (
                <div key={u._id} className="card bg-base-100 shadow-xl">
                  <div className="card-body items-center text-center">
                    <div className="avatar">
                      <div className="w-16 rounded-full"><img src={u.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={u.fullname} /></div>
                    </div>
                    <h3 className="font-semibold text-base-content">{u.fullname}</h3>
                    <p className="text-sm text-base-content/60">{u.role || 'Developer'}</p>
                    {u.location && (<p className="text-xs text-base-content/50">📍 {u.location}</p>)}
                    <div className="flex flex-wrap justify-center gap-1 mt-1">
                      {(u.techStack || []).slice(0, 3).map((t) => (<span key={t} className="badge badge-ghost badge-sm">{t}</span>))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="badge badge-primary">{u.devScore ?? 0} score</span>
                      {u.badges?.[0] && <span className="badge badge-outline">{u.badges[0]}</span>}
                    </div>
                    <button className="btn btn-primary btn-sm w-full mt-3" disabled={sending || isNotOnboarded} onClick={() => sendRequest(u._id)}>
                      {sending ? (<><span className="loading loading-spinner loading-xs"></span> Sending...</>) : ('Add Friend')}
                    </button>
                    {isNotOnboarded && (<p className="text-xs text-warning mt-1">Complete profile to connect</p>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center py-10">
                <p className="text-base-content/60">No recommended developers yet.</p>
                <p className="text-sm text-base-content/50">Complete onboarding to see matches.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
