"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  MarketingNavbar,
  ViewType,
} from "@/components/layout/MarketingNavbar";
import { BrandIdentityBar } from "@/components/marketing/BrandIdentityBar";
import { MarketingSchedulePanel } from "@/components/marketing/MarketingSchedulePanel";
import { BrainstormKickstarter } from "@/components/marketing/BrainstormKickstarter";
import { StatsBanner } from "@/components/marketing/StatsBanner";
import { RawMaterialView } from "@/components/marketing/RawMaterialView";
import { ProductionReviewView } from "@/components/marketing/ProductionReviewView";
import { ReadyToPublishView } from "@/components/marketing/ReadyToPublishView";
import { LiveShowcaseGallery } from "@/components/marketing/LiveShowcaseGallery";
import { ContentDetailModal } from "@/components/marketing/ContentDetailModal";
import { CreateContentModal } from "@/components/marketing/CreateContentModal";
import KontenGuideArjuna from "@/components/studio/KontenGuideArjuna";
import { useToast } from "@/components/common/Toast";
import { TEAM_MEMBERS } from "@/lib/team-data";
import {
  PlanItem,
  getMonthTheme,
  getSchoolPosition,
  getPlanItem,
  getPlanLabel,
  getThemeText,
} from "@/lib/marketing-plan";
import {
  splitScriptAndCaption,
  mapStudioPlatform,
} from "@/lib/content-utils";
import { createContent } from "@/lib/content-actions";
import {
  Sparkles,
  ArrowLeft,
  Filter,
  Plus,
  X,
  Search,
} from "lucide-react";

export default function MarketingDashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const toast = useToast();

  const [contents, setContents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>(TEAM_MEMBERS);
  const [dataLoading, setDataLoading] = useState(true);

  // Tahap aktif di Bank Konten atau Studio Lengkap
  const [currentView, setCurrentView] = useState<ViewType>("raw");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Tema fokus untuk modul Brainstorm Cepat di bagian awal
  const [brainstormThemeId, setBrainstormThemeId] = useState<string>(
    () => getMonthTheme(getSchoolPosition(new Date()).m).id
  );
  const [studioInitialTopic, setStudioInitialTopic] = useState("");

  // Modal state
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultMode, setCreateDefaultMode] = useState<
    "RAW" | "PROPOSAL"
  >("RAW");
  const [createDefaultThemeId, setCreateDefaultThemeId] = useState<string>("");

  const brainstormRef = useRef<HTMLDivElement>(null);
  const vaultRef = useRef<HTMLDivElement>(null);

  const fetchContents = async () => {
    try {
      const res = await fetch("/api/contents");
      if (res.ok) {
        const data = await res.json();
        const list = data.contents || [];
        setContents(list);

        setSelectedContent((prev: any) => {
          if (!prev) return null;
          return list.find((c: any) => c.id === prev.id) || null;
        });
      }
    } catch (err) {
      console.error("Gagal memuat konten:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users) && data.users.length > 0) {
          setUsers(data.users);
        }
      }
    } catch (err) {
      console.error("Gagal memuat anggota tim:", err);
    }
  };

  useEffect(() => {
    if (!authLoading && !currentUser) {
      window.location.href = "/login";
      return;
    }
    if (currentUser) {
      fetchContents();
      fetchUsers();
    }
  }, [currentUser, authLoading]);

  const handleOpenStudio = (topic?: string) => {
    if (topic && typeof topic === "string") {
      setStudioInitialTopic(topic);
    }
    setCurrentView("studio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBrainstormFromSchedule = (item: PlanItem) => {
    setBrainstormThemeId(item.id);
    brainstormRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleCreateForTheme = (themeId: string) => {
    setCreateDefaultThemeId(themeId);
    setCreateDefaultMode(currentView === "review" ? "PROPOSAL" : "RAW");
    setShowCreateModal(true);
  };

  // Jembatan dari Studio Lengkap (KontenGuideArjuna) ke Bank Konten
  const handleStudioSendToBank = async (data: {
    title: string;
    description?: string;
    platform?: string;
    contentType?: string;
    prepNotes?: string;
  }) => {
    const { script, caption } = splitScriptAndCaption(data.prepNotes);
    const mapped = mapStudioPlatform(data.platform);
    const activeTheme =
      getPlanItem(selectedThemeId || brainstormThemeId) ||
      getMonthTheme(getSchoolPosition(new Date()).m);

    const res = await createContent({
      title: data.title || "Brief Studio Ide PAUD Arjuna",
      description:
        data.description || "Disusun melalui Studio Ide Konten PAUD Arjuna",
      platform: mapped?.platform || data.platform || "INSTAGRAM",
      contentType: mapped?.contentType || data.contentType || "FEED_CAROUSEL",
      status: "IDEA",
      origin: "STUDIO",
      themeId: activeTheme.id,
      themeLabel: getPlanLabel(activeTheme),
      prepNotes: script || data.prepNotes || "",
      caption: caption || null,
    });

    if (res.ok) {
      await fetchContents();
      toast(`Brief "${data.title}" berhasil disimpan ke Bank Bahan Mentah!`, {
        action: {
          label: "Buka Bank Konten →",
          onClick: () => setCurrentView("raw"),
        },
      });
    } else {
      toast(res.error || "Gagal menyimpan brief dari Studio.", {
        tone: "error",
      });
    }
  };

  // Filter konten berdasarkan platform, tema jadwal, dan kata kunci pencarian
  const filteredContents = contents.filter((item) => {
    const matchesPlatform =
      selectedPlatform === "ALL" || item.platform === selectedPlatform;
    const matchesTheme =
      !selectedThemeId || item.themeId === selectedThemeId;

    const query = searchQuery.trim().toLowerCase();
    const themeLabel = getThemeText(item.themeId, item.themeLabel).toLowerCase();
    const matchesSearch =
      !query ||
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.prepNotes?.toLowerCase().includes(query) ||
      item.caption?.toLowerCase().includes(query) ||
      item.liveUrl?.toLowerCase().includes(query) ||
      themeLabel.includes(query);

    return matchesPlatform && matchesTheme && matchesSearch;
  });

  if (authLoading || (!currentUser && !dataLoading)) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center text-[#1A3460]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F35E50] border-2 border-[#F3BC6F] flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-black text-[#1A3460]">
            Memuat sesi Bank Konten PAUD Arjuna...
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const activeFilterItem = getPlanItem(selectedThemeId);

  return (
    <div className="min-h-screen bg-[#FFF8F3] text-[#1A3460] flex flex-col">
      {/* Top Navbar */}
      <MarketingNavbar
        contents={contents}
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreateModal={() => {
          setCreateDefaultThemeId(selectedThemeId || brainstormThemeId || "");
          setCreateDefaultMode(currentView === "review" ? "PROPOSAL" : "RAW");
          setShowCreateModal(true);
        }}
      />

      {currentView === "studio" ? (
        /* Mode Studio Lengkap */
        <div className="flex-1 w-full flex flex-col">
          <div className="bg-[#FFF8F3] border-b border-[#1A3460]/15 px-4 sm:px-6 py-2.5">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setCurrentView("raw")}
                className="px-3.5 py-1.5 rounded-xl bg-[#1A3460] hover:bg-[#122544] text-[#F3BC6F] text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Jadwal & Bank Konten
              </button>
              <span className="text-xs font-bold text-[#1A3460]/75">
                Setiap naskah/storyboard yang Anda simpan otomatis masuk ke <strong>Tab 1 (Bank Bahan Mentah & Brief)</strong>.
              </span>
            </div>
          </div>

          <div className="flex-1 w-full">
            <KontenGuideArjuna
              onSendToTasks={handleStudioSendToBank}
              initialTopic={studioInitialTopic}
            />
          </div>
        </div>
      ) : (
        /* Mode Utama: Brand Kit + Jadwal Marketing + Brainstorm Ide + 4 Tahap Bank Konten */
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Pencarian Mobile */}
          <div className="md:hidden">
            <div className="relative">
              <Search className="w-4 h-4 text-[#1A3460]/50 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, tema, atau caption..."
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl bg-white border-2 border-[#1A3460]/15 text-[#1A3460] font-semibold focus:outline-none focus:border-[#F35E50]"
              />
            </div>
          </div>

          {/* 1. Pengingat Brand Identity & Unduh Logo Resmi */}
          <BrandIdentityBar />

          {/* 2. Modul Brainstorm Ide Cepat (Bagian Awal jika Kehabisan Ide) */}
          <div ref={brainstormRef}>
            <BrainstormKickstarter
              focusThemeId={brainstormThemeId}
              onSavedToBank={fetchContents}
              onOpenFullStudio={handleOpenStudio}
              onNavigateToRaw={() => {
                setCurrentView("raw");
                vaultRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>

          {/* 3. Jadwal Marketing Konten (JADWAL MARKET KONTEN.xlsx) */}
          <MarketingSchedulePanel
            contents={contents}
            selectedThemeId={selectedThemeId}
            onSelectThemeFilter={(id) => {
              setSelectedThemeId(id);
              if (id) {
                vaultRef.current?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            onBrainstormTheme={handleBrainstormFromSchedule}
            onCreateForTheme={handleCreateForTheme}
          />

          {/* 4. Area Bank Konten Terpadu */}
          <div ref={vaultRef} className="space-y-5 pt-2">
            {/* Navigasi Ringkas 4 Tahap */}
            <StatsBanner
              contents={filteredContents}
              currentView={currentView}
              onSelectView={setCurrentView}
            />

            {/* Indikator Filter Tema Aktif */}
            {selectedThemeId && (
              <div className="p-3.5 rounded-2xl bg-[#1A3460] text-white border-2 border-[#F3BC6F] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-black">
                  <Filter className="w-4 h-4 text-[#F3BC6F]" />
                  <span>
                    Menampilkan Bank Konten untuk tema:{" "}
                    <strong className="text-[#F3BC6F]">
                      {activeFilterItem
                        ? getPlanLabel(activeFilterItem)
                        : selectedThemeId}
                    </strong>{" "}
                    ({filteredContents.length} konten)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateForTheme(selectedThemeId)}
                    className="px-3 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Upload ke Tema Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedThemeId("")}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black inline-flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Tampilkan Semua
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: BANK BAHAN MENTAH & BRIEF */}
            {currentView === "raw" && (
              <RawMaterialView
                contents={filteredContents}
                users={users}
                onSelectContent={setSelectedContent}
                onOpenCreateModal={(mode = "RAW") => {
                  setCreateDefaultThemeId(selectedThemeId || brainstormThemeId);
                  setCreateDefaultMode(mode);
                  setShowCreateModal(true);
                }}
                onRefresh={fetchContents}
                onNavigateToReview={() => setCurrentView("review")}
                onNavigateToReady={() => setCurrentView("ready")}
              />
            )}

            {/* TAB 2: HASIL EDIT & USULAN PRODUKSI MANDIRI */}
            {currentView === "review" && (
              <ProductionReviewView
                contents={filteredContents}
                users={users}
                onSelectContent={setSelectedContent}
                onOpenCreateModal={(mode = "PROPOSAL") => {
                  setCreateDefaultThemeId(selectedThemeId || brainstormThemeId);
                  setCreateDefaultMode(mode);
                  setShowCreateModal(true);
                }}
                onRefresh={fetchContents}
                onNavigateToReady={() => setCurrentView("ready")}
              />
            )}

            {/* TAB 3: BANK KONTEN SIAP UPLOAD */}
            {currentView === "ready" && (
              <ReadyToPublishView
                contents={filteredContents}
                users={users}
                onSelectContent={setSelectedContent}
                onRefresh={fetchContents}
                onNavigateToShowcase={() => setCurrentView("showcase")}
                onNavigateToReview={() => setCurrentView("review")}
              />
            )}

            {/* TAB 4: ARSIP TAYANG (LIVE) */}
            {currentView === "showcase" && (
              <LiveShowcaseGallery
                contents={filteredContents}
                onSelectContent={setSelectedContent}
              />
            )}
          </div>
        </main>
      )}

      {/* Modal Detail Konten */}
      {selectedContent && (
        <ContentDetailModal
          key={`${selectedContent.id}-${selectedContent.updatedAt}`}
          content={selectedContent}
          users={users}
          onClose={() => setSelectedContent(null)}
          onRefresh={fetchContents}
        />
      )}

      {/* Modal Upload Konten Baru */}
      {showCreateModal && (
        <CreateContentModal
          users={users}
          defaultMode={createDefaultMode}
          defaultThemeId={createDefaultThemeId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(targetTab) => {
            fetchContents();
            setCurrentView(targetTab);
          }}
        />
      )}
    </div>
  );
}
