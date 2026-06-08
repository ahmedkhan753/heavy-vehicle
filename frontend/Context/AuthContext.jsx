"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi, setStoredToken, getStoredToken, normalizeApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authApi.me();
        if (!mounted) return;
        setToken(storedToken);
        setUser(response.data);
      } catch {
        setStoredToken("");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(credentials) {
    const response = await authApi.login(credentials);
    setStoredToken(response.data.accessToken);
    setToken(response.data.accessToken);
    setUser(response.data.user);
    return response;
  }

  async function register(payload) {
    const response = await authApi.register(payload);
    setStoredToken(response.data.accessToken);
    setToken(response.data.accessToken);
    setUser(response.data.user);
    return response;
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Local logout should still happen if the token is already expired.
    }
    setStoredToken("");
    setToken("");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      setUser,
      errorText: normalizeApiError,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
