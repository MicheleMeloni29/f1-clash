import React from "react";
import { Rarity, PartCategory } from "@/types/f1";
import {
  CircleDot,
  Settings2,
  Wind,
  Navigation,
  Sliders,
  Flame,
} from "lucide-react";

export function getRarityClasses(rarity: Rarity): {
  badge: string;
  border: string;
  glow: string;
  text: string;
  bg: string;
} {
  switch (rarity) {
    case "Legendary":
      return {
        badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        border: "border-amber-500/50 hover:border-amber-400",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.2)]",
        text: "text-amber-400",
        bg: "bg-amber-950/20",
      };
    case "Epic":
      return {
        badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        border: "border-purple-500/50 hover:border-purple-400",
        glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]",
        text: "text-purple-400",
        bg: "bg-purple-950/20",
      };
    case "Rare":
      return {
        badge: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        border: "border-blue-500/50 hover:border-blue-400",
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]",
        text: "text-blue-400",
        bg: "bg-blue-950/20",
      };
    case "Common":
    default:
      return {
        badge: "bg-zinc-600/20 text-zinc-300 border-zinc-500/40",
        border: "border-zinc-700 hover:border-zinc-500",
        glow: "shadow-none",
        text: "text-zinc-400",
        bg: "bg-zinc-900/30",
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
  }
}

export const RarityBadge: React.FC<{ rarity: Rarity; className?: string }> = ({
  rarity,
  className = "",
}) => {
  const styles = getRarityClasses(rarity);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${styles.badge} ${className}`}
    >
      {rarity}
    </span>
  );
};
