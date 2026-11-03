"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TEAM_MEMBERS, TeamMember } from "@/lib/team-data";

export interface User {
  id: string;
  name: string;
  email: string;
  title?: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  switchPersona: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PERSONAS = TEAM_MEMBERS;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const switchPersona = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/switch-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        await refreshUser();
        router.refresh();
      }
    } catch (err) {
      console.error("Gagal ganti persona:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      window.location.href = "/login";
    } catch (err) {
      console.error("Gagal logout:", err);
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        switchPersona,
        logout,
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
