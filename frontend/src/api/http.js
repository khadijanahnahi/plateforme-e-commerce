import axios from "axios";
import { authStorageKeys } from "../contexts/AuthContext";

const http = axios.create({
  baseURL: "http://localhost:8080/api",
});

http.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem(authStorageKeys.ACCESS_TOKEN_KEY);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default http;
