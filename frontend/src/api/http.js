import axios from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authTokenStore";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const http = axios.create({
  baseURL,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshRequest = null;

http.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshRequest ??= refreshClient
        .post("/auth/refresh")
        .then((response) => {
          setAccessToken(response.data.accessToken);
          window.dispatchEvent(new CustomEvent("shopsphere:auth-refreshed", { detail: response.data }));
          return response.data;
        })
        .finally(() => {
          refreshRequest = null;
        });

      const refreshedAuth = await refreshRequest;
      originalRequest.headers.Authorization = `Bearer ${refreshedAuth.accessToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      clearAccessToken();
      window.dispatchEvent(new CustomEvent("shopsphere:auth-cleared"));
      return Promise.reject(refreshError);
    }
  },
);

export default http;
