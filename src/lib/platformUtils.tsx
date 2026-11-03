import React from "react";
import {
  Instagram,
  Video,
  Youtube,
  Linkedin,
  Globe,
  Share2,
} from "lucide-react";
import { getStage, STAGE_META } from "./content-utils";

export function getPlatformBadge(platform?: string) {
  switch ((platform || "").toUpperCase()) {
    case "INSTAGRAM":
      return {
        label: "Instagram",
        icon: <Instagram className="w-3.5 h-3.5 text-pink-600" />,
        className: "bg-pink-50 text-pink-700 border-pink-300 font-bold",
        btnColor:
          "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white",
      };
    case "TIKTOK":
      return {
        label: "TikTok",
        icon: <Video className="w-3.5 h-3.5 text-slate-900" />,
        className: "bg-slate-100 text-slate-900 border-slate-300 font-bold",
        btnColor: "bg-slate-900 hover:bg-black text-white",
      };
    case "FACEBOOK":
      return {
        label: "Facebook",
        icon: <Share2 className="w-3.5 h-3.5 text-blue-600" />,
        className: "bg-blue-50 text-blue-800 border-blue-300 font-bold",
        btnColor: "bg-blue-600 hover:bg-blue-700 text-white",
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
        label:
          platform && platform.toUpperCase() !== "WEBSITE"
            ? platform
            : "Website / Lainnya",
        icon: <Globe className="w-3.5 h-3.5 text-emerald-600" />,
        className: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold",
        btnColor: "bg-emerald-600 hover:bg-emerald-500 text-white",
      };
  }
}

export function getStatusBadge(itemOrStatus: any) {
  const item =
    typeof itemOrStatus === "string" ? { status: itemOrStatus } : itemOrStatus;
  const stage = getStage(item);
  const meta = STAGE_META[stage];
  return {
    label: `${meta.emoji} ${meta.label}`,
    className: `${meta.chip} font-black`,
  };
}
