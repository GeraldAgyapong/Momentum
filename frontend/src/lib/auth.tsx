"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserProfile } from "@/types";
import { apiClient, setTokens, clearTokens, getAuthToken } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName?: string, timezone?: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<User | null> => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const userData = await apiClient<User>("/auth/me/");
      setUser(userData);
      return userData;
    } catch {
      setUser(null);
      clearTokens();
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiClient<{ user: User; access: string; refresh: string }>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setTokens(res.access, res.refresh);
    setUser(res.user);
    return res.user;
  };

  const register = async (
    email: string,
    password: string,
    fullName?: string,
    timezone?: string
  ): Promise<User> => {
    const res = await apiClient<{ user: User; access: string; refresh: string }>("/auth/register/", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name: fullName || "",
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      }),
    });
    setTokens(res.access, res.refresh);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient("/auth/logout/", { method: "POST" });
    } catch {
      // Continue client cleanup regardless of server response
    }
    clearTokens();
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const updated = await apiClient<UserProfile>("/profile/", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (user) {
      setUser({ ...user, profile: updated });
    }
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
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
