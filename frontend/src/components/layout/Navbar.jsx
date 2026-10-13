import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLogout } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotification';

import NotificationDropdown from './NotificationDropdown';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Home' },
  { to: '/find', label: 'Find Developers' },
  { to: '/friends', label: 'Friends' },
  { to: '/chat', label: 'Chat' },
  { to: '/calls', label: 'Calls' },
  { to: '/notifications', label: 'Notifications' },
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
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-30">
        <div className="navbar-start">
          <div className="lg:hidden">
            <button
              className="btn btn-ghost btn-circle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
          <Link to="/dashboard" className="flex items-center gap-2 px-2">
            <span className="text-2xl">⚡</span>
            <span className="font-bold text-lg text-primary">DevSync</span>
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-1.5 ${isActive(to) ? 'font-medium text-primary' : ''}`}
                >
                  <span>{label}</span>
                  {to === '/notifications' && unreadCount > 0 && (
                    <span className="badge badge-primary badge-xs">{unreadCount}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="navbar-end gap-2">
          <NotificationDropdown />
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  src={user?.profilePic || 'https://testingbot.com/free-online-tools/random-avatar/411'}
                  alt="avatar"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title px-4 py-2">
                {user?.fullname || 'User'}
                <br />
                <span className="text-xs font-normal text-base-content/60">
                  {user?.email}
                </span>
              </li>
              <li><Link to="/onboarding">Edit Profile</Link></li>
              {user?.isAdmin && <li><Link to="/admin">Admin Panel</Link></li>}
              <li>
                <button onClick={() => logout()} className="text-error">
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="lg:hidden bg-base-100 border-b border-base-200 shadow-sm">
          <ul className="menu p-2">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={isActive(to) ? 'font-medium text-primary' : ''}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {label}
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
