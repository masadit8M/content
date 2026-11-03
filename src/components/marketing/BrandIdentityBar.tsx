"use client";

import React, { useState } from "react";
import {
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Palette,
  ShieldCheck,
  AlertTriangle,
  Hash,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { copyText } from "@/lib/clipboard";
import { downloadMediaFile } from "@/lib/upload-client";
import { useToast } from "@/components/common/Toast";

export function BrandIdentityBar() {
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [copiedTags, setCopiedTags] = useState(false);

  const handleCopyColor = async (hex: string, name: string) => {
    const ok = await copyText(hex);
    if (ok) {
      setCopiedHex(hex);
      toast(`Kode warna ${name} (${hex}) disalin ke clipboard!`);
      setTimeout(() => setCopiedHex(null), 1800);
    }
  };

  const handleCopyHashtags = async () => {
    const ok = await copyText(BRAND.defaultHashtags);
    if (ok) {
      setCopiedTags(true);
      toast("Hashtag wajib PAUD Arjuna disalin!");
      setTimeout(() => setCopiedTags(false), 2000);
    }
  };

  const handleDownloadLogo = async () => {
    await downloadMediaFile(
      {
        url: BRAND.logoUrl,
        name: BRAND.logoFileName,
        type: "image/png",
      },
      BRAND.logoFileName
    );
    toast("Logo PNG transparan PAUD Arjuna berhasil diunduh!");
  };

  return (
    <section className="bg-white border-2 border-[#1A3460] rounded-3xl shadow-md overflow-hidden">
      {/* Main Compact Brand Kit Row */}
      <div className="p-4 sm:px-6 sm:py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Official Logo + Download + Mandatory Rules */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] p-1.5 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src={BRAND.logoUrl}
              alt={BRAND.orgName}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#1A3460] text-[#F3BC6F]">
                Brand Kit Resmi
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#1A3460]">
                {BRAND.orgName}
              </h2>
              <span className="text-[11px] font-bold text-[#1A3460]/60 hidden sm:inline">
                ({BRAND.units})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Logo wajib di pojok kiri atas
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Tanpa watermark @handle IG
              </span>
            </div>
          </div>
        </div>

        {/* Center: Clickable Color Swatches */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black text-[#1A3460]/70 mr-1 flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-[#F35E50]" />
            Palet HEX:
          </span>
          {BRAND.colors.map((c) => {
            const isCopied = copiedHex === c.hex;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCopyColor(c.hex, c.name)}
                title={`${c.name} (${c.hex}) — ${c.role}. Klik untuk salin HEX.`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/25 border border-[#1A3460]/15 transition cursor-pointer text-[11px] font-bold text-[#1A3460]"
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="font-black">{c.name}</span>
                <code className="text-[10px] text-[#1A3460]/70">
                  {isCopied ? "✓ Disalin" : c.hex}
                </code>
              </button>
            );
          })}
        </div>

        {/* Right: Quick Action Buttons (Download Logo, Copy Hashtag, Toggle Guide) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadLogo}
            className="px-3 py-2 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="Unduh file PNG transparan untuk dipasang di CapCut / Canva"
          >
            <Download className="w-3.5 h-3.5 text-[#F3BC6F]" />
            <span>Unduh Logo PNG</span>
          </button>

          <button
            type="button"
            onClick={handleCopyHashtags}
            className="px-3 py-2 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            {copiedTags ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Hash className="w-3.5 h-3.5 text-[#F35E50]" />
                <span>Salin Hashtag</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-3 py-2 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/20 text-[#1A3460] text-xs font-black inline-flex items-center gap-1 transition cursor-pointer"
          >
            <span>Panduan</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Brand Identity & Voice Drawer */}
      {expanded && (
        <div className="border-t-2 border-[#F3BC6F]/50 bg-[#FFF8F3] p-4 sm:p-6 space-y-4">
          {/* Tagline Banner */}
          <div className="p-3.5 rounded-2xl bg-[#1A3460] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-black text-[#F3BC6F]">
                Pesan Utama Brand (Tagline)
              </div>
              <div className="text-sm font-black text-white">
                “{BRAND.tagline}”
              </div>
              <div className="text-xs text-white/80 font-medium">
                {BRAND.subTagline}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                await copyText(`${BRAND.tagline} ${BRAND.subTagline}`);
                toast("Tagline PAUD Arjuna disalin!");
              }}
              className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F3BC6F] text-xs font-black inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              Salin Tagline
            </button>
          </div>

          {/* 3 Brand DNA + Do & Don't */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
            {/* DNA & Aturan Wajib */}
            <div className="bg-white rounded-2xl p-4 border border-[#1A3460]/15 space-y-2.5">
              <div className="font-black text-[#1A3460] uppercase tracking-wider text-[11px]">
                3 Pilar DNA & Aturan Visual
              </div>
              {BRAND.dna.map((d) => (
                <div key={d.code} className="flex items-start gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#1A3460] text-[#F3BC6F] font-black text-[10px]">
                    {d.code}
                  </span>
                  <div>
                    <div className="font-black text-[#1A3460]">{d.title}</div>
                    <div className="text-[11px] text-slate-600 font-medium">
                      {d.desc}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1A3460]/10 space-y-1">
                {BRAND.rules.map((r, i) => (
                  <p key={i} className="text-[11px] font-bold text-[#F35E50]">
                    • {r}
                  </p>
                ))}
              </div>
            </div>

            {/* Brand Voice DO */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-2">
              <div className="font-black text-emerald-800 uppercase tracking-wider text-[11px]">
                ✅ Gaya Bahasa yang Dianjurkan (DO)
              </div>
              <ul className="space-y-2">
                {BRAND.voiceDo.map((v, i) => (
                  <li
                    key={i}
                    className="text-emerald-950 font-medium leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="font-black text-emerald-600">✓</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Brand Voice DONT */}
            <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-200 space-y-2">
              <div className="font-black text-rose-800 uppercase tracking-wider text-[11px]">
                🚫 Hindari Saat Edit & Menulis Caption (DON&apos;T)
              </div>
              <ul className="space-y-2">
                {BRAND.voiceDont.map((v, i) => (
                  <li
                    key={i}
                    className="text-rose-950 font-medium leading-relaxed flex items-start gap-1.5"
                  >
                    <span className="font-black text-rose-600">✕</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
