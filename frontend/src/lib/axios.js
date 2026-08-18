import axios from "axios";

const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/refresh", "/auth/get-me", "/auth/forgot-password", "/auth/reset-password", "/auth/send-verification-otp", "/auth/verify-email", "/auth/resend-otp"];
const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

const isAuthPath = (url) => AUTH_PATHS.some((path) => url?.includes(path));
const isPublicPath = () => PUBLIC_PATHS.includes(window.location.pathname);

export const axiosInstance = axios.create({
    baseURL: "http://localhost:5002/api",
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isAuthPath(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      return new Promise(function(resolve, reject) {
        axiosInstance
          .post("/auth/refresh")
          .then(() => {
            processQueue(null, null);
            resolve(axiosInstance(originalRequest));
          })
          .catch((err) => {
            processQueue(err, null);
            localStorage.removeItem("devsync_user");
            if (!isPublicPath()) {
              window.location.href = "/login";
            }
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);
