const UserCard = ({ user, onClick, actions }) => {
  return (
    <div
      className="flex items-center gap-3 p-3 hover:bg-base-200 rounded-xl transition-colors cursor-pointer"
      onClick={() => onClick?.(user._id)}
    >
      <div className="avatar">
        <div className="w-12 rounded-full ring-1 ring-primary/20">
          <img
            src={user.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
            alt={user.fullname}
          />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-base-content truncate">{user.fullname}</p>
        <p className="text-xs text-base-content/60 truncate">{user.role || 'Developer'}</p>
      </div>
      {actions && (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default UserCard;
