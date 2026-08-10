import { axiosInstance } from "../lib/axios";

export const getRecommendedUsersApi = (params) =>
  axiosInstance.get("/user", { params }).then((res) => res.data);

export const getLeaderboardApi = (params) =>
  axiosInstance.get("/user/leaderboard", { params }).then((res) => res.data);

export const getMyDevScoreApi = () =>
  axiosInstance.get("/user/my-dev-score").then((res) => res.data);

export const getMyFriendsApi = (params) =>
  axiosInstance.get("/user/friends", { params }).then((res) => res.data);

export const getFriendRequestsApi = (params) =>
  axiosInstance.get("/user/friend-requests", { params }).then((res) => res.data);

export const sendFriendRequestApi = (id) =>
  axiosInstance.post(`/user/friend-request/${id}`).then((res) => res.data);

export const acceptFriendRequestApi = (id) =>
  axiosInstance.put(`/user/friend-request/${id}/accept`).then((res) => res.data);

export const rejectFriendRequestApi = (id) =>
  axiosInstance.put(`/user/friend-request/${id}/reject`).then((res) => res.data);

export const searchUsersApi = (data) =>
  axiosInstance.post("/user/search", data).then((res) => res.data);

export const getOutgoingFriendRequestsApi = () =>
  axiosInstance.get("/user/outgoingfriendrequest").then((res) => res.data);

export const getUserProfileApi = (id) =>
  axiosInstance.get(`/user/profile/${id}`).then((res) => res.data);
