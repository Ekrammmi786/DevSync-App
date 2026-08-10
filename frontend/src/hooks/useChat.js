import { useQuery, useMutation } from "@tanstack/react-query";
import { getStreamTokenApi, getOrCreateChannelApi } from "../api/chatAPi";

export const useStreamToken = () => {
  return useQuery({
    queryKey: ["chat", "token"],
    queryFn: getStreamTokenApi,
    retry: false,
  });
};

export const useOrCreateChannel = () => {
  return useMutation({
    mutationFn: (userId) => getOrCreateChannelApi(userId),
  });
};
