import { useQuery } from "@tanstack/react-query";
import { getStreamTokenApi } from "../api/chatAPi";

export const useStreamToken = () => {
  return useQuery({
    queryKey: ["chat", "token"],
    queryFn: getStreamTokenApi,
    retry: false,
  });
};
