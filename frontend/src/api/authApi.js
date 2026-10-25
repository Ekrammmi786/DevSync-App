import { axiosInstance } from "../lib/axios";

export const loginApi = (data) => axiosInstance.post("/auth/login", data).then((res) => res.data);

export const signupApi = (data) => axiosInstance.post("/auth/signup", data).then((res) => res.data);

export const logoutApi = () => axiosInstance.post("/auth/logout").then((res) => res.data);

export const getMeApi = () => axiosInstance.get("/auth/get-me").then((res) => res.data);


export const forgotPasswordApi = (data) =>
  axiosInstance.post("/auth/forgot-password", data).then((res) => res.data);

export const resetPasswordApi = (data) =>
  axiosInstance.post("/auth/reset-password", data).then((res) => res.data);

export const sendVerificationOtpApi = () =>
  axiosInstance.post("/auth/send-verification-otp").then((res) => res.data);

export const verifyEmailApi = (data) =>
  axiosInstance.post("/auth/verify-email", data).then((res) => res.data);

export const resendOtpApi = () =>
  axiosInstance.post("/auth/resend-otp").then((res) => res.data);
