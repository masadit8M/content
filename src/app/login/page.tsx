"use client";

import React, { useState } from "react";
import { Lock, Mail, Eye, EyeOff, Sparkles, CheckCircle } from "lucide-react";

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
        setError(data.error || "Login gagal. Silakan periksa kembali email dan password Anda.");
      }
    } catch {
      setError("Terjadi gangguan koneksi ke server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setError("");
  };

  const handleQuickLogin = async (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em.trim(), password: pw }),
      });

      const data = await res.json();
      if (res.ok) {
        window.location.href = "/";
      } else {
        setError(data.error || "Login gagal. Silakan periksa kembali email dan password Anda.");
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

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A3460] text-[#F3BC6F] text-xs font-black mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#F35E50]" />
            ContentOps • PAUD Arjuna Malang
          </div>
          <h1 className="text-3xl font-black text-[#1A3460] tracking-tight">
            ContentOps <span className="text-[#F35E50]">Arjuna</span>
          </h1>
          <p className="text-[#1A3460]/75 text-xs sm:text-sm mt-1 font-semibold">
            Dashboard Kolaborasi Konten, Task Tim, & Showcase Hasil Live
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border-2 border-[#1A3460] rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-[#1A3460] uppercase tracking-wider mb-1.5">
                Email Akun Tim
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#1A3460]/40 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="masukkan email..."
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

          {/* Quick Demo Logins for Team Simulation */}
          <div className="pt-4 border-t border-[#1A3460]/10">
            <p className="text-[11px] font-black uppercase text-[#1A3460]/60 tracking-wider mb-2.5 text-center">
              Akses Cepat 1-Klik Simulasi Admin
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("adit@marketing.id", "Admin#2026")}
                className="p-2.5 text-left rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/15 transition cursor-pointer"
              >
                <div className="font-black text-[#1A3460]">Aditya Pratama</div>
                <div className="text-[10px] text-[#F35E50] font-bold">Marketing Lead ⚡ 1-Klik</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("sarah@marketing.id", "Admin#2026")}
                className="p-2.5 text-left rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/15 transition cursor-pointer"
              >
                <div className="font-black text-[#1A3460]">Sarah Amanda</div>
                <div className="text-[10px] text-[#F35E50] font-bold">Content Creator ⚡ 1-Klik</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("bima@marketing.id", "Admin#2026")}
                className="p-2.5 text-left rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/15 transition cursor-pointer"
              >
                <div className="font-black text-[#1A3460]">Bima Sakti</div>
                <div className="text-[10px] text-[#F35E50] font-bold">Graphic Designer ⚡ 1-Klik</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("rani@marketing.id", "Admin#2026")}
                className="p-2.5 text-left rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/15 transition cursor-pointer"
              >
                <div className="font-black text-[#1A3460]">Rani Puspita</div>
                <div className="text-[10px] text-[#F35E50] font-bold">Social Media Admin ⚡ 1-Klik</div>
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-500 mt-2 font-semibold">
              Password default semua persona: <code className="bg-[#FFF8F3] px-1 py-0.5 rounded border border-[#1A3460]/15 font-bold">Admin#2026</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
