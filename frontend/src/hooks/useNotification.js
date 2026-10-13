import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getNotificationsApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
  markNotificationAsReadApi,
} from '../api/notificationsApi';
import { acceptFriendRequestApi, rejectFriendRequestApi } from '../api/userApi';

export const useNotifications = (limit = 50) => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotificationsApi({ limit, skip: 0 }),
    refetchInterval: 10000, // Poll every 10 seconds for real-time notification updates
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationAsReadApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotificationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
  });
};

export const useAcceptFriendFromNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptFriendRequestApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Friend request accepted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Something went wrong');
    },
  });
};

export const useRejectFriendFromNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectFriendRequestApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Friend request declined');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Something went wrong');
    },
  });
};
