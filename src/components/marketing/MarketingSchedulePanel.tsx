"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  Sparkles,
  Plus,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  BookOpen,
  Layers,
  Info,
} from "lucide-react";
import {
  SCHOOL_MONTHS,
  PILLARS,
  PILLAR_ORDER,
  PLAN_ITEMS,
  PlanItem,
  WeekNo,
  getSchoolPosition,
  getMonthTheme,
  getMonthSchedule,
  getItemsForSlot,
  getUpcoming,
  describeWeeksAhead,
  formatPlanDate,
  daysUntil,
  toRoman,
  formatSlot,
  getPlanLabel,
} from "@/lib/marketing-plan";
import { FORMAT_OPTIONS } from "@/lib/content-utils";

interface MarketingSchedulePanelProps {
  contents: any[];
  selectedThemeId: string;
  onSelectThemeFilter: (themeId: string) => void;
  onBrainstormTheme: (item: PlanItem) => void;
  onCreateForTheme: (themeId: string) => void;
}

export function MarketingSchedulePanel({
  contents,
  selectedThemeId,
  onSelectThemeFilter,
  onBrainstormTheme,
  onCreateForTheme,
}: MarketingSchedulePanelProps) {
  const now = useMemo(() => new Date(), []);
  const pos = useMemo(() => getSchoolPosition(now), [now]);
  const nextMonthIdx = (pos.m + 1) % 12;

  const [activeMonth, setActiveMonth] = useState<number>(pos.m);
  const [activeTab, setActiveTab] = useState<"monthly" | "routine">("monthly");
  const [expanded, setExpanded] = useState<boolean>(true);

  // Hitung jumlah konten di Bank Konten per themeId
  const countByTheme = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of contents) {
      if (c?.themeId) {
        map[c.themeId] = (map[c.themeId] || 0) + 1;
      }
    }
    return map;
  }, [contents]);

  // Hitung total konten di satu bulan tahun ajaran (tema bulanan + item terjadwal bulan tsb)
  const countByMonth = useMemo(() => {
    const counts = Array(12).fill(0);
    for (let m = 0; m < 12; m++) {
      const theme = getMonthTheme(m);
      const ids = new Set<string>([theme.id]);
      for (const w of [1, 2, 3, 4] as WeekNo[]) {
        for (const it of getItemsForSlot(m, w)) ids.add(it.id);
      }
      let sum = 0;
      ids.forEach((id) => {
        sum += countByTheme[id] || 0;
      });
      counts[m] = sum;
    }
    return counts;
  }, [countByTheme]);

  const thisMonthTheme = getMonthTheme(pos.m);
  const thisWeekItems = getItemsForSlot(pos.m, pos.w);

  const nextMonthTheme = getMonthTheme(nextMonthIdx);
  const nextMonthItems = useMemo(() => {
    const seen = new Set<string>();
    const list: PlanItem[] = [];
    for (const w of [1, 2, 3, 4] as WeekNo[]) {
      for (const it of getItemsForSlot(nextMonthIdx, w)) {
        if (!seen.has(it.id)) {
          seen.add(it.id);
          list.push(it);
        }
      }
    }
    return list;
  }, [nextMonthIdx]);

  const upcomingList = useMemo(() => getUpcoming(now, 4), [now]);

  const viewedTheme = getMonthTheme(activeMonth);
  const viewedSchedule = useMemo(
    () => getMonthSchedule(activeMonth),
    [activeMonth]
  );

  const routinePillars = PILLAR_ORDER.filter((p) => !PILLARS[p].scheduled);

  return (
    <section className="bg-white border-2 border-[#1A3460] rounded-3xl shadow-md overflow-hidden">
      {/* Header Bar */}
      <div className="bg-[#1A3460] text-white px-4 py-3.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#F3BC6F]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#F35E50] border border-[#F3BC6F] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white">
                Jadwal Marketing Konten ( Juli – Juni )
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F3BC6F] text-[#1A3460]">
                JADWAL MARKET KONTEN.xlsx
              </span>
            </div>
            <p className="text-[11px] text-[#F9C5CB] font-semibold">
              Panduan tema minggu ini, persiapan bulan depan, hari besar nasional, & pilar konten rutin
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveMonth(pos.m);
              setActiveTab("monthly");
              setExpanded(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F3BC6F] text-xs font-black transition cursor-pointer"
          >
            📍 Lompat ke Bulan Ini ({SCHOOL_MONTHS[pos.m]})
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-3 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-1 transition cursor-pointer"
          >
            <span>{expanded ? "Ringkas Jadwal" : "Buka Matriks Jadwal"}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 3-Horizon Barometer: Minggu Ini, Bulan Depan, & Agenda Terdekat (Selalu Tampil) */}
      <div className="p-4 sm:p-5 bg-[#FFF8F3] grid grid-cols-1 lg:grid-cols-3 gap-3.5 border-b border-[#1A3460]/10">
        {/* Card 1: Fokus Minggu Ini */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#F35E50] shadow-sm flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-[#F35E50] text-white">
                📍 Fokus Minggu Ini • {formatSlot(pos)}
              </span>
              <span className="text-[11px] font-black text-[#1A3460]/70">
                {countByTheme[thisMonthTheme.id] || 0} konten
              </span>
            </div>
            <div className="text-base font-black text-[#1A3460]">
              📚 Tema: {thisMonthTheme.label}
            </div>
            {thisWeekItems.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {thisWeekItems.map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onBrainstormTheme(it)}
                    className={`text-[11px] font-black px-2 py-0.5 rounded-lg border cursor-pointer hover:opacity-80 ${PILLARS[it.pillar].chip}`}
                    title="Klik untuk cari ide tema ini"
                  >
                    {PILLARS[it.pillar].emoji} {it.label}
                    {formatPlanDate(it) ? ` (${formatPlanDate(it)})` : ""}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 font-medium">
                Tidak ada hari besar khusus di minggu ini — fokus pada Tema{" "}
                <strong>{thisMonthTheme.label}</strong> & Pilar Konten Rutin.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1A3460]/10">
            <button
              type="button"
              onClick={() => onBrainstormTheme(thisWeekItems[0] || thisMonthTheme)}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-[11px] font-black inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#F35E50]" />
              Cari Ide Minggu Ini
            </button>
            <button
              type="button"
              onClick={() =>
                onCreateForTheme((thisWeekItems[0] || thisMonthTheme).id)
              }
              className="px-2.5 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Upload
            </button>
          </div>
        </div>

        {/* Card 2: Persiapan Bulan Depan */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#F3BC6F] shadow-sm flex flex-col justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-[#F3BC6F] text-[#1A3460]">
                ⏭️ Bulan Depan • {SCHOOL_MONTHS[nextMonthIdx]}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveMonth(nextMonthIdx);
                  setActiveTab("monthly");
                  setExpanded(true);
                }}
                className="text-[11px] font-black text-[#F35E50] hover:underline cursor-pointer"
              >
                Lihat Bulan →
              </button>
            </div>
            <div className="text-base font-black text-[#1A3460]">
              📚 Tema: {nextMonthTheme.label}
            </div>
            {nextMonthItems.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {nextMonthItems.slice(0, 4).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onBrainstormTheme(it)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border cursor-pointer hover:opacity-80 ${PILLARS[it.pillar].chip}`}
                  >
                    {PILLARS[it.pillar].emoji} {it.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-600 font-medium">
                Cicil tabungan bahan mentah & desain untuk tema{" "}
                <strong>{nextMonthTheme.label}</strong>.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1A3460]/10">
            <button
              type="button"
              onClick={() => onBrainstormTheme(nextMonthTheme)}
              className="flex-1 px-2.5 py-1.5 rounded-xl bg-[#FFF8F3] hover:bg-[#F3BC6F]/30 border border-[#1A3460]/20 text-[#1A3460] text-[11px] font-black inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#F35E50]" />
              Cicil Ide {SCHOOL_MONTHS[nextMonthIdx]}
            </button>
            <button
              type="button"
              onClick={() => onCreateForTheme(nextMonthTheme.id)}
              className="px-2.5 py-1.5 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Tabung Konten
            </button>
          </div>
        </div>

        {/* Card 3: Countdown Agenda Terjadwal Terdekat */}
        <div className="bg-white rounded-2xl p-4 border-2 border-[#1A3460]/15 shadow-sm flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-[#1A3460]/10 text-[#1A3460]">
              ⏰ Agenda Terjadwal Terdekat
            </span>
            <Clock className="w-3.5 h-3.5 text-[#F35E50]" />
          </div>

          <div className="space-y-1.5">
            {upcomingList.map((entry, idx) => {
              const dLeft = daysUntil(entry.item, now);
              const count = countByTheme[entry.item.id] || 0;
              return (
                <div
                  key={`${entry.item.id}-${idx}`}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/10 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => onBrainstormTheme(entry.item)}
                    className="text-left min-w-0 flex-1 hover:text-[#F35E50] cursor-pointer"
                    title="Klik untuk cari ide konten agenda ini"
                  >
                    <div className="font-black text-[#1A3460] truncate text-[11px]">
                      {PILLARS[entry.item.pillar].emoji} {entry.item.label}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      {SCHOOL_MONTHS[entry.slot.m]} Mgg {toRoman(entry.slot.w)}
                      {formatPlanDate(entry.item)
                        ? ` • ${formatPlanDate(entry.item)}`
                        : ""}{" "}
                      ({dLeft !== null ? `${dLeft} hari lagi` : describeWeeksAhead(entry.weeksAhead)})
                    </div>
                  </button>

                  {count > 0 ? (
                    <button
                      type="button"
                      onClick={() => onSelectThemeFilter(entry.item.id)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0 cursor-pointer"
                    >
                      ✓ {count} siap
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onCreateForTheme(entry.item.id)}
                      className="px-2 py-0.5 rounded-lg bg-[#F35E50]/15 hover:bg-[#F35E50] text-[#F35E50] hover:text-white text-[10px] font-black shrink-0 transition cursor-pointer"
                    >
                      + Buat
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Full Schedule Matrix */}
      {expanded && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Sub-Tab Toggle: Matriks Bulanan vs Pilar Rutin & Format */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-2xl bg-[#FFF8F3] border border-[#1A3460]/15 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("monthly")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "monthly"
                    ? "bg-[#1A3460] text-[#F3BC6F] shadow-sm"
                    : "text-[#1A3460]/70 hover:text-[#1A3460]"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Kalender Bulanan (Minggu I – IV)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("routine")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer ${
                  activeTab === "routine"
                    ? "bg-[#1A3460] text-[#F3BC6F] shadow-sm"
                    : "text-[#1A3460]/70 hover:text-[#1A3460]"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Pilar Konten Rutin & Kode Format (R/C/V/S/RD)
              </button>
            </div>

            {selectedThemeId && (
              <button
                type="button"
                onClick={() => onSelectThemeFilter("")}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black cursor-pointer"
              >
                ✕ Hapus Filter Tema Aktif
              </button>
            )}
          </div>

          {activeTab === "monthly" ? (
            <div className="space-y-4">
              {/* 12 Month Pills (Juli -> Juni) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                {SCHOOL_MONTHS.map((mName, idx) => {
                  const isCurrentMonth = idx === pos.m;
                  const isNextMonth = idx === nextMonthIdx;
                  const isSelected = idx === activeMonth;
                  const mCount = countByMonth[idx];

                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => setActiveMonth(idx)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer relative ${
                        isSelected
                          ? "bg-[#1A3460] text-white border-[#1A3460] shadow-md"
                          : isCurrentMonth
                          ? "bg-[#F35E50]/10 text-[#1A3460] border-[#F35E50] font-black"
                          : "bg-[#FFF8F3] hover:bg-[#F3BC6F]/25 text-[#1A3460] border-[#1A3460]/15"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black truncate">
                          {mName}
                        </span>
                        {mCount > 0 && (
                          <span
                            className={`text-[9px] font-black px-1.5 rounded-full ${
                              isSelected
                                ? "bg-[#F3BC6F] text-[#1A3460]"
                                : "bg-[#1A3460]/10 text-[#1A3460]"
                            }`}
                          >
                            {mCount}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[10px] truncate font-semibold mt-0.5 ${
                          isSelected ? "text-[#F3BC6F]" : "text-slate-500"
                        }`}
                      >
                        {getMonthTheme(idx).label}
                      </div>
                      {isCurrentMonth && (
                        <span className="mt-1 inline-block text-[9px] font-black px-1.5 py-0.2 rounded bg-[#F35E50] text-white">
                          Bulan Ini
                        </span>
                      )}
                      {!isCurrentMonth && isNextMonth && (
                        <span className="mt-1 inline-block text-[9px] font-black px-1.5 py-0.2 rounded bg-[#F3BC6F] text-[#1A3460]">
                          Bulan Depan
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Banner Tema Pembelajaran Bulan Terpilih */}
              <div className="p-4 rounded-2xl bg-[#FFF8F3] border-2 border-[#F3BC6F] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#F35E50]">
                      Bulan {SCHOOL_MONTHS[activeMonth]}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-900 border border-indigo-300">
                      {countByTheme[viewedTheme.id] || 0} Konten di Bank
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-[#1A3460]">
                    📚 Tema Pembelajaran Sebulan Penuh: “{viewedTheme.label}”
                  </h3>
                  <p className="text-xs text-[#1A3460]/75 font-medium">
                    Selaraskan dokumentasi kelas, edukasi parenting, & reels bulan{" "}
                    {SCHOOL_MONTHS[activeMonth]} dengan tema kurikulum ini.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onSelectThemeFilter(
                        selectedThemeId === viewedTheme.id ? "" : viewedTheme.id
                      )
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 border transition cursor-pointer ${
                      selectedThemeId === viewedTheme.id
                        ? "bg-[#1A3460] text-[#F3BC6F] border-[#1A3460]"
                        : "bg-white hover:bg-[#F3BC6F]/25 text-[#1A3460] border-[#1A3460]/20"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    {selectedThemeId === viewedTheme.id
                      ? "Sedang Difilter"
                      : "Filter Bank Konten"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onBrainstormTheme(viewedTheme)}
                    className="px-3 py-2 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F35E50]" />
                    Cari Ide Tema Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateForTheme(viewedTheme.id)}
                    className="px-3 py-2 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Upload ke Tema Ini
                  </button>
                </div>
              </div>

              {/* 4-Week Columns (Minggu I - IV) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {([1, 2, 3, 4] as WeekNo[]).map((w) => {
                  const isActiveWeek = activeMonth === pos.m && w === pos.w;
                  const items = viewedSchedule[w];

                  return (
                    <div
                      key={w}
                      className={`rounded-2xl p-3.5 border-2 flex flex-col justify-between gap-3 ${
                        isActiveWeek
                          ? "bg-[#FFF8F3] border-[#F35E50] shadow-sm"
                          : "bg-white border-[#1A3460]/15"
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-[#1A3460]/10 pb-2">
                          <span className="text-xs font-black text-[#1A3460]">
                            Minggu {toRoman(w)}
                          </span>
                          {isActiveWeek && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#F35E50] text-white">
                              Minggu Berjalan
                            </span>
                          )}
                        </div>

                        {items.length === 0 ? (
                          <div className="py-4 text-center space-y-1.5">
                            <p className="text-[11px] text-slate-500 font-semibold">
                              Fokus konten rutin & Tema{" "}
                              <strong>{viewedTheme.label}</strong>
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {items.map((it) => {
                              const count = countByTheme[it.id] || 0;
                              const isFiltered = selectedThemeId === it.id;
                              return (
                                <div
                                  key={it.id}
                                  className={`p-2.5 rounded-xl border space-y-2 transition ${
                                    isFiltered
                                      ? "bg-[#1A3460]/5 border-[#1A3460]"
                                      : "bg-[#FFF8F3] border-[#1A3460]/15"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1.5">
                                    <span
                                      className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${PILLARS[it.pillar].chip}`}
                                    >
                                      {PILLARS[it.pillar].emoji}{" "}
                                      {PILLARS[it.pillar].label}
                                    </span>
                                    {count > 0 && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {count}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <div className="text-xs font-black text-[#1A3460] leading-snug">
                                      {it.label}
                                    </div>
                                    {formatPlanDate(it) && (
                                      <div className="text-[11px] font-bold text-[#F35E50]">
                                        📅 {formatPlanDate(it)}
                                      </div>
                                    )}
                                    {it.note && (
                                      <div className="mt-1 text-[10px] text-slate-500 font-medium flex items-start gap-1">
                                        <Info className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                                        <span>{it.note}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => onBrainstormTheme(it)}
                                      className="flex-1 py-1 px-2 rounded-lg bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-[10px] font-black cursor-pointer"
                                    >
                                      💡 Cari Ide
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onCreateForTheme(it.id)}
                                      className="py-1 px-2 rounded-lg bg-[#F35E50] hover:bg-[#e04b3d] text-white text-[10px] font-black cursor-pointer"
                                    >
                                      + Upload
                                    </button>
                                    {count > 0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onSelectThemeFilter(
                                            isFiltered ? "" : it.id
                                          )
                                        }
                                        className="py-1 px-2 rounded-lg bg-white border border-[#1A3460]/20 text-[#1A3460] text-[10px] font-black cursor-pointer"
                                        title="Filter Bank Konten"
                                      >
                                        Lihat
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tab 2: Pilar Konten Rutin & Tabel Kode Format Konten */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {routinePillars.map((pillarId) => {
                  const meta = PILLARS[pillarId];
                  const items = PLAN_ITEMS.filter((p) => p.pillar === pillarId);
                  return (
                    <div
                      key={pillarId}
                      className="rounded-2xl border-2 border-[#1A3460]/15 bg-[#FFF8F3] p-4 space-y-2.5"
                    >
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-lg border ${meta.chip}`}
                        >
                          {meta.emoji} {meta.label}
                        </span>
                        <p className="text-[11px] text-slate-600 font-medium mt-1">
                          {meta.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {items.map((it) => {
                          const cnt = countByTheme[it.id] || 0;
                          const active = selectedThemeId === it.id;
                          return (
                            <div
                              key={it.id}
                              className={`inline-flex items-center rounded-xl border text-[11px] overflow-hidden ${
                                active
                                  ? "border-[#1A3460] bg-[#1A3460] text-white"
                                  : "border-[#1A3460]/20 bg-white text-[#1A3460]"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => onBrainstormTheme(it)}
                                title={`Klik untuk cari ide "${getPlanLabel(it)}"`}
                                className="px-2.5 py-1 font-bold hover:text-[#F35E50] cursor-pointer"
                              >
                                {it.label}
                                {cnt > 0 ? ` (${cnt})` : ""}
                              </button>
                              <button
                                type="button"
                                onClick={() => onCreateForTheme(it.id)}
                                title={`Upload konten "${it.label}"`}
                                className="px-1.5 py-1 bg-[#F35E50]/10 hover:bg-[#F35E50] text-[#F35E50] hover:text-white font-black border-l border-[#1A3460]/10 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Kode Format Konten (Bagian IX di Excel) */}
              <div className="rounded-2xl bg-white border border-[#1A3460]/15 p-4 space-y-2">
                <div className="text-xs font-black text-[#1A3460]">
                  🎬 Referensi Kode Format Konten (Bagian IX — JADWAL MARKET KONTEN.xlsx):
                </div>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((f) => (
                    <div
                      key={f.id}
                      className="px-3 py-1.5 rounded-xl bg-[#FFF8F3] border border-[#1A3460]/15 text-xs flex items-center gap-2"
                    >
                      {f.code && (
                        <span className="px-1.5 py-0.5 rounded bg-[#1A3460] text-[#F3BC6F] font-black text-[10px]">
                          {f.code}
                        </span>
                      )}
                      <span className="font-black text-[#1A3460]">{f.label}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        — {f.hint}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
