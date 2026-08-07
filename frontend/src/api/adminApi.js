import { axiosInstance } from "../lib/axios";

export const getAdminDashboardApi = () =>
  axiosInstance.get("/admin/dashboard").then((res) => res.data);

export const getAdminUsersApi = (params) =>
  axiosInstance.get("/admin/users", { params }).then((res) => res.data);

export const getAdminUserByIdApi = (id) =>
  axiosInstance.get(`/admin/users/${id}`).then((res) => res.data);

export const createAdminUserApi = (data) =>
  axiosInstance.post("/admin/users", data).then((res) => res.data);

export const updateAdminUserApi = (id, data) =>
  axiosInstance.put(`/admin/users/${id}`, data).then((res) => res.data);

export const deleteAdminUserApi = (id) =>
  axiosInstance.delete(`/admin/users/${id}`).then((res) => res.data);

export const toggleAdminApi = (id) =>
  axiosInstance.put(`/admin/users/${id}/toggle-admin`).then((res) => res.data);

export const getAdminFriendRequestsApi = (params) =>
  axiosInstance.get("/admin/friend-requests", { params }).then((res) => res.data);

export const getAdminSettingsApi = () =>
  axiosInstance.get("/admin/settings").then((res) => res.data);

export const updateAdminSettingsApi = (data) =>
  axiosInstance.put("/admin/settings", data).then((res) => res.data);

export const setMaintenanceApi = (data) =>
  axiosInstance.post("/admin/maintenance", data).then((res) => res.data);

export const maintenanceOffApi = () =>
  axiosInstance.post("/admin/maintenance/off").then((res) => res.data);

export const getHealthApi = () =>
  axiosInstance.get("/admin/health").then((res) => res.data);
