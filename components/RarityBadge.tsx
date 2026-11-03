import React from "react";
import { Rarity, PartCategory } from "@/types/f1";
import {
  CircleDot,
  Settings2,
  Wind,
  Navigation,
  Sliders,
  Flame,
  BatteryCharging,
} from "lucide-react";

export function getRarityLabel(rarity: Rarity): string {
  switch (rarity) {
    case "Legendary":
      return "Leggendario";
    case "Epic":
      return "Epico";
    case "Rare":
      return "Raro";
    case "Common":
    default:
      return "Comune";
  }
}

export function getRarityClasses(rarity: Rarity): {
  badge: string;
  border: string;
  glow: string;
  text: string;
  bg: string;
  accent: string;
} {
  switch (rarity) {
    case "Legendary":
      // Beige / Sabbia dorata calda (Leggendario)
      return {
        badge: "bg-[#ecd9b9]/20 text-[#f5e6c8] border-[#ecd9b9]/50 shadow-[0_0_8px_rgba(236,217,185,0.2)]",
        border: "border-[#ecd9b9]/50 hover:border-[#f5e6c8]",
        glow: "shadow-[0_0_15px_rgba(236,217,185,0.25)]",
        text: "text-[#f5e6c8]",
        bg: "bg-[#ecd9b9]/10",
        accent: "#ecd9b9",
      };
    case "Epic":
      // Viola (Epico)
      return {
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]",
        border: "border-purple-500/50 hover:border-purple-400",
        glow: "shadow-[0_0_15px_rgba(168,85,247,0.25)]",
        text: "text-purple-400",
        bg: "bg-purple-950/20",
        accent: "#a855f7",
      };
    case "Rare":
      // Arancio (Raro)
      return {
        badge: "bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.2)]",
        border: "border-orange-500/50 hover:border-orange-400",
        glow: "shadow-[0_0_15px_rgba(249,115,22,0.25)]",
        text: "text-orange-400",
        bg: "bg-orange-950/20",
        accent: "#f97316",
      };
    case "Common":
    default:
      // Azzurro (Comune)
      return {
        badge: "bg-sky-500/20 text-sky-300 border-sky-400/50 shadow-[0_0_8px_rgba(56,189,248,0.2)]",
        border: "border-sky-500/40 hover:border-sky-400",
        glow: "shadow-[0_0_15px_rgba(56,189,248,0.2)]",
        text: "text-sky-400",
        bg: "bg-sky-950/20",
        accent: "#38bdf8",
      };
  }
}

export function getCategoryLabel(cat: PartCategory): string {
  switch (cat) {
    case "brakes":
      return "Freni";
    case "gearbox":
      return "Cambio";
    case "rearWing":
      return "Alettone Posteriore";
    case "frontWing":
      return "Alettone Anteriore";
    case "suspension":
      return "Sospensioni";
    case "engine":
      return "Motore";
    case "battery":
      return "Batteria";
  }
}

export function getCategoryIcon(cat: PartCategory, className = "w-4 h-4") {
  switch (cat) {
    case "brakes":
      return <CircleDot className={className} />;
    case "gearbox":
      return <Settings2 className={className} />;
    case "rearWing":
      return <Wind className={className} />;
    case "frontWing":
      return <Navigation className={className} />;
    case "suspension":
      return <Sliders className={className} />;
    case "engine":
      return <Flame className={className} />;
    case "battery":
      return <BatteryCharging className={className} />;
  }
}

export const RarityBadge: React.FC<{ rarity: Rarity; className?: string }> = ({
  rarity,
  className = "",
}) => {
  const styles = getRarityClasses(rarity);
  const label = getRarityLabel(rarity);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${styles.badge} ${className}`}
    >
      {label}
    </span>
  );
};
