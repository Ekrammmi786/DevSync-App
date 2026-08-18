import { useQuery, useMutation } from "@tanstack/react-query";
import { getStreamTokenApi, getOrCreateChannelApi, getVideoTokenApi } from "../api/chatAPi";

export const useStreamToken = () => {
  return useQuery({
    queryKey: ["chat", "token"],
    queryFn: getStreamTokenApi,
    retry: false,
  });
};

export const useVideoToken = () => {
  return useQuery({
    queryKey: ["video", "token"],
    queryFn: getVideoTokenApi,
    retry: false,
  });
};

export const useOrCreateChannel = () => {
  return useMutation({
    mutationFn: (userId) => getOrCreateChannelApi(userId),
  });
};