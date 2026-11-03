"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export const DEMO_PERSONAS = [
  {
    name: "Adit",
    email: "adit@marketing.id",
    roleLabel: "Marketing Lead & Strategist",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    description: "Supervisi seluruh campaign konten, review naskah & approval jadwal tayang",
  },
  {
    name: "Sarah",
    email: "sarah@marketing.id",
    roleLabel: "Senior Content Creator",
    badgeColor: "bg-pink-100 text-pink-800 border-pink-300",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Riset topik tren, susun naskah/copywriting, siapkan materi bahan persiapan",
  },
  {
    name: "Bima",
    email: "bima@marketing.id",
    roleLabel: "Graphic & Motion Designer",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    description: "Produksi visual, carousel Canva/Figma, video rendering, dan packaging aset",
  },
  {
    name: "Rani",
    email: "rani@marketing.id",
    roleLabel: "Social Media Admin",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    description: "Publish konten live di IG/TikTok/YT, cantumkan link live, pantau engagement",
  },
];

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
