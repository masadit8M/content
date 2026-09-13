"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Navbar({ projectId }: { projectId?: string }) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Change Password Modal State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submittingPass, setSubmittingPass] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  const isArjuna = user?.email?.includes("arjuna.id");
  const orgName = isArjuna ? "Yayasan Arjuna Cendekia" : "Rumah Nara Islamic Child Center";

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword.length < 6) {
      setPassError("Password baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Konfirmasi password baru tidak cocok");
      return;
    }

    try {
      setSubmittingPass(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPassSuccess(data.message || "Password berhasil diperbarui!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowChangePasswordModal(false);
          setPassSuccess("");
        }, 2000);
      } else {
        setPassError(data.error || "Gagal mengubah password");
      }
    } catch {
      setPassError("Terjadi gangguan koneksi. Silakan coba lagi.");
    } finally {
      setSubmittingPass(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16 px-4 sm:px-6 flex items-center justify-between no-print">
        {/* Brand & Project Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-slate-900 tracking-tight text-base sm:text-lg hover:opacity-90 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              A
            </div>
            <div>
              <span className="block font-black text-slate-900 text-sm sm:text-base leading-tight">
                Arjuna Consulting
              </span>
              <span className="block text-xs font-semibold text-emerald-700">
                Rumah Nara Islamic Child Center
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition shadow-xs"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
                {user?.name ? user.name.charAt(0) : "U"}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                  {user?.name || "Pengguna"}
                </span>
                <span className="block text-[11px] font-semibold text-slate-500">
                  {isArjuna ? "Tim Arjuna" : "Pihak Rumah Nara"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {/* User Popover Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-base shrink-0">
                      {user?.name ? user.name.charAt(0) : "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Organisasi:</span>
                    <span className="font-bold text-slate-800">{orgName}</span>
                  </div>
                </div>

                <div className="pt-2 px-2 space-y-1">
                  {/* Ubah Password Option */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowChangePasswordModal(true);
                      setPassError("");
                      setPassSuccess("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-sm font-bold text-slate-700 hover:bg-slate-100 transition flex items-center gap-2"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    Ubah Password Akun
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full px-3 py-2.5 rounded-xl text-left text-sm font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar dari Akun (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MODAL: UBAH PASSWORD */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                    Ubah Password Akun
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[240px]">
                    {user?.name} ({user?.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 sm:p-6 space-y-4">
              {passError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold">
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {passSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Password Saat Ini *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Password Baru *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Konfirmasi Password Baru *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPass || !currentPassword || !newPassword || !confirmPassword}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submittingPass ? "Menyimpan..." : "Simpan Password Baru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
