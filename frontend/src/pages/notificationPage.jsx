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

  // Track which notifications have been acted on (accept/decline)
  const [actedOn, setActedOn] = useState(new Set());

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const getIcon = (type) => {
    switch (type) {
      case "friend_request":
        return <UserPlus size={18} />;
      case "friend_accepted":
        return <Check size={18} />;
      default:
        return <Bell size={18} />;
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
    <main className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-content">
            <Bell size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-sm text-base-content/60">
              Stay updated with your activity
            </p>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
        >
          Mark all as read
        </button>
      </div>

      {/* Summary */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <p className="text-sm text-base-content/60">Your latest notifications</p>
        </div>
        <div className="badge badge-primary">{unreadCount} unread</div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-base-300 bg-base-100 p-12 text-center">
            <Bell size={42} className="mx-auto mb-4 text-base-content/30" />
            <h3 className="text-lg font-semibold">No notifications</h3>
            <p className="mt-1 text-sm text-base-content/60">You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`group rounded-2xl border bg-base-100 p-4 transition hover:shadow-md ${
                !notification.isRead
                  ? "border-primary/30 bg-primary/5"
                  : "border-base-300"
              }`}
            >
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      notification.sender?.profilePic ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                        (notification.sender?.fullname || "User")
                    }
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-content ring-2 ring-base-100">
                    {getIcon(notification.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">
                        {notification.type === "friend_request"
                          ? "New Friend Request"
                          : notification.type === "friend_accepted"
                          ? "Request Accepted"
                          : "Notification"}
                      </h3>
                      <p className="mt-1 text-sm text-base-content/70">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {!notification.isRead && (
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                      )}
                      <button
                        onClick={() =>
                          deleteNotificationMutation.mutate(notification._id)
                        }
                        className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="mt-3 flex items-center gap-1 text-xs text-base-content/50">
                    <Clock size={13} />
                    {formatTimeAgo(notification.createdAt)}
                  </div>

                  {/* Actions — only show if friend_request AND not already acted on */}
                  {notification.type === "friend_request" &&
                    !actedOn.has(notification._id) && (
                      <div className="mt-4 flex gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAcceptRequest(notification)}
                          disabled={
                            acceptRequestMutation.isPending ||
                            rejectRequestMutation.isPending
                          }
                        >
                          <Check size={16} />
                          Accept
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeclineRequest(notification)}
                          disabled={
                            acceptRequestMutation.isPending ||
                            rejectRequestMutation.isPending
                          }
                        >
                          <X size={16} />
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