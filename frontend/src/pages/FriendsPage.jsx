import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMyFriends, useFriendRequests, useAcceptFriendRequest, useRejectFriendRequest } from '../hooks/useUser';
import UserProfileModal from '../components/UserProfileModal';

const FriendsPage = () => {
  const navigate = useNavigate();

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: friendsData, isLoading: floading } = useMyFriends(30);
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
    <>
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>👥</span>
              <span className="bg-gradient-to-r from-amber-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                My Learning Buddies
              </span>
            </h1>
            <p className="text-base-content/70 text-sm mt-1">
              Your trusted network of developers for mock interviews, code pairing, and live sessions.
            </p>
          </div>
          <Link to="/find" className="btn btn-primary btn-sm rounded-full px-5 shadow-lg">
            + Discover Developers
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search friends by name, role, tech stack, or language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full pl-12 bg-base-100/75 backdrop-blur-xl border-white/10 text-white placeholder:text-white/40 rounded-2xl"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg">🔍</span>
        </div>

        {/* Pending Requests */}
        {!rloading && requests.length > 0 && (
          <div className="card bg-base-100/75 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-base font-bold text-white flex items-center gap-2">
                <span>📩</span> Incoming Friend Requests ({requests.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                {requests.map((req) => (
                  <div
                    key={req._id}
                    className="flex items-center gap-3 p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                  >
                    <div
                      className="avatar cursor-pointer"
                      onClick={() => handleOpenProfile(req.sender?._id)}
                    >
                      <div className="w-12 h-12 rounded-full ring-1 ring-primary/30 overflow-hidden shadow-md">
                        <img
                          src={req.sender?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                          alt={req.sender?.fullname}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleOpenProfile(req.sender?._id)}
                    >
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

        {/* Friends Grid */}
        {floading ? (
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
        ) : friends.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {friends
              .filter((f) =>
                f.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.techStack || []).some((tech) =>
                  tech.toLowerCase().includes(searchQuery.toLowerCase())
                ) ||
                (f.codinglanguage || []).some((tech) =>
                  tech.toLowerCase().includes(searchQuery.toLowerCase())
                )
              )
              .map((f) => (
                <div
                  key={f._id}
                  className="card bg-base-100/75 backdrop-blur-xl border border-white/10 hover:border-primary/40 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className="card-body items-center text-center p-6">
                    <div
                      className="avatar relative cursor-pointer mb-2"
                      onClick={() => handleOpenProfile(f._id)}
                    >
                      <div className="w-16 h-16 rounded-full ring-2 ring-primary/30 group-hover:ring-primary/70 transition-all overflow-hidden shadow-lg">
                        <img
                          src={f.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                          alt={f.fullname}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-base-100 shadow-[0_0_8px_#10b981]" />
                    </div>

                    <h3
                      className="font-bold text-base text-white hover:text-primary transition-colors cursor-pointer truncate max-w-full"
                      onClick={() => handleOpenProfile(f._id)}
                    >
                      {f.fullname}
                    </h3>
                    <p className="text-xs text-base-content/60 truncate max-w-full">
                      {f.role || 'Developer'}
                    </p>

                    <div className="flex flex-wrap justify-center gap-1 my-3">
                      {(f.techStack || f.codinglanguage || []).slice(0, 3).map((t) => (
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
                        {f.devScore ?? 0} DevScore
                      </span>
                      {f.badges?.[0] && (
                        <span className="badge badge-outline border-purple-400/40 text-purple-300 text-[10px]">
                          {f.badges[0]}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 w-full mt-auto">
                      <button
                        className="btn btn-outline border-white/20 hover:bg-white/10 btn-sm rounded-xl text-white text-xs px-1"
                        onClick={() => handleOpenProfile(f._id)}
                        title="View Profile"
                      >
                        👤 Profile
                      </button>
                      <button
                        className="btn btn-primary btn-sm rounded-xl text-white text-xs px-1 shadow-md"
                        onClick={() => navigate(`/chat?userId=${f._id}`)}
                        title="Chat"
                      >
                        💬 Chat
                      </button>
                      <button
                        className="btn btn-ghost border border-white/10 hover:bg-white/5 btn-sm rounded-xl text-cyan-300 text-xs px-1"
                        onClick={() => navigate(`/calls?userId=${f._id}`)}
                        title="Video Call"
                      >
                        📹 Call
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="card bg-base-100/75 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 text-center shadow-2xl">
            <span className="text-5xl mb-3">🤝</span>
            <p className="text-base font-bold text-white">
              {searchQuery ? 'No buddies match your search query.' : "You haven't connected with any buddies yet."}
            </p>
            <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto mb-6">
              {searchQuery
                ? 'Try broadening your search term or searching by programming language.'
                : 'Browse the directory to connect with developers sharing your tech stack.'}
            </p>
            {!searchQuery && (
              <div>
                <Link to="/find" className="btn btn-primary btn-sm rounded-full px-6 shadow-lg">
                  🔍 Find Developers
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <UserProfileModal
        userId={selectedUserId}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};

export default FriendsPage;
