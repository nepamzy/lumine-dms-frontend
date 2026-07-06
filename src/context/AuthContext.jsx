import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setUnauthorizedHandler } from "../api/client";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    // On load, try to silently refresh using the httpOnly cookie, then
    // fetch the current user. If there's no valid session, this fails
    // quietly and the visitor is simply logged out.
    (async () => {
      try {
        await authApi.refreshSession();
        const { data } = await api.get("/auth/me");
        setUser(data.data);
      } catch {
        // not logged in — that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    return authApi.register(payload);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);
const refreshUser = useCallback(async () => {
    const { data } = await api.get("/auth/me");
    setUser(data.data);
  }, []);

  return (
   <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
