"use client";

import React from "react";
import {
  Gauge,
  FolderArchive,
  Wrench,
  Download,
  RotateCcw,
  Sparkles,
  MapPin,
} from "lucide-react";

export type ActiveTab = "optimizer" | "garage" | "tracks" | "presets";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenImportExport: () => void;
  onResetData: () => void;
  totalOwnedParts: number;
  totalOwnedDrivers: number;
  totalTracks: number;
  totalPresets: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenImportExport,
  onResetData,
  totalOwnedParts,
  totalOwnedDrivers,
  totalTracks,
  totalPresets,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#272c38] bg-[#0f1115]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-[#e10600] to-[#990400] text-white shadow-[0_0_15px_rgba(225,6,0,0.4)] border border-[#ff3b30]/50">
              <Gauge className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-tight text-lg sm:text-xl text-white italic font-mono">
                  F1 CLASH
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded bg-[#e10600]/20 text-[#ff4d4d] border border-[#e10600]/40 font-mono">
                  PRO OPTIMIZER
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block font-mono">
                Telemetry & Mathematical Setup Engine
              </p>
            </div>
          </div>

          {/* Navigazione Desktop Principale */}
          <nav className="hidden md:flex items-center gap-1 bg-[#181b22] p-1 rounded-xl border border-[#272c38]">
            <button
              onClick={() => setActiveTab("optimizer")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === "optimizer"
                  ? "bg-[#e10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#272c38]/50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Calcolatore</span>
            </button>

            <button
              onClick={() => setActiveTab("garage")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === "garage"
                  ? "bg-[#e10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#272c38]/50"
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>Garage</span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded font-normal">
                {totalOwnedParts + totalOwnedDrivers}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("tracks")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === "tracks"
                  ? "bg-[#e10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#272c38]/50"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Circuiti</span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded font-normal">
                {totalTracks}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("presets")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === "presets"
                  ? "bg-[#e10600] text-white shadow-[0_0_12px_rgba(225,6,0,0.5)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#272c38]/50"
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>Preset</span>
              <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded font-normal">
                {totalPresets}
              </span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenImportExport}
              title="Backup & Ripristino JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181b22] hover:bg-[#272c38] text-xs font-mono text-zinc-300 border border-[#272c38] hover:border-zinc-500 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#06b6d4]" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            <button
              onClick={onResetData}
              title="Ripristina Dati"
              className="p-2 rounded-lg bg-[#181b22] hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-[#272c38] hover:border-red-500/40 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigazione Mobile */}
      <div className="md:hidden flex items-center justify-around border-t border-[#272c38] bg-[#14171d] px-2 py-1.5">
        <button
          onClick={() => setActiveTab("optimizer")}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all ${
            activeTab === "optimizer" ? "text-[#e10600]" : "text-zinc-400"
          }`}
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span>Calcolatore</span>
        </button>

        <button
          onClick={() => setActiveTab("garage")}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all ${
            activeTab === "garage" ? "text-[#e10600]" : "text-zinc-400"
          }`}
        >
          <Wrench className="w-4 h-4 mb-0.5" />
          <span>Garage</span>
        </button>

        <button
          onClick={() => setActiveTab("tracks")}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all ${
            activeTab === "tracks" ? "text-[#e10600]" : "text-zinc-400"
          }`}
        >
          <MapPin className="w-4 h-4 mb-0.5" />
          <span>Circuiti ({totalTracks})</span>
        </button>

        <button
          onClick={() => setActiveTab("presets")}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all ${
            activeTab === "presets" ? "text-[#e10600]" : "text-zinc-400"
          }`}
        >
          <FolderArchive className="w-4 h-4 mb-0.5" />
          <span>Preset</span>
        </button>
      </div>
    </header>
  );
};
