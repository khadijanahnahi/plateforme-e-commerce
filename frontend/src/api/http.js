import axios from "axios";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authTokenStore";

const baseURL = import.meta.env.VITE_API_URL || "/api";

const axiosSecurityOptions = {
  baseURL,
  withCredentials: true,
};

const http = axios.create(axiosSecurityOptions);

const refreshClient = axios.create(axiosSecurityOptions);

const csrfClient = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshRequest = null;
let csrfRequest = null;
let csrfToken = null;
let csrfHeaderName = "X-XSRF-TOKEN";

export async function ensureCsrfToken(force = false) {
  if (!force && csrfToken) {
    return csrfToken;
  }

  csrfRequest ??= csrfClient
    .get("/auth/csrf")
    .then(({ data }) => {
      csrfToken = data.token;
      csrfHeaderName = data.headerName || csrfHeaderName;
      return csrfToken;
    })
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

export function clearCsrfToken() {
  csrfRequest = null;
  csrfToken = null;
  csrfHeaderName = "X-XSRF-TOKEN";
}

function requiresCsrf(method) {
  return ["post", "put", "patch", "delete"].includes(method?.toLowerCase());
}

async function prepareSecureRequest(config) {
  if (requiresCsrf(config.method)) {
    const token = await ensureCsrfToken();
    if (typeof config.headers?.set === "function") {
      config.headers.set(csrfHeaderName, token);
    } else {
      config.headers = { ...config.headers, [csrfHeaderName]: token };
    }
  }

  return config;
}

http.interceptors.request.use(async (config) => {
  await prepareSecureRequest(config);
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

refreshClient.interceptors.request.use(prepareSecureRequest);

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
      await ensureCsrfToken(true);
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
