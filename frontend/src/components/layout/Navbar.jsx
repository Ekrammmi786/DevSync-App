import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLogout } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotification';

import NotificationDropdown from './NotificationDropdown';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/find', label: 'Find Developers', icon: '🔍' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/calls', label: 'Calls', icon: '📹' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
];

const Navbar = () => {
  const { user } = useAuth();
  const { mutate: logout } = useLogout();
  const { data: notifData } = useNotifications(10);
  const unreadCount = notifData?.unreadCount || 0;
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="navbar bg-base-100/75 backdrop-blur-xl border-b border-white/10 shadow-lg sticky top-0 z-40 transition-colors">
        <div className="navbar-start">
          <div className="lg:hidden">
            <button
              className="btn btn-ghost btn-circle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle navigation menu"
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
          <Link to="/dashboard" className="flex items-center gap-2 px-2 group">
            <span className="text-2xl transition-transform duration-300 group-hover:scale-110">⚡</span>
            <span className="font-extrabold text-xl bg-gradient-to-r from-amber-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              DevSync
            </span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-1">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all text-sm ${
                    isActive(to)
                      ? 'bg-primary/15 text-primary font-semibold border border-primary/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'text-base-content/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs">{icon}</span>
                  <span>{label}</span>
                  {to === '/notifications' && unreadCount > 0 && (
                    <span className="badge badge-primary badge-xs animate-pulse">{unreadCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end gap-2">
          <NotificationDropdown />
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring-1 ring-white/10 hover:ring-primary/50 transition-all">
              <div className="w-10 rounded-full overflow-hidden bg-neutral">
                <img
                  src={user?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                  alt={user?.fullname || 'avatar'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100/95 backdrop-blur-2xl border border-white/10 rounded-2xl z-50 mt-3 w-56 p-2 shadow-2xl space-y-1"
            >
              <li className="menu-title px-4 py-2 border-b border-white/5">
                <div className="font-bold text-white text-sm">{user?.fullname || 'User'}</div>
                <div className="text-xs font-normal text-base-content/60 truncate">
                  {user?.email}
                </div>
              </li>
              <li>
                <Link to="/onboarding" className="hover:bg-white/5 rounded-lg py-2">
                  ⚙️ Edit Profile
                </Link>
              </li>
              {user?.isAdmin && (
                <li>
                  <Link to="/admin" className="hover:bg-white/5 text-accent rounded-lg py-2">
                    🛡️ Admin Panel
                  </Link>
                </li>
              )}
              <li className="border-t border-white/5 pt-1">
                <button
                  onClick={() => logout()}
                  className="text-error hover:bg-error/10 rounded-lg py-2"
                >
                  🚪 Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-base-100/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl animate-fadeIn">
          <ul className="menu p-3 gap-1">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-2 rounded-xl py-2.5 ${
                    isActive(to)
                      ? 'bg-primary/15 text-primary font-semibold border border-primary/30'
                      : 'text-base-content/80 hover:bg-white/5'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  {to === '/notifications' && unreadCount > 0 && (
                    <span className="badge badge-primary badge-xs ml-auto">{unreadCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default Navbar;
