"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, User, LogOut, ShieldCheck, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function Navbar({ projectId }: { projectId?: string }) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isArjuna = user?.email?.includes("arjuna.id");
  const orgName = isArjuna ? "Yayasan Arjuna Cendekia" : "Rumah Nara Islamic Child Center";

  return (
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

              <div className="pt-2 px-2">
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
  );
}
