"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MarketingNavbar, ViewType } from "@/components/layout/MarketingNavbar";
import { StatsBanner } from "@/components/marketing/StatsBanner";
import { RawMaterialView } from "@/components/marketing/RawMaterialView";
import { EditingProcessView } from "@/components/marketing/EditingProcessView";
import { ReadyToPublishView } from "@/components/marketing/ReadyToPublishView";
import { KanbanBoard } from "@/components/marketing/KanbanBoard";
import { LiveShowcaseGallery } from "@/components/marketing/LiveShowcaseGallery";
import { ListView } from "@/components/marketing/ListView";
import { ContentDetailModal } from "@/components/marketing/ContentDetailModal";
import { CreateContentModal } from "@/components/marketing/CreateContentModal";
import KontenGuideArjuna from "@/components/studio/KontenGuideArjuna";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export default function MarketingDashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [contents, setContents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // View state: 'raw' (Tab 1), 'editing' (Tab 2), 'ready' (Tab 3), 'showcase' (Tab 4), 'board' (Kanban), 'list', 'studio'
  const [currentView, setCurrentView] = useState<ViewType>("raw");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedContent, setSelectedContent] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState("RAW_MATERIAL");

  // Notification when task is generated from studio
  const [studioToast, setStudioToast] = useState<{ title: string } | null>(null);
  const [studioInitialTopic, setStudioInitialTopic] = useState("");

  const handleOpenStudio = (topic?: string) => {
    if (topic && typeof topic === "string") {
      setStudioInitialTopic(topic);
    }
    setCurrentView("studio");
  };

  // Fetch all contents and team members
  const fetchContents = async () => {
    try {
      const res = await fetch("/api/contents");
      if (res.ok) {
        const data = await res.json();
        setContents(data.contents || []);

        // If a modal is open, refresh its data
        if (selectedContent) {
          const updated = data.contents.find((c: any) => c.id === selectedContent.id);
          if (updated) setSelectedContent(updated);
        }
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
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Gagal memuat users:", err);
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

  // Quick Move Status on Kanban
  const handleQuickMoveStatus = async (contentId: string, nextStatus: string) => {
    try {
      const res = await fetch(`/api/contents/${contentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchContents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bridge from Studio Canvas to Task Tim (ClickUp)
  const handleStudioSendToTasks = async (data: {
    title: string;
    description?: string;
    platform?: string;
    contentType?: string;
    prepNotes?: string;
  }) => {
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || "Dihasilkan dari Studio Ide Konten Arjuna",
          platform: data.platform || "INSTAGRAM",
          contentType: data.contentType || "FEED_CAROUSEL",
          status: "IN_EDITING", // Otomatis masuk ke workspace editing
          prepNotes: data.prepNotes || "",
        }),
      });

      if (res.ok) {
        await fetchContents();
        setStudioToast({ title: data.title });
        setTimeout(() => setStudioToast(null), 6000);
      }
    } catch (err) {
      console.error("Gagal mengirim ide ke task tim:", err);
    }
  };

  // Filtered contents based on search and platform
  const filteredContents = contents.filter((item) => {
    const matchesPlatform = selectedPlatform === "ALL" || item.platform === selectedPlatform;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.prepNotes?.toLowerCase().includes(query) ||
      item.liveUrl?.toLowerCase().includes(query);

    return matchesPlatform && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center text-[#1A3460]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F35E50] border-2 border-[#F3BC6F] flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-black text-[#1A3460]">
            Memeriksa sesi login...
          </span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center text-[#1A3460]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F35E50] border-2 border-[#F3BC6F] flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-black text-[#1A3460]">
            Mengalihkan ke halaman login...
          </span>
          <a
            href="/login"
            className="text-xs font-bold text-[#F35E50] underline mt-2"
          >
            Klik di sini jika tidak beralih otomatis
          </a>
        </div>
      </div>
    );
  }

  if (dataLoading && !contents.length) {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center text-[#1A3460]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F35E50] border-2 border-[#F3BC6F] flex items-center justify-center shadow-lg animate-bounce">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm font-black text-[#1A3460]">
            Menyiapkan ContentOps Marketing Arjuna...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] text-[#1A3460] flex flex-col selection:bg-[#F35E50]/20 selection:text-[#1A3460]">
      {/* Top Navbar */}
      <MarketingNavbar
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreateModal={() => {
          setCreateDefaultStatus(currentView === "raw" ? "RAW_MATERIAL" : "IN_EDITING");
          setShowCreateModal(true);
        }}
      />

      {/* Toast Notification when sent from Studio to Task Tim */}
      {studioToast && (
        <div className="fixed top-20 right-6 z-50 bg-[#1A3460] text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#F3BC6F] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <div className="text-xs font-black text-[#F3BC6F] uppercase tracking-wide">
              ✓ Ide Berhasil Masuk ke Workspace Tim!
            </div>
            <div className="text-xs font-bold text-white max-w-sm truncate">
              {studioToast.title}
            </div>
          </div>
          <button
            onClick={() => {
              setCurrentView("editing");
              setStudioToast(null);
            }}
            className="ml-2 px-3 py-1.5 rounded-xl bg-[#F35E50] hover:bg-[#e04b3d] text-white text-xs font-black flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <span>Buka Editing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Body */}
      {currentView === "studio" ? (
        // Canvas Brainstorm Studio (Full Width Immersive Studio)
        <div className="flex-1 w-full">
          <KontenGuideArjuna
            onSendToTasks={handleStudioSendToTasks}
            initialTopic={studioInitialTopic}
          />
        </div>
      ) : (
        // Standard ContentOps Views (Raw, Editing, Ready, Showcase, Board, List)
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* KPI Summary Banner */}
          <StatsBanner contents={contents} />

          {/* TAB 1: BANK BAHAN MENTAH */}
          {currentView === "raw" && (
            <RawMaterialView
              contents={filteredContents}
              users={users}
              onSelectContent={setSelectedContent}
              onOpenCreateModal={(status) => {
                setCreateDefaultStatus(status || "RAW_MATERIAL");
                setShowCreateModal(true);
              }}
              onRefresh={fetchContents}
              onNavigateToEditing={() => setCurrentView("editing")}
            />
          )}

          {/* TAB 2: PROSES EDITING & REVISI */}
          {currentView === "editing" && (
            <EditingProcessView
              contents={filteredContents}
              users={users}
              onSelectContent={setSelectedContent}
              onRefresh={fetchContents}
              onNavigateToReady={() => setCurrentView("ready")}
            />
          )}

          {/* TAB 3: SIAP UPLOAD */}
          {currentView === "ready" && (
            <ReadyToPublishView
              contents={filteredContents}
              users={users}
              onSelectContent={setSelectedContent}
              onRefresh={fetchContents}
              onNavigateToShowcase={() => setCurrentView("showcase")}
            />
          )}

          {/* TAB 4: SUDAH LIVE (SHOWCASE) */}
          {currentView === "showcase" && (
            <LiveShowcaseGallery
              contents={filteredContents}
              onSelectContent={setSelectedContent}
              onOpenCreateModal={() => {
                setCreateDefaultStatus("PUBLISHED");
                setShowCreateModal(true);
              }}
            />
          )}

          {/* TAB 5: KANBAN BOARD */}
          {currentView === "board" && (
            <KanbanBoard
              contents={filteredContents}
              onSelectContent={setSelectedContent}
              onQuickMoveStatus={handleQuickMoveStatus}
              onOpenCreateModal={(status) => {
                setCreateDefaultStatus(status || "RAW_MATERIAL");
                setShowCreateModal(true);
              }}
              onOpenStudio={handleOpenStudio}
            />
          )}

          {/* TAB 6: LIST VIEW */}
          {currentView === "list" && (
            <ListView
              contents={filteredContents}
              onSelectContent={setSelectedContent}
              onQuickMoveStatus={handleQuickMoveStatus}
            />
          )}
        </main>
      )}

      {/* Detail & Collaboration Modal (ClickUp Drawer) */}
      {selectedContent && (
        <ContentDetailModal
          content={selectedContent}
          users={users}
          onClose={() => setSelectedContent(null)}
          onRefresh={fetchContents}
        />
      )}

      {/* Create New Content / Upload Raw Modal */}
      {showCreateModal && (
        <CreateContentModal
          users={users}
          defaultStatus={createDefaultStatus}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchContents}
          onOpenStudio={handleOpenStudio}
        />
      )}
    </div>
  );
}
