import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useAuth';
import { useMyFriends, useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from '../hooks/useUser';
import UserProfileModal from '../components/UserProfileModal';

const FriendsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mutate: logout } = useLogout();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friendsData, isLoading: floading } = useMyFriends(20);
  const { data: requestsData, isLoading: rloading } = useFriendRequests(10);
  const { mutate: acceptRequest } = useAcceptFriendRequest();
  const { mutate: rejectRequest } = useRejectFriendRequest();

  const friends = friendsData?.data ?? [];
  const requests = requestsData?.data ?? [];

  const handleOpenProfile = (id) => {
    setSelectedUserId(id);
    setIsProfileOpen(true);
  };

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
            <li><Link to="/friends" className="font-medium text-primary">Friends</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/calls">Calls</Link></li>
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
              <li><button onClick={() => logout()}>Logout</button></li>
            </ul>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content">My Friends</h1>
          <p className="text-base-content/60 mt-1">Your learning buddies and the developers you've connected with.</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search friends by name, role, or tech stack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-12"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40 text-lg">🔍</span>
        </div>

        {!rloading && requests.length > 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-lg">📩 Friend Requests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requests.map((req) => (
                  <div key={req._id} className="flex items-center gap-3 p-3 border border-base-300 rounded-lg">
                    <div className="avatar cursor-pointer" onClick={() => handleOpenProfile(req.sender?._id)}>
                      <div className="w-10 rounded-full"><img src={req.sender?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={req.sender?.fullname} /></div>
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenProfile(req.sender?._id)}>
                      <p className="font-medium text-sm truncate hover:text-primary transition-colors">{req.sender?.fullname}</p>
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

        {floading ? (
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
        ) : friends.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends
              .filter((f) => 
                f.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.techStack || []).some(tech => 
                  tech.toLowerCase().includes(searchQuery.toLowerCase())
                ) ||
                (f.codinglanguage || []).some(tech => 
                  tech.toLowerCase().includes(searchQuery.toLowerCase())
                )
              )
              .map((f) => (
              <div 
                key={f._id} 
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer active:scale-95" 
                onClick={(e) => {
                  // Only navigate if not clicking on buttons or profile
                  if (!e.target.closest('button') && !e.target.closest('.avatar')) {
                    navigate(`/chat?userId=${f._id}`);
                  }
                }}
              >
                <div className="card-body items-center text-center">
                  <div className="avatar relative" onClick={(e) => { e.stopPropagation(); handleOpenProfile(f._id); }}>
                    <div className="w-16 rounded-full ring-2 ring-primary/20">
                      <img src={f.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={f.fullname} />
                    </div>
                    {/* Online Status Indicator */}
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-base-100"></div>
                  </div>
                  <h3
                    className="font-semibold text-base-content hover:text-primary transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); handleOpenProfile(f._id); }}
                  >
                    {f.fullname}
                  </h3>
                  <p className="text-sm text-base-content/60">{f.role || 'Developer'}</p>
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {(f.techStack || f.codinglanguage || []).slice(0, 3).map((t) => (<span key={t} className="badge badge-ghost badge-sm">{t}</span>))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-primary">{f.devScore ?? 0} score</span>
                    {f.badges?.[0] && <span className="badge badge-outline">{f.badges[0]}</span>}
                  </div>
                  <div className="flex gap-2 mt-3 w-full">
                    <button className="btn btn-outline btn-sm flex-1" onClick={(e) => { e.stopPropagation(); handleOpenProfile(f._id); }}>
                      👤 Profile
                    </button>
                    <button className="btn btn-primary btn-sm flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/chat?userId=${f._id}`); }}>
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
              <span className="text-5xl mb-3">🤝</span>
              <p className="text-base-content/60">
                {searchQuery ? "No friends match your search criteria." : "You don't have any friends yet."}
              </p>
              <p className="text-sm text-base-content/50">
                {searchQuery ? "Try a different search term." : "Find developers to connect with."}
              </p>
              {!searchQuery && (
                <Link to="/find" className="btn btn-primary btn-sm mt-3">Find Developers</Link>
              )}
            </div>
          </div>
        )}
      </main>

      <UserProfileModal
        userId={selectedUserId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};

export default FriendsPage;
