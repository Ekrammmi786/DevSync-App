import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchUsers, useSendFriendRequest } from '../hooks/useUser';
import UserProfileModal from '../components/UserProfileModal';

const SearchUsersPage = () => {
  const navigate = useNavigate();
  const [fullname, setFullname] = useState('');
  const [role, setRole] = useState('');
  const [searched, setSearched] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { data, isLoading } = useSearchUsers(searched ? { fullname, role } : {});
  const { mutate: sendRequest, isPending: sending } = useSendFriendRequest();

  const results = data?.data ?? [];

  const handleOpenProfile = (id) => {
    setSelectedUserId(id);
    setIsProfileOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <>
      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🔍</span>
            <span className="bg-gradient-to-r from-amber-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Discover Developers
            </span>
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            Search developers by name, engineering specialty, or keywords across the network.
          </p>
        </div>

        {/* Search Query Card */}
        <form
          onSubmit={handleSearch}
          className="card bg-base-100/75 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              className="input input-bordered bg-base-200/80 border-white/10 text-white placeholder:text-white/40 flex-1 rounded-2xl"
              placeholder="Search by developer name..."
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
            <input
              type="text"
              className="input input-bordered bg-base-200/80 border-white/10 text-white placeholder:text-white/40 flex-1 rounded-2xl"
              placeholder="Specialty (e.g. Frontend, Full Stack, AI, Go...)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <button type="submit" className="btn btn-primary rounded-2xl px-6 shadow-lg shadow-primary/20">
              <span>🔍</span> Search
            </button>
          </div>
        </form>

        {isLoading && (
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
        )}

        {!isLoading && !searched && (
          <div className="card bg-base-100/75 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center shadow-xl">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-4xl mx-auto mb-4">
              🌐
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Search the Developer Grid</h3>
            <p className="text-sm text-base-content/60 max-w-sm mx-auto">
              Type a name or role above to find developers, compare DevScores, and connect.
            </p>
          </div>
        )}

        {!isLoading && searched && results.length === 0 && (
          <div className="card bg-base-100/75 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center shadow-xl">
            <div className="text-5xl mb-3">🛰️</div>
            <h3 className="text-lg font-bold text-white mb-1">No Developers Found</h3>
            <p className="text-sm text-base-content/60 max-w-sm mx-auto">
              No matching profiles found. Try searching with a broader keyword or partial name.
            </p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((u) => (
              <div
                key={u._id}
                className="card bg-base-100/75 backdrop-blur-xl border border-white/10 hover:border-primary/40 rounded-3xl shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="card-body items-center text-center p-6">
                  <div
                    className="avatar cursor-pointer mb-2"
                    onClick={() => handleOpenProfile(u._id)}
                  >
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
                    {(u.codinglanguage || u.techStack || []).slice(0, 3).map((t) => (
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
                  </div>

                  <div className="flex gap-2 w-full mt-auto">
                    <button
                      className="btn btn-outline border-white/20 hover:bg-white/10 btn-sm flex-1 rounded-xl text-white text-xs"
                      onClick={() => handleOpenProfile(u._id)}
                    >
                      Profile
                    </button>
                    {u.friendStatus === 'friends' ? (
                      <button
                        className="btn btn-primary btn-sm flex-1 rounded-xl text-white text-xs shadow-md"
                        onClick={() => navigate(`/chat?userId=${u._id}`)}
                      >
                        💬 Chat
                      </button>
                    ) : u.friendStatus === 'pending' ? (
                      <span className="badge badge-warning self-center rounded-xl py-2 px-3 text-xs">
                        ⏳ Pending
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm flex-1 rounded-xl text-white text-xs shadow-md"
                        disabled={sending}
                        onClick={() => sendRequest(u._id)}
                      >
                        {sending ? '...' : '+ Connect'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

export default SearchUsersPage;
