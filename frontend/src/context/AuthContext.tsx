"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { get, post } from "@/lib/fetcher";

type User = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone_number?: string;
  country?: string;
  receive_email_alerts?: boolean;
  receive_sms_alerts?: boolean;
  receive_whatsapp_alerts?: boolean;
  is_verified?: boolean;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    payload: {
      username: string;
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
      phone_number?: string;
      country?: string;
    },
  ) => Promise<{ success: boolean; message: string }>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await get("/api/accounts/me/");
      setUser(data?.is_verified ? data : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (credentials: { username: string; password: string }) => {
      const data = await post("/api/accounts/login/", credentials);
      setUser(data);
    },
    [],
  );

  const logout = useCallback(async () => {
    await post("/api/accounts/logout/", {});
    setUser(null);
  }, []);

  const register = useCallback(
    async (
      payload: {
        username: string;
        email: string;
        password: string;
        first_name?: string;
        last_name?: string;
        phone_number?: string;
        country?: string;
      },
    ) => {
      const data = await post("/api/accounts/register/", payload);
      return data;
    },
    [],
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
