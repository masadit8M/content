"use client";

import React, { useState } from "react";
import { Send, AtSign, Sparkles } from "lucide-react";
import { TEAM_MEMBERS } from "@/lib/team-data";

interface TeamMentionInputProps {
  users?: any[];
  onSend: (message: string, taggedUserId?: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function TeamMentionInput({
  users,
  onSend,
  placeholder = "Tulis komentar atau instruksi revisi (gunakan @ untuk tag tim)...",
  className = "",
}: TeamMentionInputProps) {
  const activeUsers = users && users.length > 0 ? users : TEAM_MEMBERS;
  const [message, setMessage] = useState("");
  const [taggedUserId, setTaggedUserId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);

  const handleTagUser = (user: any) => {
    const mentionTag = `@${user.name} `;
    if (!message.includes(`@${user.name}`)) {
      setMessage((prev) => (prev ? `${prev} ${mentionTag}` : mentionTag));
    }
    setTaggedUserId(user.id);
    setShowTagMenu(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    // Detect if message has @name and match taggedUserId if not set
    let detectedTaggedId = taggedUserId;
    if (!detectedTaggedId) {
      for (const u of activeUsers) {
        if (message.toLowerCase().includes(`@${u.name.toLowerCase()}`)) {
          detectedTaggedId = u.id;
          break;
        }
      }
    }

    try {
      setSending(true);
      await onSend(message.trim(), detectedTaggedId);
      setMessage("");
      setTaggedUserId(undefined);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Quick Mention Chips */}
      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-[#1A3460]/70 font-black flex items-center gap-1">
          <AtSign className="w-3 h-3 text-[#F35E50]" />
          Tag Tim:
        </span>
        {activeUsers.map((u) => {
          const isTagged = message.includes(`@${u.name}`);
          return (
            <button
              key={u.id}
              type="button"
              onClick={() => handleTagUser(u)}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-black transition flex items-center gap-1 cursor-pointer ${
                isTagged
                  ? "bg-[#F35E50] text-white border-[#F35E50] shadow-sm"
                  : "bg-white hover:bg-[#F3BC6F]/20 text-[#1A3460] border-[#1A3460]/20"
              }`}
              title={`Tag @${u.name} (${u.role || u.roleLabel})`}
            >
              <span>@{u.name}</span>
              <span className="text-[9px] opacity-75 font-semibold">({u.role || u.roleLabel})</span>
            </button>
          );
        })}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-3 pr-8 py-2 text-xs rounded-xl bg-[#FFF8F3] border-2 border-[#1A3460]/20 text-[#1A3460] placeholder-slate-400 focus:outline-none focus:border-[#F35E50] font-medium"
          />
          <button
            type="button"
            onClick={() => setShowTagMenu(!showTagMenu)}
            className="absolute right-2.5 top-2 text-[#1A3460]/40 hover:text-[#F35E50] transition cursor-pointer"
            title="Pilih nama yang ingin ditag"
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown Tag Menu */}
          {showTagMenu && (
            <div className="absolute bottom-full mb-1 left-0 w-64 bg-white border-2 border-[#1A3460] rounded-xl shadow-xl z-20 p-2 space-y-1 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto">
              <p className="text-[10px] font-black uppercase text-[#1A3460]/60 px-2 py-1">
                Pilih Anggota Tim untuk Ditag:
              </p>
              {activeUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleTagUser(u)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#FFF8F3] flex items-center justify-between text-xs font-bold text-[#1A3460] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={u.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                      alt={u.name}
                      className="w-5 h-5 rounded-full object-cover border border-[#F3BC6F]"
                    />
                    <span>@{u.name}</span>
                  </div>
                  <span className="text-[10px] text-[#F35E50] font-black">{u.role || u.roleLabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="px-3.5 py-2 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white font-black text-xs flex items-center gap-1 shadow-md transition disabled:opacity-50 cursor-pointer"
        >
          {sending ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Helper untuk render teks komentar dengan highlighting tag @User
export function renderMentionedText(text: string) {
  if (!text) return "";
  const parts = text.split(/(@\w+)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={i}
              className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md bg-[#F35E50]/15 text-[#F35E50] font-black border border-[#F35E50]/30"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}
