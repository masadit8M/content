export interface TeamMember {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  title: string;
  avatar: string;
  roleLabel: string;
  badgeColor: string;
  description: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "usr_adit",
    name: "Adit",
    username: "adit",
    email: "adit@marketing.id",
    role: "LEAD",
    title: "Marketing Lead & Strategist",
    roleLabel: "Marketing Lead",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    description: "Supervisi campaign konten, review naskah & approval jadwal tayang",
  },
  {
    id: "usr_tika",
    name: "Tika",
    username: "tika",
    email: "tika@marketing.id",
    role: "CREATOR",
    title: "Senior Content Creator & Copywriter",
    roleLabel: "Content Creator",
    badgeColor: "bg-pink-100 text-pink-800 border-pink-300",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    description: "Riset topik tren parenting, susun naskah/copywriting konten",
  },
  {
    id: "usr_shania",
    name: "Shania",
    username: "shania",
    email: "shania@marketing.id",
    role: "CREATOR",
    title: "Creative Director & Video Editor",
    roleLabel: "Creative Director",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    description: "Pengarah visual reels & editing video edukasi anak",
  },
  {
    id: "usr_titin",
    name: "Titin",
    username: "titin",
    email: "titin@marketing.id",
    role: "DESIGNER",
    title: "Graphic & Motion Designer",
    roleLabel: "Motion Designer",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    description: "Layout Canva/Figma, motion animasi & aset grafis PAUD Arjuna",
  },
  {
    id: "usr_cindy",
    name: "Cindy",
    username: "cindy",
    email: "cindy@marketing.id",
    role: "DESIGNER",
    title: "Visual Designer & Packaging",
    roleLabel: "Visual Designer",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    description: "Desain carousel edukatif & penyiapan packaging aset visual",
  },
  {
    id: "usr_anggi",
    name: "Anggi",
    username: "anggi",
    email: "anggi@marketing.id",
    role: "ADMIN",
    title: "Social Media Admin & Publisher",
    roleLabel: "Socmed Admin",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    description: "Publish konten live di IG/TikTok/YT, cantumkan link live & pantau reach",
  },
  {
    id: "usr_lena",
    name: "Lena",
    username: "lena",
    email: "lena@marketing.id",
    role: "ADMIN",
    title: "Community & Engagement Specialist",
    roleLabel: "Engagement Lead",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    description: "Interaksi komentar audiens, balas DM orang tua murid & riset feedback",
  },
  {
    id: "usr_novi",
    name: "Novi",
    username: "novi",
    email: "novi@marketing.id",
    role: "ADMIN",
    title: "Content Distribution & Ads Admin",
    roleLabel: "Ads Specialist",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
    description: "Kelola boosting ads, penjadwalan multi-channel & analisa traffic",
  },
  {
    id: "usr_roshella",
    name: "Roshella",
    username: "roshella",
    email: "roshella@marketing.id",
    role: "ADMIN",
    title: "Quality Control & Review Specialist",
    roleLabel: "Quality Control",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80",
    description: "Final review tata bahasa naskah & kelayakan aset sebelum publish",
  },
];

export function findTeamMember(query: string): TeamMember | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  const username = clean.includes("@") ? clean.split("@")[0] : clean;

  return TEAM_MEMBERS.find((m) => {
    return (
      m.email.toLowerCase() === clean ||
      m.username.toLowerCase() === username ||
      m.name.toLowerCase() === username ||
      m.id.toLowerCase() === clean
    );
  });
}
