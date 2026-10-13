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
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Find Developers</h1>
          <p className="text-base-content/60 mt-1">Search the community by name or role and connect.</p>
        </div>

        <form onSubmit={handleSearch} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="input input-bordered flex-1"
                placeholder="Search by name..."
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              />
              <input
                type="text"
                className="input input-bordered flex-1"
                placeholder="Role (e.g. Frontend, Full Stack...)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-magnifying-glass mr-2" /> Search
              </button>
            </div>
          </div>
        </form>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-xl animate-pulse">
                <div className="card-body items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-base-300"></div>
                  <div className="h-4 w-24 bg-base-300 rounded"></div>
                  <div className="h-3 w-32 bg-base-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !searched && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-10">
              <span className="text-5xl mb-3">🔍</span>
              <p className="text-base-content/60">Search for developers by name or role to find your next learning buddy.</p>
            </div>
          </div>
        )}

        {!isLoading && searched && results.length === 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-10">
              <span className="text-5xl mb-3">😕</span>
              <p className="text-base-content/60">No developers found. Try a different search.</p>
            </div>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((u) => (
              <div key={u._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body items-center text-center">
                  <div className="avatar cursor-pointer" onClick={() => handleOpenProfile(u._id)}>
                    <div className="w-16 rounded-full ring-2 ring-primary/20"><img src={u.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'} alt={u.fullname} /></div>
                  </div>
                  <h3
                    className="font-semibold text-base-content cursor-pointer hover:text-primary transition-colors"
                    onClick={() => handleOpenProfile(u._id)}
                  >
                    {u.fullname}
                  </h3>
                  <p className="text-sm text-base-content/60">{u.role || 'Developer'}</p>
                  {u.location && (<p className="text-xs text-base-content/50">📍 {u.location}</p>)}
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {(u.codinglanguage || []).slice(0, 3).map((t) => (<span key={t} className="badge badge-ghost badge-sm">{t}</span>))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-primary">{u.devScore ?? 0} score</span>
                  </div>

                  <div className="flex gap-2 mt-3 w-full">
                    <button className="btn btn-outline btn-sm flex-1" onClick={() => handleOpenProfile(u._id)}>
                      👤 Profile
                    </button>
                    {u.friendStatus === 'friends' ? (
                      <button className="btn btn-primary btn-sm flex-1" onClick={() => navigate(`/chat?userId=${u._id}`)}>
                        💬 Message
                      </button>
                    ) : u.friendStatus === 'pending' ? (
                      <span className="badge badge-warning self-center">⏳ Pending</span>
                    ) : (
                      <button className="btn btn-primary btn-sm flex-1" disabled={sending} onClick={() => sendRequest(u._id)}>
                        {sending ? '...' : '+ Friend'}
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
