"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type Tone = "success" | "error" | "info";

interface ToastOptions {
  tone?: Tone;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  message: string;
}

type Notify = (message: string, options?: ToastOptions) => void;

const ToastContext = createContext<Notify | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback<Notify>(
    (message, options = {}) => {
      const id = nextId.current++;
      const duration = options.duration ?? (options.action ? 7000 : 4000);
      setItems((prev) => [...prev.slice(-3), { id, message, ...options }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className="fixed bottom-4 right-4 left-4 sm:left-auto z-[70] flex flex-col items-stretch sm:items-end gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => {
          const tone = t.tone || "success";
          const Icon = tone === "error" ? AlertCircle : tone === "info" ? Info : CheckCircle2;
          const iconColor =
            tone === "error" ? "text-rose-400" : tone === "info" ? "text-sky-300" : "text-emerald-400";
          return (
            <div
              key={t.id}
              className="pointer-events-auto bg-[#1A3460] text-white pl-4 pr-2 py-3 rounded-2xl shadow-2xl border-2 border-[#F3BC6F] flex items-center gap-3 max-w-md"
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
              <span className="text-xs font-bold leading-snug flex-1">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black whitespace-nowrap cursor-pointer"
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Notify {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
