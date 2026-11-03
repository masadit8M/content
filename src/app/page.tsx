"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  MarketingNavbar,
  ViewType,
} from "@/components/layout/MarketingNavbar";
import { BrandIdentityBar } from "@/components/marketing/BrandIdentityBar";
import { MarketingSchedulePanel } from "@/components/marketing/MarketingSchedulePanel";
import { BrainstormKickstarter } from "@/components/marketing/BrainstormKickstarter";
import { RawMaterialView } from "@/components/marketing/RawMaterialView";
import { UploadKontenView } from "@/components/marketing/UploadKontenView";
import { ContentDetailModal } from "@/components/marketing/ContentDetailModal";
import { CreateContentModal } from "@/components/marketing/CreateContentModal";
import KontenGuideArjuna from "@/components/studio/KontenGuideArjuna";
import { TEAM_MEMBERS } from "@/lib/team-data";
import {
  PlanItem,
  getMonthTheme,
  getSchoolPosition,
  getPlanItem,
  getPlanLabel,
  getThemeText,
  buildStudioTopic,
} from "@/lib/marketing-plan";
import { getPublishedLinks } from "@/lib/content-utils";
import { Sparkles, Filter, Plus, X, Search } from "lucide-react";

export default function MarketingDashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();

  const [contents, setContents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>(TEAM_MEMBERS);
  const [dataLoading, setDataLoading] = useState(true);

  // 4 Tab Utama: "raw" | "published" | "schedule" | "studio"
  const [currentView, setCurrentView] = useState<ViewType>("raw");
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Konteks untuk Studio Ide (ketika klik "💡 Cari Ide" dari Jadwal)
  const [brainstormThemeId, setBrainstormThemeId] = useState<string>(
    () => getMonthTheme(getSchoolPosition(new Date()).m).id
  );
  const [studioInitialTopic, setStudioInitialTopic] = useState("");

  // Modal state
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultMode, setCreateDefaultMode] = useState<
    "RAW" | "FINISHED"
  >("RAW");
  const [createDefaultThemeId, setCreateDefaultThemeId] = useState<string>("");

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

  // Setiap ganti tab dari Navbar, langsung tampilkan di atas layar tanpa terhalang panel lain
  const handleViewChange = (nextView: ViewType) => {
    setCurrentView(nextView);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBrainstormFromSchedule = (item: PlanItem) => {
    setBrainstormThemeId(item.id);
    setStudioInitialTopic(buildStudioTopic(item, new Date()));
    handleViewChange("studio");
  };

  const handleCreateForTheme = (
    themeId: string,
    mode: "RAW" | "FINISHED" = "RAW"
  ) => {
    setCreateDefaultThemeId(themeId);
    setCreateDefaultMode(mode);
    setShowCreateModal(true);
  };

  // Filter konten berdasarkan tema jadwal dan kata kunci pencarian
  const filteredContents = contents.filter((item) => {
    const matchesTheme = !selectedThemeId || item.themeId === selectedThemeId;

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesTheme;

    const themeLabel = getThemeText(
      item.themeId,
      item.themeLabel
    ).toLowerCase();
    const linksStr = getPublishedLinks(item)
      .map((l) => `${l.platform} ${l.url}`)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.prepNotes?.toLowerCase().includes(query) ||
      item.caption?.toLowerCase().includes(query) ||
      linksStr.includes(query) ||
      themeLabel.includes(query);

    return matchesTheme && matchesSearch;
  });

  if (authLoading || (!currentUser && !dataLoading)) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center text-[#1A3460]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F35E50] border-2 border-[#F3BC6F] flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-black text-[#1A3460]">
            Memuat Bank Konten PAUD Arjuna...
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
      {/* Top Navbar dengan 4 Tab Responsif */}
      <MarketingNavbar
        contents={contents}
        currentView={currentView}
        onViewChange={handleViewChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreateModal={() => {
          setCreateDefaultThemeId(selectedThemeId || brainstormThemeId || "");
          setCreateDefaultMode(
            currentView === "published" ? "FINISHED" : "RAW"
          );
          setShowCreateModal(true);
        }}
      />

      {/* TAB 4: STUDIO IDE (Murni Pengaya Brainstorming Ide — Tanpa Kirim Task) */}
      {currentView === "studio" ? (
        <div className="flex-1 w-full flex flex-col">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
            <BrainstormKickstarter focusThemeId={brainstormThemeId} />
          </div>

          <div className="flex-1 w-full">
            <KontenGuideArjuna initialTopic={studioInitialTopic} />
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
          {/* Pencarian Mobile */}
          {currentView !== "schedule" && (
            <div className="md:hidden">
              <div className="relative">
                <Search className="w-4 h-4 text-[#1A3460]/50 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari judul, tema, caption, atau link..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl bg-white border-2 border-[#1A3460]/15 text-[#1A3460] font-semibold focus:outline-none focus:border-[#F35E50]"
                />
              </div>
            </div>
          )}

          {/* Indikator Filter Tema Aktif (jika dipilih dari Tab Jadwal) */}
          {selectedThemeId && currentView !== "schedule" && (
            <div className="p-3.5 rounded-2xl bg-[#1A3460] text-white border-2 border-[#F3BC6F] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-black">
                <Filter className="w-4 h-4 text-[#F3BC6F]" />
                <span>
                  Filter Tema Aktif:{" "}
                  <strong className="text-[#F3BC6F]">
                    {activeFilterItem
                      ? getPlanLabel(activeFilterItem)
                      : selectedThemeId}
                  </strong>{" "}
                  ({filteredContents.length} item)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCreateForTheme(
                      selectedThemeId,
                      currentView === "published" ? "FINISHED" : "RAW"
                    )
                  }
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

          {/* TAB 1: BAHAN MENTAH */}
          {currentView === "raw" && (
            <RawMaterialView
              contents={filteredContents}
              users={users}
              onSelectContent={setSelectedContent}
              onOpenCreateModal={() =>
                handleCreateForTheme(
                  selectedThemeId || brainstormThemeId,
                  "RAW"
                )
              }
              onRefresh={fetchContents}
              onNavigateToPublished={() => handleViewChange("published")}
            />
          )}

          {/* TAB 2: UPLOAD KONTEN & LINK TAYANG */}
          {currentView === "published" && (
            <UploadKontenView
              allContents={contents}
              filteredContents={filteredContents}
              onSelectContent={setSelectedContent}
              onOpenCreateFinishedModal={() =>
                handleCreateForTheme(
                  selectedThemeId || brainstormThemeId,
                  "FINISHED"
                )
              }
              onNavigateToRaw={() => handleViewChange("raw")}
              onRefresh={fetchContents}
            />
          )}

          {/* TAB 3: JADWAL MARKETING & BRAND IDENTITY */}
          {currentView === "schedule" && (
            <div className="space-y-6">
              <BrandIdentityBar />
              <MarketingSchedulePanel
                contents={contents}
                selectedThemeId={selectedThemeId}
                onSelectThemeFilter={(id) => {
                  setSelectedThemeId(id);
                  if (id) {
                    handleViewChange("published");
                  }
                }}
                onBrainstormTheme={handleBrainstormFromSchedule}
                onCreateForTheme={(id) => handleCreateForTheme(id, "RAW")}
              />
            </div>
          )}
        </main>
      )}

      {/* Modal Detail Item */}
      {selectedContent && (
        <ContentDetailModal
          key={`${selectedContent.id}-${selectedContent.updatedAt}`}
          content={selectedContent}
          users={users}
          onClose={() => setSelectedContent(null)}
          onRefresh={fetchContents}
        />
      )}

      {/* Modal Upload Baru */}
      {showCreateModal && (
        <CreateContentModal
          defaultMode={createDefaultMode}
          defaultThemeId={createDefaultThemeId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(targetTab) => {
            fetchContents();
            handleViewChange(targetTab);
          }}
        />
      )}
    </div>
  );
}
