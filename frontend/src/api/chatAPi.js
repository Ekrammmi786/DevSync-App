import { axiosInstance } from "../lib/axios";

export const getStreamTokenApi = () =>
  axiosInstance.get("/chat/token").then((res) => res.data);
