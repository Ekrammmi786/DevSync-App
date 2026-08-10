import { axiosInstance } from "../lib/axios";

export const getStreamTokenApi = () =>
  axiosInstance.get("/chat/token").then((res) => res.data);

export const getOrCreateChannelApi = (userId) =>
  axiosInstance.post(`/chat/channel/${userId}`).then((res) => res.data);
