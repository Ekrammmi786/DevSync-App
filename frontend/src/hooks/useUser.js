import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getRecommendedUsersApi,
  getLeaderboardApi,
  getMyDevScoreApi,
  getFriendRequestsApi,
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
} from "../api/userApi";

export const useRecommendedUsers = (limit = 9) => {
  return useQuery({
    queryKey: ["users", "recommended", limit],
    queryFn: () => getRecommendedUsersApi({ limit }),
  });
};

export const useLeaderboard = (limit = 10) => {
  return useQuery({
    queryKey: ["users", "leaderboard", limit],
    queryFn: () => getLeaderboardApi({ limit }),
  });
};

export const useMyDevScore = () => {
  return useQuery({
    queryKey: ["users", "my-dev-score"],
    queryFn: getMyDevScoreApi,
  });
};

export const useFriendRequests = (limit = 10) => {
  return useQuery({
    queryKey: ["users", "friend-requests", limit],
    queryFn: () => getFriendRequestsApi({ limit }),
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendFriendRequestApi,
    onSuccess: () => {
      toast.success("Friend request sent!");
      queryClient.invalidateQueries({ queryKey: ["users", "recommended"] });
    },
onError: (error) => {
      const code = error?.response?.data?.code;
      const message = error?.response?.data?.message || "Could not send request";
      if (code === "ONBOARDING_REQUIRED") {
        toast.error("⚠️ Complete your profile first to connect with developers");
      } else {
        toast.error(message);
      }
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptFriendRequestApi,
    onSuccess: () => {
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not accept request");
    },
  });
};

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectFriendRequestApi,
    onSuccess: () => {
      toast.success("Request rejected");
      queryClient.invalidateQueries({ queryKey: ["users", "friend-requests"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not reject request");
    },
  });
};
