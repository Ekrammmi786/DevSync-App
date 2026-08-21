import { axiosInstance } from "../lib/axios";

export const getSettings = () => {
  return axiosInstance.get("/settings");
};

export const updateSettings = (settings) => {
  return axiosInstance.put("/settings", settings);
};
