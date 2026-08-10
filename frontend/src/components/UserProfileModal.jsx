import { useNavigate } from 'react-router-dom';
import { useUserProfile, useSendFriendRequest } from '../hooks/useUser';

const UserProfileModal = ({ userId, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: profileData, isLoading } = useUserProfile(isOpen ? userId : null);
  const { mutate: sendRequest, isPending: sending } = useSendFriendRequest();

  if (!isOpen || !userId) return null;

  const user = profileData?.data;

  const handleMessage = () => {
    onClose();
    navigate(`/chat?userId=${userId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 border-b border-base-200">
          <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
            <span>👤</span> Developer Profile
          </h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost text-base-content/70 hover:text-base-content"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60">Loading profile details...</p>
            </div>
          ) : !user ? (
            <div className="text-center py-8 text-base-content/60">
              <p>User details unavailable.</p>
            </div>
          ) : (
            <>
              {/* Avatar & Main details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <div className="avatar">
                  <div className="w-20 sm:w-24 rounded-full ring-4 ring-primary/20 shadow-md">
                    <img
                      src={user.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                      alt={user.fullname}
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-base-content">{user.fullname}</h2>
                  <p className="text-sm text-primary font-medium">{user.role || 'Developer'}</p>
                  {user.location && (
                    <p className="text-xs text-base-content/60 mt-1 flex items-center justify-center sm:justify-start gap-1">
                      <span>📍</span> {user.location} {user.timezone ? `(${user.timezone})` : ''}
                    </p>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className="badge badge-primary font-semibold">{user.devScore ?? 0} DevScore</span>
                    {user.badges?.[0] && <span className="badge badge-outline">{user.badges[0]}</span>}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="p-3 bg-base-200/60 rounded-xl text-sm text-base-content/80 leading-relaxed italic">
                  "{user.bio}"
                </div>
              )}

              {/* Tech Stack & Languages */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50">Tech Stack & Languages</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(user.techStack || []).concat(user.codinglanguage || []).length > 0 ? (
                    Array.from(new Set([...(user.techStack || []), ...(user.codinglanguage || [])])).map((t) => (
                      <span key={t} className="badge badge-neutral badge-sm px-2.5 py-1">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-base-content/50">No stack listed</span>
                  )}
                </div>
              </div>

              {/* Learning / Interests */}
              {((user.learninglanguage && user.learninglanguage.length > 0) || (user.interests && user.interests.length > 0)) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50">Learning & Interests</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {user.learninglanguage?.map((l) => (
                      <span key={l} className="badge badge-secondary badge-outline badge-sm">
                        Learning: {l}
                      </span>
                    ))}
                    {user.interests?.map((i) => (
                      <span key={i} className="badge badge-ghost badge-sm">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-base-200/40 p-3 rounded-xl">
                <div>
                  <span className="text-base-content/50 block">Looking For:</span>
                  <span className="font-semibold text-base-content">{user.lookingFor || 'Learning Buddy'}</span>
                </div>
                <div>
                  <span className="text-base-content/50 block">Availability:</span>
                  <span className="font-semibold text-base-content">{user.availability || 'Occasional'}</span>
                </div>
                {user.experience && (
                  <div className="col-span-2">
                    <span className="text-base-content/50 block">Experience:</span>
                    <span className="font-semibold text-base-content">{user.experience}</span>
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-2 pt-1">
                {user.githubUsername && (
                  <a
                    href={`https://github.com/${user.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-xs btn-outline gap-1"
                  >
                    <span>🐙</span> GitHub
                  </a>
                )}
                {user.linkedinUsername && (
                  <a
                    href={`https://linkedin.com/in/${user.linkedinUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-xs btn-outline btn-info gap-1"
                  >
                    <span>💼</span> LinkedIn
                  </a>
                )}
                {user.portfolioUrl && (
                  <a
                    href={user.portfolioUrl.startsWith('http') ? user.portfolioUrl : `https://${user.portfolioUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-xs btn-outline btn-success gap-1"
                  >
                    <span>🌐</span> Portfolio
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {user && !isLoading && (
          <div className="p-4 border-t border-base-200 flex items-center justify-end gap-3 bg-base-100">
            {!user.isSelf && (
              <>
                {user.friendStatus === 'friends' ? (
                  <button className="btn btn-primary flex-1" onClick={handleMessage}>
                    💬 Direct Message
                  </button>
                ) : user.friendStatus === 'pending' ? (
                  <button className="btn btn-secondary flex-1" onClick={handleMessage}>
                    💬 Direct Message
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-primary flex-1"
                      disabled={sending}
                      onClick={() => sendRequest(user._id)}
                    >
                      {sending ? 'Sending...' : '➕ Add Friend'}
                    </button>
                    <button className="btn btn-ghost" onClick={handleMessage}>
                      💬 Message
                    </button>
                  </>
                )}
              </>
            )}
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
