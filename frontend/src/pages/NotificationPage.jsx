import { useState } from "react";
import { Bell, UserPlus, Check, X, Clock, Trash2 } from "lucide-react";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDeleteNotification,
  useAcceptFriendFromNotification,
  useRejectFriendFromNotification,
} from "../hooks/useNotification";
import { formatTimeAgo } from "../lib/utils";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function NotificationPage() {
  const { data, isLoading } = useNotifications();
  const markAllAsReadMutation = useMarkAllNotificationsRead();
  const markAsReadMutation = useMarkNotificationRead();
  const deleteNotificationMutation = useDeleteNotification();
  const acceptRequestMutation = useAcceptFriendFromNotification();
  const rejectRequestMutation = useRejectFriendFromNotification();

  const [actedOn, setActedOn] = useState(new Set());

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const getIcon = (type) => {
    switch (type) {
      case "friend_request":
        return <UserPlus size={16} />;
      case "friend_accepted":
        return <Check size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  const handleAcceptRequest = (notification) => {
    if (notification.relatedEntity) {
      acceptRequestMutation.mutate(notification.relatedEntity);
      setActedOn((prev) => new Set(prev).add(notification._id));
    }
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
  };

  const handleDeclineRequest = (notification) => {
    if (notification.relatedEntity) {
      rejectRequestMutation.mutate(notification.relatedEntity);
      setActedOn((prev) => new Set(prev).add(notification._id));
    }
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification._id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading notifications..." fullScreen />;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100/60 backdrop-blur-xl border border-white/10 p-5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/30 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Notifications</h1>
            <p className="text-xs text-base-content/60">
              Real-time friend invitations, call requests, and community milestones.
            </p>
          </div>
        </div>
        <button
          className="btn btn-ghost border border-white/10 hover:bg-white/5 btn-sm rounded-full text-xs text-white"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
        >
          Mark all as read
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">
          Activity Stream
        </span>
        <span className="badge badge-primary badge-sm py-1 font-bold">
          {unreadCount} unread
        </span>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-base-100/75 backdrop-blur-2xl p-12 text-center shadow-xl">
            <Bell size={42} className="mx-auto mb-4 text-white/30" />
            <h3 className="text-lg font-bold text-white">No notifications</h3>
            <p className="mt-1 text-xs text-base-content/60">You're all caught up with your network.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`group rounded-2xl border p-4.5 transition-all duration-200 backdrop-blur-xl ${
                !notification.isRead
                  ? "border-primary/40 bg-primary/10 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                  : "border-white/10 bg-base-100/75 hover:border-white/20"
              }`}
            >
              <div className="flex gap-4 items-start">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      notification.sender?.profilePic ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                        (notification.sender?.fullname || "User")
                    }
                    alt=""
                    className="h-12 w-12 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow-md ring-2 ring-base-100">
                    {getIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {notification.title || notification.sender?.fullname}
                      </p>
                      <p className="text-xs text-base-content/75 mt-0.5 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-base-content/40 whitespace-nowrap">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
                      <button
                        onClick={() => deleteNotificationMutation.mutate(notification._id)}
                        className="btn btn-ghost btn-circle btn-xs opacity-0 group-hover:opacity-100 transition-opacity text-error/70 hover:text-error"
                        title="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Actions for friend requests */}
                  {notification.type === "friend_request" && !actedOn.has(notification._id) && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(notification)}
                        disabled={acceptRequestMutation.isPending}
                        className="btn btn-primary btn-xs rounded-lg px-3 shadow-md"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(notification)}
                        disabled={rejectRequestMutation.isPending}
                        className="btn btn-ghost border border-white/10 hover:bg-white/5 btn-xs rounded-lg px-3 text-base-content/80"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}