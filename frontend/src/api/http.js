import axios from "axios";
import { authStorageKeys } from "../contexts/AuthContext";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

http.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(authStorageKeys.ACCESS_TOKEN_KEY);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default http;
