"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Wand2,
  Loader2,
  BookmarkPlus,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  FileText,
} from "lucide-react";
import {
  PlanItem,
  getThemeGroups,
  getPlanItem,
  getMonthTheme,
  getSchoolPosition,
  buildStudioTopic,
  getPlanLabel,
} from "@/lib/marketing-plan";
import {
  FORMAT_OPTIONS,
  PLATFORM_OPTIONS,
  getRequiredHashtags,
} from "@/lib/content-utils";
import { createContent } from "@/lib/content-actions";
import { copyText } from "@/lib/clipboard";
import { useToast } from "@/components/common/Toast";

interface IdeaHook {
  angle: string;
  title: string;
}

interface GeneratedBrief {
  sections: { title: string; visual: string; narration: string }[];
  caption: string;
}

interface BrainstormKickstarterProps {
  focusThemeId?: string;
  onSavedToBank: () => void;
  onOpenFullStudio: (topic: string) => void;
  onNavigateToRaw: () => void;
}

function cleanJsonString(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export function BrainstormKickstarter({
  focusThemeId,
  onSavedToBank,
  onOpenFullStudio,
  onNavigateToRaw,
}: BrainstormKickstarterProps) {
  const toast = useToast();
  const themeGroups = useMemo(() => getThemeGroups(new Date()), []);
  const defaultTheme = useMemo(
    () => getMonthTheme(getSchoolPosition(new Date()).m),
    []
  );

  const [expanded, setExpanded] = useState(true);
  const [themeId, setThemeId] = useState<string>(
    focusThemeId || defaultTheme.id
  );
  const [platform, setPlatform] = useState("INSTAGRAM");
  const [formatId, setFormatId] = useState("REELS");
  const [customAngle, setCustomAngle] = useState("");

  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [allIdeas, setAllIdeas] = useState<IdeaHook[]>([]);
  const [pageIdx, setPageIdx] = useState(0);

  // Brief per kartu ide yang dipilih
  const [activeHookIdx, setActiveHookIdx] = useState<number | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [briefMap, setBriefMap] = useState<Record<number, GeneratedBrief>>({});
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Jika user klik "💡 Cari Ide" dari Jadwal Marketing, sinkronkan tema & buka panel
  useEffect(() => {
    if (focusThemeId && focusThemeId !== themeId) {
      setThemeId(focusThemeId);
      setExpanded(true);
      setAllIdeas([]);
      setBriefMap({});
      setActiveHookIdx(null);
    }
  }, [focusThemeId]);

  const currentPlanItem: PlanItem =
    getPlanItem(themeId) || defaultTheme;
  const topicSummary = useMemo(() => {
    const base = getPlanLabel(currentPlanItem);
    return customAngle.trim() ? `${base} — ${customAngle.trim()}` : base;
  }, [currentPlanItem, customAngle]);

  const visibleIdeas = useMemo(() => {
    if (allIdeas.length <= 6) return allIdeas;
    // Ambil variasi dari berbagai angle agar tidak monoton 1 angle saja
    const totalPages = Math.ceil(allIdeas.length / 6);
    const p = pageIdx % totalPages;
    const picked: IdeaHook[] = [];
    for (let i = p; i < allIdeas.length && picked.length < 6; i += totalPages) {
      picked.push(allIdeas[i]);
    }
    return picked;
  }, [allIdeas, pageIdx]);

  const handleGenerateHooks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingIdeas(true);
    setBriefMap({});
    setActiveHookIdx(null);

    try {
      const studioContext = buildStudioTopic(currentPlanItem, new Date());
      const formatLabel =
        FORMAT_OPTIONS.find((f) => f.id === formatId)?.label || "Reels";

      // Format prompt selaras dengan AI LLM sekaligus Smart Fallback PAUD Arjuna
      const prompt = [
        `Cari ide hook konten media sosial PAUD Arjuna Malang (Daycare, KB & TK).`,
        `Topik PAUD Arjuna Malang: "${topicSummary}"`,
        `Konteks Jadwal Marketing: ${studioContext}`,
        `Format Target: ${formatLabel} (${platform})`,
        `Target Audiens: "Orang tua usia 22-42 tahun dengan anak 0-6 tahun di Malang"`,
        `Buat daftar ide judul/hook dalam format JSON { "ideas": [ { "angle": "...", "title": "..." } ] } minimal 12 ide dari beragam sudut pandang (Edukasi, Curhat Working Mom, Myth-Busting, Keunggulan Kurikulum, Daily Life). Jangan gunakan @handle Instagram.`,
      ].join("\n");

      const res = await fetch("/api/ai/free-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, jsonMode: true }),
      });

      const data = await res.json();
      const parsed = JSON.parse(cleanJsonString(data.content || "{}"));
      const list: IdeaHook[] = Array.isArray(parsed?.ideas)
        ? parsed.ideas
            .filter((x: any) => x && x.title)
            .map((x: any) => ({
              angle: String(x.angle || "Ide Konten"),
              title: String(x.title),
            }))
        : [];

      if (list.length === 0) {
        throw new Error("Tidak ada ide yang dikembalikan.");
      }

      setAllIdeas(list);
      setPageIdx(0);
    } catch (err) {
      console.error(err);
      toast("Gagal memuat ide otomatis, silakan coba sekali lagi.", {
        tone: "error",
      });
    } finally {
      setLoadingIdeas(false);
    }
  };

  const handleGenerateBriefForHook = async (idx: number, hook: IdeaHook) => {
    if (briefMap[idx]) {
      setActiveHookIdx(activeHookIdx === idx ? null : idx);
      return;
    }

    setActiveHookIdx(idx);
    setLoadingBrief(true);

    try {
      const isCarousel = formatId === "FEED_CAROUSEL" || formatId === "BANNER";
      const isHariBesar = currentPlanItem.pillar === "HARIBESAR";
      const requiredTags = getRequiredHashtags({ themeId });

      const modeTrigger = isCarousel
        ? "Buatkan naskah konten carousel (slide gambar) dengan formula PACS."
        : "Buatkan script konten video pendek dengan pembagian scene dan formula PACS.";

      const prompt = [
        modeTrigger,
        `Topik PAUD Arjuna Malang: "${hook.title}"`,
        `Tema Jadwal: ${getPlanLabel(currentPlanItem)}${isHariBesar ? " (Hari Besar)" : ""}`,
        `Aturan Wajib: Logo resmi PAUD Arjuna di pojok kiri atas, warna Navy #1A3460 & Coral #F35E50, tanpa @handle IG.`,
        `Kembalikan JSON dengan struktur: { "contentSections": [ { "title": "...", "visual": "...", "narration": "..." } ], "caption": "..." }`,
      ].join("\n");

      const res = await fetch("/api/ai/free-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, jsonMode: true }),
      });

      const data = await res.json();
      const parsed = JSON.parse(cleanJsonString(data.content || "{}"));

      let sections: { title: string; visual: string; narration: string }[] = [];
      if (Array.isArray(parsed?.contentSections)) {
        sections = parsed.contentSections.map((s: any, i: number) => ({
          title: String(s.title || `Bagian ${i + 1}`),
          visual: String(s.visual || s.visualInstruction || ""),
          narration: String(s.narration || s.text || ""),
        }));
      } else if (Array.isArray(parsed?.slides)) {
        sections = parsed.slides.map((s: any, i: number) => ({
          title: `Slide ${s.slideNumber || i + 1}`,
          visual: String(s.visualInstruction || s.visual || ""),
          narration: String(s.text || s.narration || ""),
        }));
      }

      const rawCaption = String(parsed?.caption || "").trim();
      const finalCaption = rawCaption
        ? /#paudArjunaMalang/i.test(rawCaption)
          ? rawCaption
          : `${rawCaption}\n\n${requiredTags}`
        : `${hook.title}\n\nDi PAUD Arjuna Malang, setiap kegiatan dirancang untuk mendampingi masa emas 0–6 tahun dengan hangat dan terarah.\n\n${requiredTags}`;

      setBriefMap((prev) => ({
        ...prev,
        [idx]: { sections, caption: finalCaption },
      }));
    } catch (err) {
      console.error(err);
      toast("Gagal menyusun brief detail.", { tone: "error" });
    } finally {
      setLoadingBrief(false);
    }
  };

  const formatBriefText = (hook: IdeaHook, brief?: GeneratedBrief) => {
    if (!brief || brief.sections.length === 0) {
      return `Sudut Pandang: ${hook.angle}\nHook Utama: ${hook.title}\n\nPanduan: Rekam aktivitas nyata di kelas PAUD Arjuna sesuai tema "${getPlanLabel(currentPlanItem)}". Pastikan logo resmi di pojok kiri atas.`;
    }
    return brief.sections
      .map(
        (s, i) =>
          `[${i + 1}. ${s.title}]\nVisual / Rekaman: ${s.visual}\nTeks / Voiceover: ${s.narration}`
      )
      .join("\n\n");
  };

  const handleSaveIdeaToBank = async (idx: number, hook: IdeaHook) => {
    setSavingIdx(idx);
    try {
      const brief = briefMap[idx];
      const prepNotes = formatBriefText(hook, brief);
      const caption =
        brief?.caption ||
        `${hook.title}\n\n${getRequiredHashtags({ themeId })}`;

      const res = await createContent({
        title: hook.title,
        description: `Brief Brainstorm (${hook.angle}) • Tema: ${getPlanLabel(
          currentPlanItem
        )}`,
        platform,
        contentType: formatId,
        status: "IDEA",
        origin: "STUDIO",
        themeId: currentPlanItem.id,
        themeLabel: getPlanLabel(currentPlanItem),
        prepNotes,
        caption,
      });

      if (res.ok) {
        onSavedToBank();
        toast("Brief ide berhasil disimpan ke Bank Bahan Mentah!", {
          action: {
            label: "Lihat di Tab 1 →",
            onClick: onNavigateToRaw,
          },
        });
      } else {
        toast(res.error || "Gagal menyimpan brief.", { tone: "error" });
      }
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <section className="bg-gradient-to-br from-[#1A3460] via-[#172f57] to-[#122544] border-2 border-[#F3BC6F] rounded-3xl text-white shadow-lg overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#F3BC6F] text-[#1A3460] flex items-center justify-center shrink-0 shadow-sm">
            <Wand2 className="w-4 h-4 text-[#F35E50]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white">
                Studio Brainstorm Cepat (Sesuai Jadwal Tema)
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F35E50] text-white">
                ANTI KEHABISAN IDE
              </span>
            </div>
            <p className="text-[11px] text-[#F9C5CB] font-semibold">
              Kehabisan ide minggu ini? Pilih tema jadwal, dapatkan hook + panduan rekaman guru + draft caption, lalu simpan ke Bank Konten.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onOpenFullStudio(buildStudioTopic(currentPlanItem, new Date()))
            }
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-[#F3BC6F]/40 text-[#F3BC6F] text-xs font-black inline-flex items-center gap-1 transition cursor-pointer"
          >
            <span>Studio Lengkap</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black inline-flex items-center gap-1 transition cursor-pointer"
          >
            <span>{expanded ? "Tutup" : "Buka Brainstorm"}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-5 sm:px-6 space-y-4 border-t border-white/10 pt-4">
          {/* Controls Form */}
          <form
            onSubmit={handleGenerateHooks}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
          >
            {/* Pilih Tema dari JADWAL MARKET KONTEN.xlsx */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-black text-[#F3BC6F] mb-1">
                1. Pilih Tema dari Jadwal Marketing
              </label>
              <select
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white text-[#1A3460] text-xs font-black border-2 border-[#F3BC6F] focus:outline-none focus:border-[#F35E50]"
              >
                {themeGroups.map((g) => (
                  <optgroup key={g.key} label={g.label}>
                    {g.items.map((it) => (
                      <option key={`${g.key}-${it.id}`} value={it.id}>
                        {getPlanLabel(it)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Pilih Format & Platform */}
            <div className="md:col-span-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-black text-[#F3BC6F] mb-1">
                  2. Format
                </label>
                <select
                  value={formatId}
                  onChange={(e) => setFormatId(e.target.value)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-white text-[#1A3460] text-xs font-bold border border-white/20 focus:outline-none"
                >
                  {FORMAT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.code ? `[${f.code}] ` : ""}
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black text-[#F3BC6F] mb-1">
                  Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-2.5 py-2.5 rounded-xl bg-white text-[#1A3460] text-xs font-bold border border-white/20 focus:outline-none"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Konteks Tambahan Kelas */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-black text-[#F3BC6F] mb-1">
                3. Situasi Kelas / Catatan Khusus (Opsional)
              </label>
              <input
                type="text"
                value={customAngle}
                onChange={(e) => setCustomAngle(e.target.value)}
                placeholder="Mis. anak TK main peran dokter, bayi baby spa..."
                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-xs font-medium focus:outline-none focus:border-[#F3BC6F]"
              />
            </div>

            {/* Tombol Generate */}
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loadingIdeas}
                className="w-full py-2.5 px-4 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg transition disabled:opacity-60 cursor-pointer"
              >
                {loadingIdeas ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Meracik...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#F3BC6F]" />
                    <span>Cari Ide Konten</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Hasil Kartu Ide */}
          {visibleIdeas.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-black text-[#F3BC6F]">
                  💡 Pilihan Ide untuk “{topicSummary}” — pilih salah satu untuk disusun brief rekaman atau simpan ke Bank Konten:
                </div>
                {allIdeas.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setPageIdx((p) => p + 1)}
                    className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#F3BC6F]" />
                    Tampilkan 6 Sudut Pandang Lain
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {visibleIdeas.map((idea, i) => {
                  const globalIdx = pageIdx * 100 + i;
                  const brief = briefMap[globalIdx];
                  const isOpen = activeHookIdx === globalIdx;

                  return (
                    <div
                      key={globalIdx}
                      className="rounded-2xl bg-[#FFF8F3] text-[#1A3460] border-2 border-[#F3BC6F] p-4 flex flex-col justify-between gap-3 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#1A3460] text-[#F3BC6F]">
                            {idea.angle}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              await copyText(idea.title);
                              setCopiedIdx(globalIdx);
                              toast("Hook ide disalin!");
                              setTimeout(() => setCopiedIdx(null), 1500);
                            }}
                            className="text-[11px] text-[#1A3460]/60 hover:text-[#F35E50] inline-flex items-center gap-1 font-bold cursor-pointer"
                          >
                            {copiedIdx === globalIdx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <p className="text-xs sm:text-sm font-black text-[#1A3460] leading-snug">
                          “{idea.title}”
                        </p>

                        {/* Panel Brief & Caption jika dibuka */}
                        {isOpen && (
                          <div className="mt-2 pt-2.5 border-t border-[#1A3460]/15 space-y-2 text-xs">
                            {loadingBrief && !brief ? (
                              <div className="py-3 flex items-center justify-center gap-2 text-[#F35E50] font-bold">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Menyusun panduan scene/slide & caption...
                              </div>
                            ) : brief ? (
                              <>
                                <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                                  {brief.sections.map((s, si) => (
                                    <div
                                      key={si}
                                      className="p-2 rounded-xl bg-white border border-[#1A3460]/10"
                                    >
                                      <div className="font-black text-[11px] text-[#F35E50]">
                                        {s.title}
                                      </div>
                                      <div className="text-[11px] text-slate-600">
                                        <strong>Visual:</strong> {s.visual}
                                      </div>
                                      <div className="text-[11px] text-[#1A3460] font-semibold mt-0.5">
                                        <strong>Teks/VO:</strong> {s.narration}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="p-2 rounded-xl bg-white border border-[#F3BC6F]">
                                  <div className="flex items-center justify-between text-[10px] font-black text-[#1A3460]/70 mb-0.5">
                                    <span>DRAFT CAPTION + HASHTAG:</span>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await copyText(brief.caption);
                                        toast("Draft caption disalin!");
                                      }}
                                      className="text-[#F35E50] hover:underline cursor-pointer"
                                    >
                                      Salin
                                    </button>
                                  </div>
                                  <p className="text-[11px] text-[#1A3460] line-clamp-3 whitespace-pre-line">
                                    {brief.caption}
                                  </p>
                                </div>
                              </>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Aksi Kartu Ide */}
                      <div className="pt-2 border-t border-[#1A3460]/10 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleGenerateBriefForHook(globalIdx, idea)
                          }
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#F3BC6F]/30 border border-[#1A3460]/20 text-[#1A3460] text-[11px] font-black inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-[#F35E50]" />
                          {isOpen && brief ? "Tutup Brief" : "Susun Brief"}
                        </button>

                        <button
                          type="button"
                          disabled={savingIdx === globalIdx}
                          onClick={() => handleSaveIdeaToBank(globalIdx, idea)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-[11px] font-black inline-flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 cursor-pointer"
                          title="Simpan sebagai Brief di Tab 1 (Bank Bahan Mentah) agar tim/guru bisa merekam atau mendesain"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          {savingIdx === globalIdx
                            ? "Menyimpan..."
                            : "Ke Bank Konten"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
