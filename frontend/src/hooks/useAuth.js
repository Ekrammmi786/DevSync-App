import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  getMeApi,
  loginApi,
  logoutApi,
  signupApi,
  forgotPasswordApi,
  resetPasswordApi,
  sendVerificationOtpApi,
  verifyEmailApi,
  resendOtpApi,
} from "../api/authAPi";


export const useGetMe = () => {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMeApi,
    retry: false,
  });
};

export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      toast.success("Login successful!");
      queryClient.setQueryData(["auth", "me"], { user: data.data });
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Login failed");
    },
  });
};


export const useSignup = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signupApi,
    onSuccess: (data) => {
      toast.success("Account created!");
      queryClient.setQueryData(["auth", "me"], { user: data.data });
      navigate("/onboarding");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Signup failed");
    },
  });
};


export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      toast.success("Logged out");
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      navigate("/");
    },
    onError: () => {
      // Even if the server call fails, clear local state and go to landing page
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      navigate("/");
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (data) => {
      toast.success(data?.data?.message || "OTP sent to your email");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Something went wrong");
    },
  });
};

export const useResetPassword = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: (data) => {
      toast.success(data?.data?.message || "Password reset successfully");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Password reset failed");
    },
  });
};

export const useSendVerificationOtp = () => {
  return useMutation({
    mutationFn: sendVerificationOtpApi,
    onSuccess: (data) => {
      toast.success(data?.data?.message || "OTP sent to your email");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not send OTP");
    },
  });
};

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmailApi,
    onSuccess: () => {
      toast.success("Email verified successfully! 🎉");
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Verification failed");
    },
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: resendOtpApi,
    onSuccess: (data) => {
      toast.success(data?.data?.message || "OTP resent to your email");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Could not resend OTP");
    },
  });
};
