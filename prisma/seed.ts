import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Membersihkan seluruh database dan menyiapkan data awal bersih...");

  // Delete all existing operational data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.report.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.sDMApproval.deleteMany();
  await prisma.sDMProposal.deleteMany();
  await prisma.sDMAssignment.deleteMany();
  await prisma.sDMRequest.deleteMany();
  await prisma.recommendationDecision.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.taskChecklist.deleteMany();
  await prisma.task.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectPhase.deleteMany();
  await prisma.category.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Hash individual passwords for each user
  const tikaPasswordHash = await bcrypt.hash("Tika#Arjuna2026", 10);
  const aditPasswordHash = await bcrypt.hash("Adit#Arjuna2026", 10);
  const cindyPasswordHash = await bcrypt.hash("Cindy#Arjuna2026", 10);
  const lenaPasswordHash = await bcrypt.hash("Lena#Arjuna2026", 10);
  const tsaniaPasswordHash = await bcrypt.hash("Tsania#Nara2026", 10);
  const ryanPasswordHash = await bcrypt.hash("Ryan#Nara2026", 10);

  // 1. Organisasi
  const arjunaOrg = await prisma.organization.create({
    data: {
      name: "Yayasan Arjuna Cendekia",
      type: "CONSULTANT",
      logo: "/icons/arjuna.svg",
    },
  });

  const rumahNaraOrg = await prisma.organization.create({
    data: {
      name: "Rumah Nara Islamic Child Center",
      type: "CLIENT",
      logo: "/icons/rumahnara.svg",
    },
  });

  // 2. Akun Pengguna Resmi
  // Tim Konsultan Arjuna
  const tika = await prisma.user.create({
    data: {
      name: "Mbak Tika",
      email: "tika@arjuna.id",
      passwordHash: tikaPasswordHash,
      title: "Konsultan Pendamping Daycare",
      phone: "+62 811-1002-002",
      globalRole: "ARJUNA_CONSULTANT",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  const masAdit = await prisma.user.create({
    data: {
      name: "Mas Adit",
      email: "masadit@arjuna.id",
      passwordHash: aditPasswordHash,
      title: "Lead Consultant & Admin",
      phone: "+62 811-1001-001",
      globalRole: "ARJUNA_SUPER_ADMIN",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  const cindy = await prisma.user.create({
    data: {
      name: "Cindy",
      email: "cindy@arjuna.id",
      passwordHash: cindyPasswordHash,
      title: "Spesialis Kurikulum & SOP",
      phone: "+62 811-1003-003",
      globalRole: "ARJUNA_CONSULTANT",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
  });

  const lena = await prisma.user.create({
    data: {
      name: "Lena",
      email: "lena@arjuna.id",
      passwordHash: lenaPasswordHash,
      title: "Spesialis SDM & Pelatihan",
      phone: "+62 811-1004-004",
      globalRole: "ARJUNA_CONSULTANT",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Tim Klien Rumah Nara
  const tsania = await prisma.user.create({
    data: {
      name: "Ms. Tsania",
      email: "tsania@rumahnara.id",
      passwordHash: tsaniaPasswordHash,
      title: "Kepala Daycare Rumah Nara",
      phone: "+62 812-9000-002",
      globalRole: "CLIENT_USER",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const ryan = await prisma.user.create({
    data: {
      name: "Mr. Ryan",
      email: "ryan@rumahnara.id",
      passwordHash: ryanPasswordHash,
      title: "Owner / Pengambil Keputusan",
      phone: "+62 812-9000-001",
      globalRole: "CLIENT_USER",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Keanggotaan Organisasi
  await prisma.organizationMember.createMany({
    data: [
      { userId: tika.id, organizationId: arjunaOrg.id, role: "MEMBER" },
      { userId: masAdit.id, organizationId: arjunaOrg.id, role: "OWNER" },
      { userId: cindy.id, organizationId: arjunaOrg.id, role: "MEMBER" },
      { userId: lena.id, organizationId: arjunaOrg.id, role: "MEMBER" },
      { userId: tsania.id, organizationId: rumahNaraOrg.id, role: "ADMIN" },
      { userId: ryan.id, organizationId: rumahNaraOrg.id, role: "OWNER" },
    ],
  });

  // 3. Proyek Tunggal: Rumah Nara (Kondisi Bersih / Fresh Start)
  const rumahNaraProject = await prisma.project.create({
    data: {
      displayName: "Rumah Nara Islamic Child Center",
      legalName: "CV Santara Artha",
      clientOrgId: rumahNaraOrg.id,
      consultantOrgId: arjunaOrg.id,
      startDate: new Date("2026-09-09T00:00:00Z"),
      endDate: new Date("2027-09-08T23:59:59Z"),
      status: "ACTIVE",
      healthScore: "GREEN",
      progressPercentage: 0, // Fresh 0%
    },
  });

  // Hubungkan Member ke Proyek
  await prisma.projectMember.createMany({
    data: [
      { projectId: rumahNaraProject.id, userId: tika.id, role: "ARJUNA_CONSULTANT" },
      { projectId: rumahNaraProject.id, userId: masAdit.id, role: "ARJUNA_SUPER_ADMIN" },
      { projectId: rumahNaraProject.id, userId: cindy.id, role: "ARJUNA_CONSULTANT" },
      { projectId: rumahNaraProject.id, userId: lena.id, role: "ARJUNA_CONSULTANT" },
      { projectId: rumahNaraProject.id, userId: tsania.id, role: "CLIENT_MANAGER" },
      { projectId: rumahNaraProject.id, userId: ryan.id, role: "CLIENT_OWNER" },
    ],
  });

  // Kategori Sederhana
  const defaultCategories = [
    "SOP Operasional",
    "Kurikulum & Program Anak",
    "Kesiapan Fasilitas",
    "Pelatihan Guru & Staf",
    "Penyediaan SDM Daycare",
    "Umum / Lainnya",
  ];

  await Promise.all(
    defaultCategories.map((name) =>
      prisma.category.create({
        data: {
          projectId: rumahNaraProject.id,
          name,
          isDefault: true,
        },
      })
    )
  );

  console.log("✅ Database berhasil dibersihkan!");
  console.log("✅ Data aktivitas, tugas, dan rekomendasi dummy telah dihapus (Kondisi Awal Bersih).");
  console.log("✅ 6 Akun resmi siap digunakan:");
  console.log("   - Mbak Tika (tika@arjuna.id) — Konsultan Pendamping");
  console.log("   - Ms. Tsania (tsania@rumahnara.id) — Kepala Daycare Rumah Nara");
  console.log("   - Mr. Ryan (ryan@rumahnara.id) — Owner Rumah Nara");
  console.log("   - Mas Adit (masadit@arjuna.id)");
  console.log("   - Cindy (cindy@arjuna.id)");
  console.log("   - Lena (lena@arjuna.id)");
  console.log("   - Password default: arjuna123");
}

main()
  .catch((e) => {
    console.error("❌ Error resetting database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
