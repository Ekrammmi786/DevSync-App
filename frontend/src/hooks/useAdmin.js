import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getAdminDashboardApi,
  getAdminUsersApi,
  deleteAdminUserApi,
  toggleAdminApi,
  getAdminFriendRequestsApi,
  getAdminSettingsApi,
  updateAdminSettingsApi,
  setMaintenanceApi,
  getHealthApi,
} from "../api/adminApi";

export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getAdminDashboardApi,
  });
};

export const useAdminUsers = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => getAdminUsersApi(params),
  });
};

export const useAdminFriendRequests = (params = {}) => {
  return useQuery({
    queryKey: ["admin", "friend-requests", params],
    queryFn: () => getAdminFriendRequestsApi(params),
  });
};

export const useAdminSettings = () => {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getAdminSettingsApi,
  });
};

export const useAdminHealth = () => {
  return useQuery({
    queryKey: ["admin", "health"],
    queryFn: getHealthApi,
  });
};

export const useDeleteAdminUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminUserApi,
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not delete user");
    },
  });
};

export const useToggleAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleAdminApi,
    onSuccess: (data) => {
      toast.success(data?.data?.message || "Admin role updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not update admin role");
    },
  });
};

export const useUpdateAdminSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAdminSettingsApi,
    onSuccess: (data) => {
      toast.success(data?.data?.message || "Settings updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not update settings");
    },
  });
};

export const useSetMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setMaintenanceApi,
    onSuccess: (data) => {
      toast.success(data?.data?.message || "Maintenance mode updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not update maintenance");
    },
  });
};
