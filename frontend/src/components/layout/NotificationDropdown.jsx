import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, UserPlus, Clock, ExternalLink } from 'lucide-react';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useAcceptFriendFromNotification,
  useRejectFriendFromNotification,
} from '../../hooks/useNotification';
import { formatTimeAgo } from '../../lib/utils';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { data: notifData, isLoading } = useNotifications(10);
  const markAllMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();
  const acceptMutation = useAcceptFriendFromNotification();
  const rejectMutation = useRejectFriendFromNotification();

  const notifications = notifData?.data || [];
  const unreadCount = notifData?.unreadCount || 0;

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }
    if (notification.type === 'friend_request' || notification.type === 'friend_accepted') {
      navigate('/friends');
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-circle relative"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-base-content/80" />
        {unreadCount > 0 && (
          <span className="badge badge-primary badge-xs absolute -top-0.5 -right-0.5 animate-pulse font-bold px-1.5 py-0.5">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      <div
        tabIndex={0}
        className="dropdown-content z-50 menu p-0 shadow-2xl bg-base-100 rounded-2xl w-80 sm:w-96 border border-base-200 overflow-hidden mt-3"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-base-200 bg-base-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-base-content">Notifications</h3>
            {unreadCount > 0 && (
              <span className="badge badge-primary badge-sm font-semibold">{unreadCount} new</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-xs text-primary hover:underline font-medium"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-base-200">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-base-content/60 flex flex-col items-center gap-2">
              <span className="loading loading-spinner loading-sm text-primary" />
              <span>Loading updates...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-base-content/60 space-y-1">
              <p className="text-2xl">✨</p>
              <p className="font-semibold text-base-content/80">No notifications yet</p>
              <p>You are all caught up with your network activity.</p>
            </div>
          ) : (
            notifications.slice(0, 6).map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3 transition-colors cursor-pointer flex gap-3 items-start hover:bg-base-200/60 ${
                  !n.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      n.sender?.profilePic ||
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
                        (n.sender?.fullname || 'User')
                    }
                    alt=""
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-base-300"
                  />
                  <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-primary text-primary-content text-[10px]">
                    {n.type === 'friend_request' ? (
                      <UserPlus size={10} />
                    ) : (
                      <Check size={10} />
                    )}
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs text-base-content line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-base-content/50">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatTimeAgo(n.createdAt)}
                    </span>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>

                  {/* Quick Action for Friend Request */}
                  {n.type === 'friend_request' && n.relatedEntity && !n.isRead && (
                    <div
                      className="flex gap-2 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          acceptMutation.mutate(n.relatedEntity);
                          markReadMutation.mutate(n._id);
                        }}
                        disabled={acceptMutation.isPending}
                        className="btn btn-primary btn-xs flex-1"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          rejectMutation.mutate(n.relatedEntity);
                          markReadMutation.mutate(n._id);
                        }}
                        disabled={rejectMutation.isPending}
                        className="btn btn-ghost btn-xs flex-1"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-base-200 bg-base-100 text-center">
          <Link
            to="/notifications"
            className="btn btn-ghost btn-xs btn-block gap-1 text-primary hover:bg-primary/10"
          >
            <span>View all notifications</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
