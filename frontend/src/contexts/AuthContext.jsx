import { createContext, useContext, useEffect, useState } from "react";
import http, { clearCsrfToken } from "../api/http";
import { clearAccessToken, setAccessToken } from "../api/authTokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        removeLegacyLocalStorageTokens();
        const response = await http.post("/auth/refresh");
        if (cancelled) {
          return;
        }
        applyAuth(response.data);
      } catch {
        if (!cancelled) {
          clearAuth();
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function syncRefreshedAuth(event) {
      applyAuth(event.detail);
    }

    function syncClearedAuth() {
      clearAuth();
    }

    window.addEventListener("shopsphere:auth-refreshed", syncRefreshedAuth);
    window.addEventListener("shopsphere:auth-cleared", syncClearedAuth);

    return () => {
      window.removeEventListener("shopsphere:auth-refreshed", syncRefreshedAuth);
      window.removeEventListener("shopsphere:auth-cleared", syncClearedAuth);
    };
  }, []);

  function applyAuth(authResponse) {
    setAccessToken(authResponse.accessToken);
    setAccessTokenState(authResponse.accessToken);
    setUser(authResponse.user);
    setAuthLoading(false);
  }

  function clearAuth() {
    clearAccessToken();
    clearCsrfToken();
    setAccessTokenState(null);
    setUser(null);
  }

  function login(authResponse) {
    applyAuth(authResponse);
  }

  async function logout() {
    try {
      await http.post("/auth/logout");
    } finally {
      clearAuth();
    }
  }

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        authLoading,
        isAuthenticated: Boolean(accessToken && user),
        login,
        logout,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}

function removeLegacyLocalStorageTokens() {
  localStorage.removeItem("shopsphere_access_token");
  localStorage.removeItem("shopsphere_refresh_token");
  localStorage.removeItem("shopsphere_user");
}
