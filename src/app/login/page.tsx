"use client";

import React, { useState } from "react";
import { Lock, User, Eye, EyeOff, Sparkles, Zap } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/team-data";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok) {
        window.location.href = "/";
      } else {
        setError(data.error || "Login gagal. Silakan periksa kembali email atau username dan password Anda.");
      }
    } catch {
      setError("Terjadi gangguan koneksi ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string, pw: string) => {
    setEmail(targetEmail);
    setPassword(pw);
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim(), password: pw }),
      });

      const data = await res.json();
      if (res.ok) {
        window.location.href = "/";
      } else {
        setError(data.error || "Login gagal. Silakan periksa kembali akun Anda.");
      }
    } catch {
      setError("Terjadi gangguan koneksi ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3] flex flex-col items-center justify-center p-4 relative selection:bg-[#F35E50]/20">
      {/* Arjuna Signature Rainbow Strip */}
      <div className="fixed top-0 left-0 right-0 h-2 flex z-50">
        <div className="flex-1 bg-[#1A3460]"></div>
        <div className="flex-1 bg-[#F35E50]"></div>
        <div className="flex-1 bg-[#F3BC6F]"></div>
        <div className="flex-1 bg-[#F9C5CB]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg my-6">
        {/* Brand header */}
        <div className="text-center mb-5">
          <img
            src="/brand/logo-arjuna.png"
            alt="Logo PAUD Arjuna Malang"
            className="w-16 h-16 object-contain mx-auto mb-2 drop-shadow-sm"
          />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A3460] text-[#F3BC6F] text-xs font-black mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F35E50]" />
            Bank Konten & Jadwal Marketing • PAUD Arjuna Malang
          </div>
          <h1 className="text-3xl font-black text-[#1A3460] tracking-tight">
            Bank Konten <span className="text-[#F35E50]">Arjuna</span>
          </h1>
          <p className="text-[#1A3460]/75 text-xs sm:text-sm mt-1 font-semibold">
            Jadwal Tema Tahun Ajaran, Studio Brainstorm Ide, Bahan Mentah, & Bank Konten Siap Upload
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border-2 border-[#1A3460] rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs sm:text-sm font-bold animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#1A3460] uppercase tracking-wider mb-1.5">
                Email atau Nama Akun Tim
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#1A3460]/40 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ketik 'adit' atau 'adit@marketing.id'..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#FFF8F3] border-2 border-[#1A3460]/15 rounded-xl text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-bold transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-[#1A3460] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#1A3460]/40 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="masukkan password..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#FFF8F3] border-2 border-[#1A3460]/15 rounded-xl text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-bold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-[#1A3460] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Memproses Masuk..." : "Masuk ke Dashboard Marketing"}
            </button>
          </form>

          {/* Quick 1-Click Access for all 9 Team Members */}
          <div className="pt-4 border-t border-[#1A3460]/10">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-black uppercase text-[#1A3460]/70 tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Akses Cepat 1-Klik Tim (9 Akun)
              </p>
              <span className="text-[10px] text-slate-400 font-bold">Pilih persona</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEAM_MEMBERS.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(member.email, "Admin#2026")}
                  className="p-2 text-left rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/25 border border-[#1A3460]/15 transition cursor-pointer flex items-center gap-2 group active:scale-95"
                >
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#F3BC6F] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-xs text-[#1A3460] truncate group-hover:text-[#F35E50]">
                      {member.name}
                    </div>
                    <div className="text-[9px] text-[#F35E50] font-bold truncate">
                      {member.roleLabel} ⚡
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[11px] text-slate-600 font-medium">
                Password default semua persona:{" "}
                <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-black text-[#1A3460]">
                  Admin#2026
                </code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
