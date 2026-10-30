import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStreamTokenApi,
  getOrCreateChannelApi,
  getVideoTokenApi,
  uploadChatFileApi,
} from "../api/chatApi";
import toast from "react-hot-toast";

export const useStreamToken = () => {
  return useQuery({
    queryKey: ["chat", "token"],
    queryFn: getStreamTokenApi,
    retry: false,
    staleTime: 1000 * 60 * 30, // 30 minutes cache - avoids re-fetching on every page visit
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useVideoToken = () => {
  return useQuery({
    queryKey: ["video", "token"],
    queryFn: getVideoTokenApi,
    retry: false,
    staleTime: 1000 * 60 * 30, // 30 minutes cache
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useOrCreateChannel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: getOrCreateChannelApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not open chat");
    },
  });
};

export const useUploadChatFile = () => {
  return useMutation({
    mutationFn: uploadChatFileApi,
    onSuccess: (data) => {
      return data.data;
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "File upload failed");
      throw error;
    },
  });
};
