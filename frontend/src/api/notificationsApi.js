import { axiosInstance } from "../lib/axios";

export const getNotificationsApi = async (params) => {
  const response = await axiosInstance.get("/notifications", { params });
  return response.data;
};

export const markNotificationAsReadApi = async (id) => {
  const response = await axiosInstance.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsReadApi = async () => {
  const response = await axiosInstance.put("/notifications/mark-all-read");
  return response.data;
};

export const deleteNotificationApi = async (id) => {
  const response = await axiosInstance.delete(`/notifications/${id}`);
  return response.data;
};