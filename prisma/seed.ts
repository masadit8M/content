import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Mengosongkan data lama...");
  await prisma.contentComment.deleteMany();
  await prisma.contentTask.deleteMany();
  await prisma.marketingContent.deleteMany();
  await prisma.user.deleteMany();

  console.log("👥 Membuat akun tim marketing PAUD Arjuna...");
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

  console.log("🚀 Membuat data alur konten (Bahan Mentah -> Editing -> Siap Upload -> Live)...");

  // =========================================================================
  // TAB 1: BAHAN MENTAH (RAW_MATERIAL)
  // =========================================================================
  const raw1 = await prisma.marketingContent.create({
    data: {
      title: "Footage Mentah: Senam Pagi Brain Gym & Gerak Lagu Anak TK Arjuna",
      description: "Video rekaman HP lapangan saat senam pagi anak-anak di halaman sekolah. Siap diedit jadi Reels 30 detik.",
      platform: "INSTAGRAM",
      contentType: "REELS",
      status: "RAW_MATERIAL",
      rawAssetUrl: "https://assets.mixkit.co/videos/preview/mixkit-little-girl-playing-with-educational-toys-42618-large.mp4",
      rawAssetName: "VID_BrainGym_Pagi.mp4",
      rawAssetType: "VIDEO",
      createdById: rani.id,
      assignedToId: null, // Belum diambil
    },
  });

  await prisma.contentComment.create({
    data: {
      contentId: raw1.id,
      userId: rani.id,
      message: "Footage baru dari Bu Guru kelas TK A nih. @Bima atau @Sarah monggo diambil untuk dibikin video reels seru ya!",
      taggedUserId: bima.id,
    },
  });

  const raw2 = await prisma.marketingContent.create({
    data: {
      title: "Foto Dokumentasi: Kegiatan Sensory Play Pasir Kinetik & Finger Painting",
      description: "Kumpulan foto ekspresi bahagia anak saat eksplorasi tekstur warna. Cocok untuk Carousel 6 slide.",
      platform: "INSTAGRAM",
      contentType: "FEED_CAROUSEL",
      status: "RAW_MATERIAL",
      rawAssetUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=80",
      rawAssetName: "IMG_Sensory_Play_Full.jpg",
      rawAssetType: "IMAGE",
      createdById: sarah.id,
      assignedToId: null,
    },
  });

  await prisma.contentComment.create({
    data: {
      contentId: raw2.id,
      userId: sarah.id,
      message: "Foto-fotonya resolusi tinggi. @Bima bisa bantu layout ke template Canva PAUD Arjuna?",
      taggedUserId: bima.id,
    },
  });

  // =========================================================================
  // TAB 2: PROSES EDITING & REVISI (IN_EDITING & NEED_REVISION)
  // =========================================================================
  const edit1 = await prisma.marketingContent.create({
    data: {
      title: "Reels: 3 Kebiasaan Sepele yang Bikin Anak Mandiri Tanpa Drama",
      description: "Video edukasi parenting untuk working parents di Malang.",
      platform: "INSTAGRAM",
      contentType: "REELS",
      status: "IN_EDITING",
      rawAssetUrl: "https://assets.mixkit.co/videos/preview/mixkit-little-girl-playing-with-educational-toys-42618-large.mp4",
      editedAssetUrl: "https://assets.mixkit.co/videos/preview/mixkit-little-girl-playing-with-educational-toys-42618-large.mp4",
      editedAssetName: "Draft_Reels_Kemandirian_v1.mp4",
      version: 1,
      prepNotes: "Draft Naskah:\n1. Hook: 'Ayah Bunda, sering nggak anak nangis tiap diminta pakai sepatu sendiri?'\n2. Solusi: Metode 'Choice of Two' di PAUD Arjuna.\n3. CTA: Save postingan ini & ikut Free Trial Daycare!",
      createdById: sarah.id,
      assignedToId: bima.id, // Bima sedang mengerjakan
    },
  });

  await prisma.contentComment.createMany({
    data: [
      {
        contentId: edit1.id,
        userId: bima.id,
        message: "Draft video v1 sudah saya upload di tab hasil edit ya. @Adit mohon review hook awal 3 detik.",
        taggedUserId: adit.id,
      },
      {
        contentId: edit1.id,
        userId: adit.id,
        message: "@Bima transisinya sudah halus! Tambahin logo Arjuna di detik 0-3 ya.",
        taggedUserId: bima.id,
      },
    ],
  });

  const edit2 = await prisma.marketingContent.create({
    data: {
      title: "Carousel: Kenapa Daycare Lebih Aman Dibanding Ditinggal Sama Gadget?",
      description: "Edukasi perbandingan interaksi sosial anak di daycare vs screen time berlebih.",
      platform: "INSTAGRAM",
      contentType: "FEED_CAROUSEL",
      status: "NEED_REVISION",
      rawAssetUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
      editedAssetUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=80",
      version: 2,
      revisionNote: "@Bima tolong teks slide 2 fontnya diganti warna navy #1A3460 agar terbaca jelas, dan tambahkan hashtag #DaycareMalang.",
      prepNotes: "Slide 1: Anak diam pegang HP vs Anak aktif di Daycare Arjuna\nSlide 2: Bahaya speech delay akibat pasif screen time\nSlide 3: Stimulasi multisensori di PAUD Arjuna",
      createdById: adit.id,
      assignedToId: bima.id,
    },
  });

  await prisma.contentComment.create({
    data: {
      contentId: edit2.id,
      userId: adit.id,
      message: "🔁 @Bima slide 2 perlu revisi sedikit ya, fontnya kurang kontras. Silakan cek catatan revisi.",
      taggedUserId: bima.id,
    },
  });

  // =========================================================================
  // TAB 3: SIAP UPLOAD (READY_TO_PUBLISH)
  // =========================================================================
  const ready1 = await prisma.marketingContent.create({
    data: {
      title: "Reels 60s: Tour Fasilitas Ramah Anak & Ruang Tidur Nyaman PAUD Arjuna",
      description: "Video visual estetik memperlihatkan kebersihan, keamanan CCTV, dan sirkulasi udara ruang tidur daycare.",
      platform: "INSTAGRAM",
      contentType: "REELS",
      status: "READY_TO_PUBLISH",
      rawAssetUrl: "https://assets.mixkit.co/videos/preview/mixkit-little-girl-playing-with-educational-toys-42618-large.mp4",
      editedAssetUrl: "https://assets.mixkit.co/videos/preview/mixkit-little-girl-playing-with-educational-toys-42618-large.mp4",
      version: 2,
      prepNotes: `Bunda tenang saat bekerja, si kecil ceria sepanjang hari! 🌸✨

Di PAUD & Daycare Arjuna Malang, kami memastikan setiap sudut ruangan aman, higienis, dan dilengkapi pengawasan CCTV aktif. Mulai dari ruang sensori, area bermain outdoor berumput aman, hingga ruang tidur berpemandangan sejuk.

🏡 Lokasi: Malang, Jawa Timur
👶 Menerima Daycare & Kelompok Bermain (0-6 Tahun)
📲 Klik link di bio untuk konsultasi trial gratis!

#PAUDArjuna #DaycareMalang #TKSensoriMalang #ParentingMalang #SekolahRamahAnak`,
      createdById: sarah.id,
      assignedToId: rani.id, // Rani yang upload
      targetDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // Siap tayang hari ini
    },
  });

  await prisma.contentComment.createMany({
    data: [
      {
        contentId: ready1.id,
        userId: adit.id,
        message: "✅ Sudah diapprove! @Rani tolong dijadwalkan tayang jam 18:30 WIB ya, itu peak hour Bunda pulang kantor.",
        taggedUserId: rani.id,
      },
      {
        contentId: ready1.id,
        userId: rani.id,
        message: "Siap mas Adit! File video dan caption sudah siap tinggal copas.",
        taggedUserId: adit.id,
      },
    ],
  });

  // =========================================================================
  // TAB 4: SUDAH LIVE (PUBLISHED SHOWCASE)
  // =========================================================================
  const live1 = await prisma.marketingContent.create({
    data: {
      title: "Postingan Live: 5 Alasan Kenapa Memilih PAUD Arjuna Malang untuk Golden Age Anak",
      description: "Edukasi pentingnya stimulasi otak kanan dan kiri sejak usia dini.",
      platform: "INSTAGRAM",
      contentType: "FEED_CAROUSEL",
      status: "PUBLISHED",
      editedAssetUrl: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=80",
      liveUrl: "https://www.instagram.com/p/DC-ArjunaMalang-Sample/",
      liveNote: "Diposting jam 17:00 WIB. Reach 2.400+, 120 saves, dan 5 DM bertanya biaya pendaftaran.",
      prepNotes: "Edukasi Golden Age anak usia 0-6 tahun. Lengkap dengan logo PAUD Arjuna di setiap slide.",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      createdById: sarah.id,
      assignedToId: rani.id,
    },
  });

  await prisma.contentComment.create({
    data: {
      contentId: live1.id,
      userId: rani.id,
      message: "🎉 Konten sudah tayang live dan engagement sangat bagus! Komen orang tua positif sekali.",
    },
  });

  console.log("✅ Seed database pipeline tim marketing berhasil diperbarui!");
  console.log("Akun tim tersedia (Password: Admin#2026):");
  console.log("1. adit@marketing.id (Marketing Lead)");
  console.log("2. sarah@marketing.id (Content Creator)");
  console.log("3. bima@marketing.id (Graphic & Motion Designer)");
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
