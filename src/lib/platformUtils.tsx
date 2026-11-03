import React from "react";
import {
  Instagram,
  Video,
  Youtube,
  Linkedin,
  Globe,
} from "lucide-react";

export function getPlatformBadge(platform: string) {
  switch (platform.toUpperCase()) {
    case "INSTAGRAM":
      return {
        label: "Instagram",
        icon: <Instagram className="w-3.5 h-3.5 text-pink-600" />,
        className: "bg-pink-50 text-pink-700 border-pink-300 font-bold",
        btnColor: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white",
      };
    case "TIKTOK":
      return {
        label: "TikTok",
        icon: <Video className="w-3.5 h-3.5 text-slate-900" />,
        className: "bg-slate-100 text-slate-900 border-slate-300 font-bold",
        btnColor: "bg-slate-900 hover:bg-black text-white",
      };
    case "YOUTUBE":
      return {
        label: "YouTube",
        icon: <Youtube className="w-3.5 h-3.5 text-rose-600" />,
        className: "bg-rose-50 text-rose-700 border-rose-300 font-bold",
        btnColor: "bg-rose-600 hover:bg-rose-500 text-white",
      };
    case "LINKEDIN":
      return {
        label: "LinkedIn",
        icon: <Linkedin className="w-3.5 h-3.5 text-blue-700" />,
        className: "bg-blue-50 text-blue-700 border-blue-300 font-bold",
        btnColor: "bg-blue-600 hover:bg-blue-500 text-white",
      };
    case "WEBSITE":
    default:
      return {
        label: platform || "Website",
        icon: <Globe className="w-3.5 h-3.5 text-emerald-600" />,
        className: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold",
        btnColor: "bg-emerald-600 hover:bg-emerald-500 text-white",
      };
  }
}

export function getStatusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case "RAW_MATERIAL":
    case "IDEA":
      return {
        label: "📁 Bahan Mentah",
        className: "bg-indigo-50 text-indigo-800 border-indigo-300 font-black",
      };
    case "IN_EDITING":
    case "IN_PREPARATION":
      return {
        label: "🎨 Sedang Diedit",
        className: "bg-amber-50 text-amber-800 border-amber-300 font-black",
      };
    case "NEED_REVISION":
    case "IN_REVIEW":
      return {
        label: "🔁 Perlu Revisi",
        className: "bg-rose-50 text-rose-800 border-rose-300 font-black",
      };
    case "READY_TO_PUBLISH":
      return {
        label: "🚀 Siap Upload",
        className: "bg-blue-50 text-blue-800 border-blue-300 font-black",
      };
    case "PUBLISHED":
      return {
        label: "🎉 Sudah Live!",
        className: "bg-emerald-100 text-emerald-800 border-emerald-400 font-black",
      };
    default:
      return {
        label: status || "Draft",
        className: "bg-slate-100 text-slate-700 border-slate-300 font-bold",
      };
  }
}
