import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Mengosongkan data lama...");
  await prisma.contentComment.deleteMany();
  await prisma.contentTask.deleteMany();
  await prisma.marketingContent.deleteMany();
  await prisma.user.deleteMany();

  console.log("👥 Membuat akun tim marketing...");
  const defaultPasswordHash = await bcrypt.hash("Admin#2026", 10);

  const adit = await prisma.user.create({
    data: {
      name: "Adit",
      email: "adit@marketing.id",
      passwordHash: defaultPasswordHash,
      title: "Marketing Lead & Strategist",
      role: "LEAD",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: "Sarah",
      email: "sarah@marketing.id",
      passwordHash: defaultPasswordHash,
      title: "Senior Content Creator & Copywriter",
      role: "CREATOR",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const bima = await prisma.user.create({
    data: {
      name: "Bima",
      email: "bima@marketing.id",
      passwordHash: defaultPasswordHash,
      title: "Graphic & Motion Designer",
      role: "DESIGNER",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const rani = await prisma.user.create({
    data: {
      name: "Rani",
      email: "rani@marketing.id",
      passwordHash: defaultPasswordHash,
      title: "Social Media Admin & Ads Specialist",
      role: "ADMIN",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("🚀 Membuat data konten marketing & persiapan tim...");

  // 1. Konten LIVE: Carousel Instagram
  const c1 = await prisma.marketingContent.create({
    data: {
      title: "Carousel: 5 Rahasia Trik Visual Marketing yang Bikin Omset Naik 300%",
      description: "Edukasi visual marketing untuk target UMKM & pebisnis pemula.",
      platform: "INSTAGRAM",
      contentType: "FEED_CAROUSEL",
      status: "PUBLISHED",
      prepNotes: "✅ 7 Slide desain Canva sudah diexport PNG kualitas tinggi.\n✅ Hook headline diuji 3 variasi.\n✅ Caption copywriting format AIDA lengkap dengan Call-to-Action link di bio.",
      assetUrl: "https://drive.google.com/drive/folders/sample-carousel-assets",
      assetName: "Folder Assets Carousel IG",
      liveUrl: "https://www.instagram.com/p/DC123456789/",
      liveNote: "Diposting jam 19:00 WIB. Insight 2 jam pertama: Reach 1.450, Save 89, Share 34.",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      targetDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdById: sarah.id,
      assignedToId: bima.id,
    },
  });

  await prisma.contentTask.createMany({
    data: [
      { contentId: c1.id, title: "Siapkan 7 slide layout visual", isCompleted: true, createdById: sarah.id, assignedToId: bima.id },
      { contentId: c1.id, title: "Crosspost ke Instagram Story dengan polling stiker", isCompleted: true, createdById: adit.id, assignedToId: rani.id },
      { contentId: c1.id, title: "Balas semua komentar di 1 jam pertama", isCompleted: true, createdById: sarah.id, assignedToId: rani.id },
    ],
  });

  await prisma.contentComment.createMany({
    data: [
      { contentId: c1.id, userId: adit.id, message: "Pilihan warna brand di slide 3 kontrasnya mantap! Engagement save-nya tinggi banget." },
      { contentId: c1.id, userId: bima.id, message: "Sip mas Adit, aset sudah aku simpan juga di master Drive ya." },
    ],
  });

  // 2. Konten LIVE: Video TikTok Behind The Scene
  const c2 = await prisma.marketingContent.create({
    data: {
      title: "TikTok Video: Behind The Scene Produksi Konten Tim Marketing",
      description: "Konten human-interest memperlihatkan suasana kantor & proses brainstorming konten.",
      platform: "TIKTOK",
      contentType: "TIKTOK_VIDEO",
      status: "PUBLISHED",
      prepNotes: "✅ Naskah santai voiceover 45 detik.\n✅ Pemilihan audio tren TikTok 'work routine'.\n✅ Color grading natural warm.",
      assetUrl: "https://drive.google.com/file/d/sample-tiktok-raw",
      assetName: "Master Video TikTok 1080p",
      liveUrl: "https://www.tiktok.com/@arjunamarketing/video/734567890123",
      liveNote: "Masuk FYP! Views tembus 12.8k dan dapat 4 inbound leads via DM.",
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      targetDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      createdById: rani.id,
      assignedToId: rani.id,
    },
  });

  await prisma.contentTask.createMany({
    data: [
      { contentId: c2.id, title: "Take video footage ruang kerja & ekspresi tim", isCompleted: true, createdById: rani.id, assignedToId: rani.id },
      { contentId: c2.id, title: "Pasang auto-caption subtitle teks kuning", isCompleted: true, createdById: adit.id, assignedToId: rani.id },
    ],
  });

  // 3. Konten SIAP TAYANG (Ready To Publish): Reels Instagram
  const c3 = await prisma.marketingContent.create({
    data: {
      title: "Reels Instagram: Transformasi Brand Identitas Klien Q1",
      description: "Showcase studi kasus sebelum vs sesudah rebranding.",
      platform: "INSTAGRAM",
      contentType: "REELS",
      status: "READY_TO_PUBLISH",
      prepNotes: "✅ Video render 1080x1920 60fps selesai.\n✅ Cover reel estetik sudah disesuaikan grid feed.\n✅ Caption copywriting dan tag akun klien sudah diapprove.",
      assetUrl: "https://www.figma.com/file/sample-reel-cover-mockup",
      assetName: "Figma Cover & Storyboard",
      targetDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
      createdById: bima.id,
      assignedToId: rani.id,
    },
  });

  await prisma.contentTask.createMany({
    data: [
      { contentId: c3.id, title: "Kirim draft ke klien untuk final clearance", isCompleted: true, createdById: adit.id, assignedToId: sarah.id },
      { contentId: c3.id, title: "Jadwalkan posting di Meta Business Suite jam 18:30 WIB", isCompleted: false, createdById: adit.id, assignedToId: rani.id },
      { contentId: c3.id, title: "Siapkan template balasan DM otomatis", isCompleted: false, createdById: sarah.id, assignedToId: rani.id },
    ],
  });

  await prisma.contentComment.createMany({
    data: [
      { contentId: c3.id, userId: sarah.id, message: "Klien sudah konfirmasi oke untuk dipublish hari ini ya temen-temen." },
      { contentId: c3.id, userId: rani.id, message: "Siap, nanti begitu live link langsung aku taruh di sini!" },
    ],
  });

  // 4. Konten IN REVIEW: Infografis LinkedIn
  const c4 = await prisma.marketingContent.create({
    data: {
      title: "Infografis LinkedIn: Analisis Tren Social Media Marketing 2026",
      description: "Data-driven konten untuk membangun otoritas di platform B2B LinkedIn.",
      platform: "LINKEDIN",
      contentType: "ARTICLE",
      status: "IN_REVIEW",
      prepNotes: "✅ Riset data dari 3 laporan industri terpercaya.\n✅ Draft visual dibuat format dokumen PDF carousel (10 halaman).\n⚠️ Menunggu pengecekan typo dan kesesuaian data sumber.",
      assetUrl: "https://drive.google.com/file/d/sample-linkedin-doc",
      assetName: "Draft PDF LinkedIn Carousel v1.2",
      targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      createdById: sarah.id,
      assignedToId: bima.id,
    },
  });

  await prisma.contentTask.createMany({
    data: [
      { contentId: c4.id, title: "Koreksi penulisan sumber grafik di halaman 4", isCompleted: false, createdById: adit.id, assignedToId: sarah.id },
      { contentId: c4.id, title: "Ganti icon chart dengan style outline monokrom", isCompleted: false, createdById: adit.id, assignedToId: bima.id },
      { contentId: c4.id, title: "Tag 3 thought leaders di caption untuk engagement", isCompleted: false, createdById: sarah.id, assignedToId: sarah.id },
    ],
  });

  await prisma.contentComment.createMany({
    data: [
      { contentId: c4.id, userId: adit.id, message: "Slide 4 angkanya tolong dicek lagi ya Sarah, apakah itu data YoY atau MoM?" },
      { contentId: c4.id, userId: sarah.id, message: "Itu data YoY Mas Adit, sudah aku perjelas di footnote naskah." },
    ],
  });

  // 5. Konten IN PREPARATION: YouTube Video
  const c5 = await prisma.marketingContent.create({
    data: {
      title: "YouTube Video: Cara Riset Kata Kunci TikTok dalam 3 Menit",
      description: "Video tutorial teknis tutorial step-by-step riset konten viral.",
      platform: "YOUTUBE",
      contentType: "YOUTUBE_VIDEO",
      status: "IN_PREPARATION",
      prepNotes: "✅ Outline 3 langkah riset sudah tersusun di Notion.\n✅ Rekaman layar (OBS Studio) durasi 6 menit sudah ada.\n⚠️ Belum rekaman intro muka pembicara & thumbnail YouTube.",
      assetUrl: "https://drive.google.com/drive/sample-raw-footage",
      assetName: "Folder Raw Footage Screen Record",
      targetDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      createdById: bima.id,
      assignedToId: sarah.id,
    },
  });

  await prisma.contentTask.createMany({
    data: [
      { contentId: c5.id, title: "Rekam intro muka & penutup (CTA Subscribe)", isCompleted: false, createdById: bima.id, assignedToId: sarah.id },
      { contentId: c5.id, title: "Bikin 2 alternatif desain Thumbnail YouTube yang eye-catching", isCompleted: false, createdById: adit.id, assignedToId: bima.id },
    ],
  });

  // 6. Konten IDEA: Campaign Promo
  await prisma.marketingContent.create({
    data: {
      title: "Campaign Promo Q2: Bundling Jasa Desain Konten + Optimasi Iklan",
      description: "Paket bundling khusus klien baru untuk kuartal kedua.",
      platform: "INSTAGRAM",
      contentType: "STORY",
      status: "IDEA",
      prepNotes: "Konsep diskon early bird 30% untuk 10 pendaftar pertama. Perlu copywriting teaser 3 hari sebelum launching.",
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: adit.id,
      assignedToId: sarah.id,
    },
  });

  console.log("✅ Seed database marketing selesai!");
  console.log("Akun tersedia (Password semua: Admin#2026):");
  console.log("1. adit@marketing.id (Marketing Lead)");
  console.log("2. sarah@marketing.id (Content Creator)");
  console.log("3. bima@marketing.id (Graphic Designer)");
  console.log("4. rani@marketing.id (Social Media Admin)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
