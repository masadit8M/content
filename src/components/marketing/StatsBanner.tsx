"use client";

import React from "react";
import { UploadCloud, Film, Rocket, Flame } from "lucide-react";
import { getStage, needsRevision } from "@/lib/content-utils";
import { ViewType } from "@/components/layout/MarketingNavbar";

interface StatsProps {
  contents: any[];
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
}

export function StatsBanner({
  contents,
  currentView,
  onSelectView,
}: StatsProps) {
  const rawCount = contents.filter((c) => {
    const st = getStage(c);
    return st === "RAW" || st === "IDEA";
  }).length;

  const reviewItems = contents.filter((c) => getStage(c) === "REVIEW");
  const revisionCount = reviewItems.filter((c) => needsRevision(c)).length;

  const readyCount = contents.filter((c) => getStage(c) === "READY").length;
  const liveCount = contents.filter((c) => getStage(c) === "LIVE").length;

  const cards: {
    id: ViewType;
    step: string;
    title: string;
    count: number;
    sub: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      id: "raw",
      step: "Tahap 1",
      title: "Bahan Mentah & Brief",
      count: rawCount,
      sub: "Footage kelas & ide siap diolah",
      icon: <UploadCloud className="w-4 h-4 text-[#F35E50]" />,
      activeClass: "border-[#F35E50] ring-2 ring-[#F35E50]/20",
    },
    {
      id: "review",
      step: "Tahap 2",
      title: "Hasil Edit & Usulan",
      count: reviewItems.length,
      sub:
        revisionCount > 0
          ? `${revisionCount} perlu perbaikan • sisanya siap cek`
          : "Hasil CapCut/Canva & usulan mandiri",
      icon: <Film className="w-4 h-4 text-amber-600" />,
      activeClass: "border-amber-500 ring-2 ring-amber-500/20",
    },
    {
      id: "ready",
      step: "Tahap 3",
      title: "Bank Siap Upload",
      count: readyCount,
      sub: "Aset & caption final siap tayang",
      icon: <Rocket className="w-4 h-4 text-blue-600" />,
      activeClass: "border-blue-600 ring-2 ring-blue-600/20",
    },
    {
      id: "showcase",
      step: "Tahap 4",
      title: "Arsip Sudah Tayang",
      count: liveCount,
      sub: "Tautan postingan medsos resmi",
      icon: <Flame className="w-4 h-4 text-emerald-600" />,
      activeClass: "border-emerald-600 ring-2 ring-emerald-600/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card) => {
        const isActive = currentView === card.id;
        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectView(card.id)}
            className={`text-left bg-white rounded-2xl p-4 border-2 shadow-sm transition cursor-pointer ${
              isActive
                ? card.activeClass
                : "border-[#1A3460]/15 hover:border-[#1A3460]/40"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#1A3460]/60">
                {card.step}
              </span>
              {card.icon}
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-black text-[#1A3460]">
                {card.count}
              </span>
              <span className="text-xs font-black text-[#1A3460] truncate">
                {card.title}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5 truncate">
              {card.sub}
            </div>
          </button>
        );
      })}
    </div>
  );
}
