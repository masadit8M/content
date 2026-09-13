"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface UserProject {
  id: string;
  displayName: string;
  legalName: string;
  role: string;
  healthScore: string;
  progress: number;
}

export interface UserOrganization {
  id: string;
  name: string;
  type: string;
  role: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  title: string | null;
  avatar: string | null;
  globalRole: string;
  organizations: UserOrganization[];
  projects: UserProject[];
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
  switchPersona: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PERSONAS = [
  {
    name: "Mbak Tika",
    email: "tika@arjuna.id",
    organization: "Tim Arjuna",
    roleLabel: "Konsultan Pendamping (In-Charge)",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    description: "Mencatat aktivitas kunjungan, temuan, dan memberi rekomendasi",
  },
  {
    name: "Ms. Tsania",
    email: "tsania@rumahnara.id",
    organization: "Rumah Nara",
    roleLabel: "Kepala Daycare (Client Manager)",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Mengerjakan tugas operasional & menyetujui rekomendasi harian",
  },
  {
    name: "Mr. Ryan",
    email: "ryan@rumahnara.id",
    organization: "Rumah Nara",
    roleLabel: "Owner / Decision Maker",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    description: "Pengambil keputusan strategis & persetujuan biaya SDM",
  },
  {
    name: "Mas Adit",
    email: "masadit@arjuna.id",
    organization: "Tim Arjuna",
    roleLabel: "Lead Consultant & Admin",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    description: "Supervisi kualitas & koordinasi manajemen",
  },
  {
    name: "Cindy",
    email: "cindy@arjuna.id",
    organization: "Tim Arjuna",
    roleLabel: "Spesialis Kurikulum & SOP",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    description: "Penyusunan modul SOP & materi pembelajaran",
  },
  {
    name: "Lena",
    email: "lena@arjuna.id",
    organization: "Tim Arjuna",
    roleLabel: "Spesialis SDM & Pelatihan",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    description: "Penyediaan & seleksi tenaga guru pendamping",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (data.user.projects?.length > 0) {
          setActiveProjectId(data.user.projects[0].id);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to load user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const switchPersona = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/switch-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        await fetchUser();
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to switch persona:", err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        activeProjectId,
        setActiveProjectId,
        switchPersona,
        logout,
        refreshUser: fetchUser,
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
