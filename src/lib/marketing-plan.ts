/**
 * MARKET PLAN MEDSOS — TPA KB TK ISLAM PLUS ARJUNA
 * Sumber: "JADWAL MARKET KONTEN.xlsx" (tahun ajaran Juli → Juni, 4 minggu per bulan).
 *
 * Struktur Excel → struktur data:
 *  I.    Pendaftaran SPMB (#spmb)        → pilar SPMB       (terjadwal per minggu)
 *  II.   Soft Selling Promo              → pilar PROMO      (terjadwal per minggu)
 *  III.  Eventday, Congratulation & Lomba → pilar HARIBESAR  (22 hari besar, terjadwal per minggu)
 *  IV.   Konten Event                    → pilar EVENT      (rutin, mengikuti kegiatan sekolah)
 *  V.    Konten Edukasi                  → pilar EDUKASI    (rutin)
 *  VI.   Building Trust                  → pilar TRUST      (rutin)
 *  VII.  Daily Life                      → pilar DAILY      (rutin)
 *  VIII. Testimoni Wali Murid            → pilar TESTIMONI  (rutin)
 *  IX.   Format Konten (kode R/C/V/S/RD) → lihat FORMAT_OPTIONS di content-utils.ts
 *  X.    Ide Konten                      → diisi lewat Studio Ide
 *  Baris "Tema Pembelajaran"             → pilar TEMA       (satu tema per bulan)
 */

export const SCHOOL_MONTHS = [
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
] as const;

/** Nama bulan kalender Indonesia, indeks 0 = Januari. */
const CALENDAR_MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export type PillarId =
  | "TEMA"
  | "SPMB"
  | "PROMO"
  | "HARIBESAR"
  | "EVENT"
  | "EDUKASI"
  | "TRUST"
  | "DAILY"
  | "TESTIMONI";

export type WeekNo = 1 | 2 | 3 | 4;

export interface PlanSlot {
  /** Indeks bulan tahun ajaran: 0 = Juli … 11 = Juni */
  m: number;
  w: WeekNo;
}

export interface PlanItem {
  id: string;
  pillar: PillarId;
  label: string;
  /** Tanggal peringatan (khusus hari besar) */
  day?: number;
  /** Bulan kalender 1–12 (khusus hari besar) */
  calMonth?: number;
  slots: PlanSlot[];
  hashtags?: string[];
  /** Catatan transparansi, mis. minggu tayang diturunkan dari tanggal karena kosong di Excel */
  note?: string;
}

export interface PillarMeta {
  id: PillarId;
  label: string;
  emoji: string;
  description: string;
  /** true = punya minggu tayang tetap di jadwal, false = konten rutin (kapan saja) */
  scheduled: boolean;
  chip: string;
  dot: string;
}

export const PILLARS: Record<PillarId, PillarMeta> = {
  TEMA: {
    id: "TEMA",
    label: "Tema Pembelajaran",
    emoji: "📚",
    description: "Tema kurikulum sepanjang bulan — selaraskan semua konten dengan tema ini.",
    scheduled: true,
    chip: "bg-indigo-50 text-indigo-800 border-indigo-300",
    dot: "bg-indigo-500",
  },
  SPMB: {
    id: "SPMB",
    label: "Pendaftaran SPMB",
    emoji: "📝",
    description: "Konten ajakan pendaftaran peserta didik baru.",
    scheduled: true,
    chip: "bg-rose-50 text-rose-800 border-rose-300",
    dot: "bg-rose-500",
  },
  PROMO: {
    id: "PROMO",
    label: "Soft Selling Promo",
    emoji: "🏷️",
    description: "Promo yang disampaikan halus, bukan hard-sell.",
    scheduled: true,
    chip: "bg-amber-50 text-amber-800 border-amber-300",
    dot: "bg-amber-500",
  },
  HARIBESAR: {
    id: "HARIBESAR",
    label: "Hari Besar & Peringatan",
    emoji: "🎉",
    description: "Eventday, ucapan selamat, dan lomba pada hari besar nasional.",
    scheduled: true,
    chip: "bg-orange-50 text-orange-800 border-orange-300",
    dot: "bg-orange-500",
  },
  EVENT: {
    id: "EVENT",
    label: "Konten Event Sekolah",
    emoji: "🎪",
    description: "Dokumentasi acara dan kegiatan khusus sekolah.",
    scheduled: false,
    chip: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300",
    dot: "bg-fuchsia-500",
  },
  EDUKASI: {
    id: "EDUKASI",
    label: "Konten Edukasi",
    emoji: "🧠",
    description: "Stimulasi tumbuh kembang dan kurikulum Arjuna.",
    scheduled: false,
    chip: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dot: "bg-emerald-500",
  },
  TRUST: {
    id: "TRUST",
    label: "Building Trust",
    emoji: "🤝",
    description: "Membangun rasa aman dan percaya orang tua.",
    scheduled: false,
    chip: "bg-sky-50 text-sky-800 border-sky-300",
    dot: "bg-sky-500",
  },
  DAILY: {
    id: "DAILY",
    label: "Daily Life",
    emoji: "☀️",
    description: "Potret keseharian anak di Arjuna.",
    scheduled: false,
    chip: "bg-yellow-50 text-yellow-800 border-yellow-300",
    dot: "bg-yellow-500",
  },
  TESTIMONI: {
    id: "TESTIMONI",
    label: "Testimoni Wali Murid",
    emoji: "💬",
    description: "Suara orang tua dan cerita keluarga Arjuna.",
    scheduled: false,
    chip: "bg-teal-50 text-teal-800 border-teal-300",
    dot: "bg-teal-500",
  },
};

export const PILLAR_ORDER: PillarId[] = [
  "TEMA",
  "SPMB",
  "PROMO",
  "HARIBESAR",
  "EVENT",
  "EDUKASI",
  "TRUST",
  "DAILY",
  "TESTIMONI",
];

// ---------------------------------------------------------------------------------------
// DATA JADWAL
// ---------------------------------------------------------------------------------------

const slot = (m: number, w: WeekNo): PlanSlot => ({ m, w });

/** Tema Pembelajaran per bulan (baris "TEMA PEMBELAJARAN" di Excel), urut Juli → Juni. */
const MONTH_THEMES: { id: string; label: string }[] = [
  { id: "tp-mpls", label: "MPLS" },
  { id: "tp-diri-sendiri", label: "Diri Sendiri" },
  { id: "tp-tanaman", label: "Tanaman" },
  { id: "tp-binatang", label: "Binatang" },
  { id: "tp-profesi", label: "Profesi" },
  { id: "tp-karakter-des", label: "Pendidikan Karakter" },
  { id: "tp-transportasi", label: "Transportasi" },
  { id: "tp-alam-semesta", label: "Alam Semesta" },
  { id: "tp-ramadhan", label: "Ramadhan" },
  { id: "tp-tanah-airku", label: "Tanah Airku" },
  { id: "tp-karakter-mei", label: "Pendidikan Karakter" },
  { id: "tp-pentas-seni", label: "Pentas Seni" },
];

const TEMA_ITEMS: PlanItem[] = MONTH_THEMES.map((t, m) => ({
  id: t.id,
  pillar: "TEMA",
  label: t.label,
  slots: [slot(m, 1), slot(m, 2), slot(m, 3), slot(m, 4)],
}));

const SPMB_ITEMS: PlanItem[] = [
  {
    id: "spmb-pendaftaran",
    pillar: "SPMB",
    label: "Pendaftaran SPMB",
    // Juli, September, Desember, Januari, April, Mei, Juni — minggu I
    slots: [slot(0, 1), slot(2, 1), slot(5, 1), slot(6, 1), slot(9, 1), slot(10, 1), slot(11, 1)],
    hashtags: ["#spmb"],
  },
  {
    id: "promo-soft-selling",
    pillar: "PROMO",
    label: "Soft Selling Promo",
    // Desember minggu II, Maret minggu I
    slots: [slot(5, 2), slot(8, 1)],
  },
];

type HariBesarRow = [id: string, label: string, day: number, calMonth: number, m: number, w: WeekNo, note?: string];

const HARI_BESAR_ROWS: HariBesarRow[] = [
  ["hb-hari-anak", "Hari Anak Nasional", 23, 7, 0, 3],
  ["hb-hari-bhakti-tni-au", "Hari Bhakti TNI Angkatan Udara", 29, 7, 0, 4],
  ["hb-hari-pramuka", "Hari Pramuka", 14, 8, 1, 2],
  ["hb-hari-kemerdekaan", "Hari Proklamasi Kemerdekaan RI", 17, 8, 1, 3],
  ["hb-hari-polwan", "Hari Polisi Wanita", 1, 9, 2, 1],
  ["hb-hari-olahraga", "Hari Olah Raga Nasional", 9, 9, 2, 2],
  ["hb-hari-pancasila-okt", "Hari Pancasila", 1, 10, 3, 1],
  [
    "hb-hari-batik",
    "Hari Batik Nasional",
    2,
    10,
    3,
    1,
    "Kolom minggu kosong di Excel — ditempatkan di minggu I Oktober mengikuti tanggalnya (2 Oktober).",
  ],
  ["hb-hari-tni", "Hari TNI", 5, 10, 3, 1],
  ["hb-hari-sumpah-pemuda", "Hari Sumpah Pemuda", 28, 10, 3, 4],
  ["hb-hari-pahlawan", "Hari Pahlawan", 10, 11, 4, 2],
  ["hb-hari-ayah", "Hari Ayah Nasional", 12, 11, 4, 2],
  ["hb-hari-ibu", "Hari Ibu Nasional", 22, 12, 5, 3],
  ["hb-hari-kowal", "Hari KOWAL (Korps Wanita Angkatan Laut)", 5, 1, 6, 1],
  ["hb-hari-gizi", "Hari Gizi Nasional", 28, 2, 7, 4],
  ["hb-hari-dongeng", "Hari Dongeng Sedunia", 20, 3, 8, 2],
  ["hb-hari-buku-anak", "Hari Buku Anak Sedunia", 2, 4, 9, 1],
  ["hb-hari-kartini", "Hari Kartini", 21, 4, 9, 3],
  ["hb-hari-tni-au", "Hari TNI Udara", 9, 4, 9, 2],
  ["hb-hari-pendidikan", "Hari Pendidikan Nasional", 2, 5, 10, 1],
  ["hb-hari-keluarga", "Hari Keluarga", 29, 5, 10, 4],
  ["hb-hari-pancasila-jun", "Hari Pancasila", 1, 6, 11, 1],
];

const HARI_BESAR_ITEMS: PlanItem[] = HARI_BESAR_ROWS.map(([id, label, day, calMonth, m, w, note]) => ({
  id,
  pillar: "HARIBESAR",
  label,
  day,
  calMonth,
  slots: [slot(m, w)],
  note,
}));

/** Pilar rutin: tidak punya minggu tayang tetap, dipilih kapan saja sesuai bahan yang tersedia. */
function routineItems(pillar: PillarId, prefix: string, labels: string[]): PlanItem[] {
  return labels.map((label, i) => ({
    id: `${prefix}-${i + 1}`,
    pillar,
    label,
    slots: [],
  }));
}

const EVENT_ITEMS = routineItems("EVENT", "ev", [
  "HUT Sekolah",
  "HUT RI",
  "Outing Class",
  "Study Wisata",
  "Hari Raya Lebaran",
  "Lomba",
  "Kegiatan Sosial",
  "Hari Raya Idul Adha",
  "Manasik Haji Cilik",
]);

const EDUKASI_ITEMS = routineItems("EDUKASI", "edu", [
  "Motorik Halus",
  "Motorik Kasar",
  "Bahasa & Literasi",
  "Sains Sederhana",
  "Sosial & Emosional",
  "Nilai & Karakter",
  "KinetiClub",
  "Kurikulum (Montessori, STEAM & Kumer)",
  "Massage Kid",
]);

const TRUST_ITEMS = routineItems("TRUST", "trust", [
  "Keamanan & Prosedur",
  "Kebersihan & Kesehatan",
  "Kualitas Guru & Pengasuh",
  "Transparansi Harian",
  "Bukti Sosial",
  "Kepedulian & Pendekatan",
  "Legalitas & Kredibilitas",
  "Kehidupan Nyata",
]);

const DAILY_ITEMS = routineItems("DAILY", "daily", [
  "Datang Pagi & Pulang",
  "Kegiatan Bermain",
  "Kegiatan Makan Bersama",
  "Kegiatan Belajar",
  "Kegiatan Upacara",
  "Kegiatan Berkebun",
  "Cooking Class",
  "Kegiatan Berenang",
  "Program UKS",
]);

const TESTIMONI_ITEMS = routineItems("TESTIMONI", "testi", [
  "Parents Day",
  "Father Day",
  "Mother Day",
  "Mama Papa Liat Aksiku",
]);

export const PLAN_ITEMS: PlanItem[] = [
  ...TEMA_ITEMS,
  ...SPMB_ITEMS,
  ...HARI_BESAR_ITEMS,
  ...EVENT_ITEMS,
  ...EDUKASI_ITEMS,
  ...TRUST_ITEMS,
  ...DAILY_ITEMS,
  ...TESTIMONI_ITEMS,
];

const PLAN_INDEX: Record<string, PlanItem> = Object.fromEntries(PLAN_ITEMS.map((p) => [p.id, p]));

export function getPlanItem(id?: string | null): PlanItem | undefined {
  return id ? PLAN_INDEX[id] : undefined;
}

/** Label tampilan ringkas, mis. "Tema: Profesi" atau "Hari Pahlawan". */
export function getPlanLabel(item: PlanItem): string {
  return item.pillar === "TEMA" ? `Tema: ${item.label}` : item.label;
}

export function getThemeText(themeId?: string | null, fallbackLabel?: string | null): string {
  const item = getPlanItem(themeId);
  if (item) return getPlanLabel(item);
  return fallbackLabel || "";
}

// ---------------------------------------------------------------------------------------
// POSISI WAKTU (bulan & minggu tahun ajaran)
// ---------------------------------------------------------------------------------------

export interface SchoolPosition {
  m: number;
  w: WeekNo;
}

/** Hari 1–7 = minggu I, 8–14 = II, 15–21 = III, sisanya = IV (sesuai pola penanggalan di Excel). */
export function getSchoolPosition(date: Date = new Date()): SchoolPosition {
  const w = Math.min(4, Math.max(1, Math.ceil(date.getDate() / 7))) as WeekNo;
  return { m: (date.getMonth() + 6) % 12, w };
}

export function slotIndex(s: PlanSlot | SchoolPosition): number {
  return s.m * 4 + (s.w - 1);
}

/** Jarak minggu dari posisi sekarang ke slot (0 = minggu ini), melingkar per tahun ajaran. */
export function weeksAhead(from: SchoolPosition, to: PlanSlot): number {
  return (slotIndex(to) - slotIndex(from) + 48) % 48;
}

export function formatSlot(s: PlanSlot | SchoolPosition): string {
  return `Minggu ke-${s.w} ${SCHOOL_MONTHS[s.m]}`;
}

export function toRoman(w: number): string {
  return ["", "I", "II", "III", "IV"][w] || String(w);
}

export function getMonthTheme(m: number): PlanItem {
  return TEMA_ITEMS[((m % 12) + 12) % 12];
}

/** Item terjadwal (selain tema pembelajaran) pada bulan & minggu tertentu. */
export function getItemsForSlot(m: number, w: WeekNo): PlanItem[] {
  return PLAN_ITEMS.filter(
    (p) => p.pillar !== "TEMA" && p.slots.some((s) => s.m === m && s.w === w)
  );
}

/** Seluruh item terjadwal pada satu bulan, dikelompokkan per minggu. */
export function getMonthSchedule(m: number): Record<WeekNo, PlanItem[]> {
  return {
    1: getItemsForSlot(m, 1),
    2: getItemsForSlot(m, 2),
    3: getItemsForSlot(m, 3),
    4: getItemsForSlot(m, 4),
  };
}

/** Jumlah hari menuju peringatan berikutnya (khusus hari besar). */
export function daysUntil(item: PlanItem, now: Date = new Date()): number | null {
  if (!item.day || !item.calMonth) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target = new Date(now.getFullYear(), item.calMonth - 1, item.day);
  if (target.getTime() < today.getTime()) {
    target = new Date(now.getFullYear() + 1, item.calMonth - 1, item.day);
  }
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatPlanDate(item: PlanItem): string {
  if (!item.day || !item.calMonth) return "";
  return `${item.day} ${CALENDAR_MONTHS_ID[item.calMonth - 1]}`;
}

export interface UpcomingEntry {
  item: PlanItem;
  slot: PlanSlot;
  weeksAhead: number;
}

/** Item terjadwal terdekat mulai minggu ini ke depan (urut paling dekat). */
export function getUpcoming(now: Date = new Date(), limit = 6): UpcomingEntry[] {
  const pos = getSchoolPosition(now);
  const entries: UpcomingEntry[] = [];
  for (const item of PLAN_ITEMS) {
    if (item.pillar === "TEMA") continue;
    for (const s of item.slots) {
      entries.push({ item, slot: s, weeksAhead: weeksAhead(pos, s) });
    }
  }
  entries.sort((a, b) => a.weeksAhead - b.weeksAhead || a.item.label.localeCompare(b.item.label));
  return entries.slice(0, limit);
}

export function describeWeeksAhead(n: number): string {
  if (n === 0) return "Minggu ini";
  if (n === 1) return "Minggu depan";
  if (n < 5) return `${n} minggu lagi`;
  const months = Math.round(n / 4);
  return `±${months} bulan lagi`;
}

// ---------------------------------------------------------------------------------------
// PILIHAN TEMA UNTUK FORM & STUDIO
// ---------------------------------------------------------------------------------------

export interface ThemeGroup {
  key: string;
  label: string;
  items: PlanItem[];
}

/**
 * Daftar tema untuk dropdown. Grup pertama "Disarankan minggu ini" berisi tema yang paling relevan
 * sekarang (tema pembelajaran bulan ini + item terjadwal minggu ini/depan).
 */
export function getThemeGroups(now: Date = new Date()): ThemeGroup[] {
  const pos = getSchoolPosition(now);
  const suggested: PlanItem[] = [getMonthTheme(pos.m)];
  for (const e of getUpcoming(now, 12)) {
    if (e.weeksAhead <= 1 && !suggested.includes(e.item)) suggested.push(e.item);
  }

  const groups: ThemeGroup[] = [
    { key: "SUGGESTED", label: "⭐ Disarankan saat ini", items: suggested },
  ];
  for (const pillar of PILLAR_ORDER) {
    const items = PLAN_ITEMS.filter((p) => p.pillar === pillar);
    groups.push({ key: pillar, label: `${PILLARS[pillar].emoji} ${PILLARS[pillar].label}`, items });
  }
  return groups;
}

/**
 * Kalimat topik awal untuk Studio Ide — ikut membawa tema pembelajaran bulan ini agar ide
 * yang dihasilkan selaras dengan kurikulum yang sedang berjalan.
 */
export function buildStudioTopic(item: PlanItem, now: Date = new Date()): string {
  const monthTheme = getMonthTheme(getSchoolPosition(now).m);
  const themeHint =
    item.pillar === "TEMA" ? "" : ` Selaraskan dengan tema pembelajaran bulan ini: ${monthTheme.label}.`;

  switch (item.pillar) {
    case "TEMA":
      return `Tema pembelajaran "${item.label}" di PAUD Arjuna Malang: kegiatan belajar sambil bermain yang bisa dilihat dan dirasakan orang tua.`;
    case "HARIBESAR": {
      const date = formatPlanDate(item);
      return `${item.label}${date ? ` (${date})` : ""} di PAUD Arjuna Malang — ucapan/kegiatan yang hangat dan bermakna untuk anak usia dini.${themeHint}`;
    }
    case "SPMB":
      return `Ajakan pendaftaran SPMB PAUD Arjuna Malang (Daycare, KB & TK) yang hangat dan tidak hard-sell. Gunakan hashtag #spmb.${themeHint}`;
    case "PROMO":
      return `Soft selling promo PAUD Arjuna Malang yang halus: tonjolkan manfaat nyata untuk tumbuh kembang anak, bukan sekadar diskon.${themeHint}`;
    default:
      return `${PILLARS[item.pillar].label}: ${item.label} di PAUD Arjuna Malang.${themeHint}`;
  }
}
