"use client";

import React, { useState, useMemo } from "react";
import { Part, Driver, Boost, PartCategory, Rarity, CarStats, DriverStats } from "@/types/f1";
import {
  RarityBadge,
  getCategoryIcon,
  getCategoryLabel,
  getRarityClasses,
} from "./RarityBadge";
import { formatDelta } from "@/lib/utils";
import {
  Plus,
  Search,
  Check,
  Layers,
  Zap,
  User,
  Wrench,
  Table,
  LayoutGrid,
  Trash2,
  Edit2,
  Sparkles,
  TrendingUp,
  X,
  AlertCircle,
} from "lucide-react";

interface GarageTabProps {
  parts: Part[];
  drivers: Driver[];
  boosts: Boost[];
  onUpdatePart: (updatedPart: Part) => void;
  onUpdateDriver: (updatedDriver: Driver) => void;
  onUpdateBoost: (updatedBoost: Boost) => void;
  onDeletePart: (id: string) => void;
  onDeleteDriver: (id: string) => void;
  onDeleteBoost: (id: string) => void;
  onOpenAddModal: (type: "part" | "driver" | "boost", item?: Part | Driver | Boost) => void;
}

export const GarageTab: React.FC<GarageTabProps> = ({
  parts,
  drivers,
  boosts,
  onUpdatePart,
  onUpdateDriver,
  onUpdateBoost,
  onDeletePart,
  onDeleteDriver,
  onDeleteBoost,
  onOpenAddModal,
}) => {
  const [activeSection, setActiveSection] = useState<"parts" | "drivers" | "boosts">("parts");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [selectedCategory, setSelectedCategory] = useState<PartCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyOwned, setOnlyOwned] = useState(false);
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedSeries, setSelectedSeries] = useState<string>("all");

  // Stato per l'Upgrade Inline sulla Card (ID dell'elemento in fase di upgrade)
  const [upgradingPartId, setUpgradingPartId] = useState<string | null>(null);
  const [upgradingDriverId, setUpgradingDriverId] = useState<string | null>(null);

  // Valori temporanei del form di Upgrade Rapido
  const [tempPartUpgrade, setTempPartUpgrade] = useState<CarStats | null>(null);
  const [tempDriverUpgrade, setTempDriverUpgrade] = useState<DriverStats | null>(null);

  // Inizia Upgrade Rapido Componente
  const handleStartPartUpgrade = (part: Part) => {
    setUpgradingPartId(part.id);
    setTempPartUpgrade({ ...part.stats });
  };

  const handleConfirmPartUpgrade = (part: Part) => {
    if (!tempPartUpgrade) return;
    onUpdatePart({
      ...part,
      level: part.level + 1,
      previousStats: { ...part.stats },
      stats: { ...tempPartUpgrade },
    });
    setUpgradingPartId(null);
    setTempPartUpgrade(null);
  };

  // Inizia Upgrade Rapido Pilota
  const handleStartDriverUpgrade = (driver: Driver) => {
    setUpgradingDriverId(driver.id);
    setTempDriverUpgrade({ ...driver.stats });
  };

  const handleConfirmDriverUpgrade = (driver: Driver) => {
    if (!tempDriverUpgrade) return;
    onUpdateDriver({
      ...driver,
      level: driver.level + 1,
      previousStats: { ...driver.stats },
      stats: { ...tempDriverUpgrade },
    });
    setUpgradingDriverId(null);
    setTempDriverUpgrade(null);
  };

  // Filtro Componenti
  const filteredParts = useMemo(() => {
    return parts.filter((part) => {
      if (selectedCategory !== "all" && part.category !== selectedCategory) return false;
      if (onlyOwned && !part.owned) return false;
      if (selectedRarity !== "all" && part.rarity !== selectedRarity) return false;
      if (selectedSeries !== "all" && part.series.toString() !== selectedSeries) return false;
      if (
        searchQuery &&
        !part.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !getCategoryLabel(part.category).toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [parts, selectedCategory, onlyOwned, selectedRarity, selectedSeries, searchQuery]);

  // Filtro Piloti
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      if (onlyOwned && !driver.owned) return false;
      if (selectedRarity !== "all" && driver.rarity !== selectedRarity) return false;
      if (selectedSeries !== "all" && driver.series.toString() !== selectedSeries) return false;
      if (
        searchQuery &&
        !driver.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !driver.team.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [drivers, onlyOwned, selectedRarity, selectedSeries, searchQuery]);

  // Filtro Boost
  const filteredBoosts = useMemo(() => {
    return boosts.filter((boost) => {
      if (onlyOwned && !boost.available) return false;
      if (
        searchQuery &&
        !boost.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(boost.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [boosts, onlyOwned, searchQuery]);

  const categories: Array<{ id: PartCategory | "all"; label: string }> = [
    { id: "all", label: "Tutti" },
    { id: "brakes", label: "Freni" },
    { id: "gearbox", label: "Cambio" },
    { id: "rearWing", label: "Alettone Post." },
    { id: "frontWing", label: "Alettone Ant." },
    { id: "suspension", label: "Sospensioni" },
    { id: "engine", label: "Motore" },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Principale */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#181b22] border border-[#272c38]">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#e10600]" />
            <h2 className="text-xl font-mono font-black text-white tracking-tight uppercase">
              Il Mio Garage Personalizzato
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Gestisci il tuo inventario reale 100% personalizzato, esegui Upgrade Rapidi di livello o modifica i valori stile Excel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Schede vs Tabella Excel */}
          <div className="flex items-center bg-[#0f1115] p-1 rounded-xl border border-[#272c38]">
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                viewMode === "cards"
                  ? "bg-[#272c38] text-white shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Schede</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                viewMode === "table"
                  ? "bg-[#06b6d4] text-black shadow font-black"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabella Excel</span>
            </button>
          </div>

          <button
            onClick={() =>
              onOpenAddModal(
                activeSection === "parts" ? "part" : activeSection === "drivers" ? "driver" : "boost"
              )
            }
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#e10600] to-[#b30500] hover:from-[#f00700] hover:to-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo {activeSection === "parts" ? "Componente" : activeSection === "drivers" ? "Pilota" : "Boost"}</span>
          </button>
        </div>
      </div>

      {/* Navigazione Sezioni (Componenti / Piloti / Boost) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#272c38] pb-3">
        <div className="flex items-center gap-2 bg-[#181b22] p-1 rounded-xl border border-[#272c38]">
          <button
            onClick={() => setActiveSection("parts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              activeSection === "parts"
                ? "bg-[#e10600] text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Componenti ({parts.length})</span>
          </button>

          <button
            onClick={() => setActiveSection("drivers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              activeSection === "drivers"
                ? "bg-[#e10600] text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Piloti ({drivers.length})</span>
          </button>

          <button
            onClick={() => setActiveSection("boosts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              activeSection === "boosts"
                ? "bg-[#e10600] text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Boost ({boosts.length})</span>
          </button>
        </div>

        {/* Ricerca */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Cerca per nome o scuderia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181b22] border border-[#272c38] rounded-xl pl-9 pr-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#e10600]"
          />
        </div>
      </div>

      {/* Filtri categoria Componenti */}
      {activeSection === "parts" && (
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-[#272c38] text-white border border-[#e10600]/80 shadow-sm"
                  : "bg-[#181b22] text-zinc-400 hover:text-zinc-200 border border-[#272c38]"
              }`}
            >
              {cat.id !== "all" && getCategoryIcon(cat.id as PartCategory, "w-3.5 h-3.5")}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Filtri secondari */}
      <div className="flex flex-wrap items-center gap-3 bg-[#14171d] p-3 rounded-xl border border-[#272c38] text-xs font-mono">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyOwned}
            onChange={(e) => setOnlyOwned(e.target.checked)}
            className="w-4 h-4 rounded text-[#e10600] bg-[#0f1115] border-[#272c38] focus:ring-0"
          />
          <span className="text-zinc-300">Solo Posseduti</span>
        </label>

        <div className="h-4 w-px bg-[#272c38] hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">Rarità:</span>
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="bg-[#181b22] border border-[#272c38] rounded px-2 py-1 text-zinc-300 text-xs font-mono focus:outline-none focus:border-[#e10600]"
          >
            <option value="all">Tutte</option>
            <option value="Common">Comune</option>
            <option value="Rare">Raro</option>
            <option value="Epic">Epico</option>
            <option value="Legendary">Leggendario</option>
          </select>
        </div>

        {activeSection !== "boosts" && (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Serie:</span>
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="bg-[#181b22] border border-[#272c38] rounded px-2 py-1 text-zinc-300 text-xs font-mono focus:outline-none focus:border-[#e10600]"
            >
              <option value="all">Tutte le Serie</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((s) => (
                <option key={`serie-${s}`} value={s.toString()}>
                  Serie {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: SCHEDE TELEMETRICHE (CARDS VIEW)               */}
      {/* ======================================================== */}
      {viewMode === "cards" && (
        <>
          {/* --- COMPONENTI AUTO --- */}
          {activeSection === "parts" && (
            <>
              {filteredParts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#181b22] border border-[#272c38] space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#e10600]/10 border border-[#e10600]/30 flex items-center justify-center mx-auto text-[#e10600]">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-white uppercase">
                      Nessun componente nel tuo garage
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-1 max-w-md mx-auto">
                      Inizia ad inserire i tuoi componenti reali con le statistiche che vedi su F1 Clash.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenAddModal("part")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi il tuo primo Componente</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredParts.map((part) => {
                    const isUpgrading = upgradingPartId === part.id;
                    const stats = part.stats;

                    return (
                      <div
                        key={part.id}
                        className={`relative p-4 rounded-xl border transition-all ${
                          part.owned
                            ? "bg-[#181b22] border-[#272c38] hover:border-zinc-500"
                            : "bg-[#121419]/70 border-[#202530] opacity-60 hover:opacity-90"
                        }`}
                      >
                        {/* Header Card */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                            {getCategoryIcon(part.category, "w-4 h-4 text-zinc-300")}
                            <span>{getCategoryLabel(part.category)}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              S{part.series}
                            </span>
                            <RarityBadge rarity={part.rarity} />
                          </div>
                        </div>

                        {/* Nome e Posseduto */}
                        <div className="flex items-baseline justify-between mb-3">
                          <h3 className="font-mono font-bold text-base text-white tracking-wide">
                            {part.name}
                          </h3>

                          <button
                            onClick={() => onUpdatePart({ ...part, owned: !part.owned })}
                            className={`flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border transition-all ${
                              part.owned
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                                : "bg-zinc-800 text-zinc-500 border-zinc-700"
                            }`}
                          >
                            <Check className={`w-3 h-3 ${part.owned ? "opacity-100" : "opacity-30"}`} />
                            <span>{part.owned ? "Posseduto" : "Non Posseduto"}</span>
                          </button>
                        </div>

                        {/* Livello & Azioni Rapide */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[#0f1115] border border-[#272c38] mb-3 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Livello:</span>
                            <span className="font-bold text-[#e10600] px-2 py-0.5 bg-[#e10600]/10 rounded border border-[#e10600]/30">
                              Lv. {part.level}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isUpgrading ? (
                              <button
                                onClick={() => handleStartPartUpgrade(part)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Level Up</span>
                              </button>
                            ) : (
                              <span className="text-amber-400 font-bold animate-pulse">
                                Upgrade a Lv. {part.level + 1}
                              </span>
                            )}

                            <button
                              onClick={() => onOpenAddModal("part", part)}
                              title="Modifica completa"
                              className="p-1 rounded bg-[#181b22] hover:bg-[#272c38] text-zinc-300 border border-[#272c38]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Rimuovere il componente "${part.name}" dal garage?`)) {
                                  onDeletePart(part.id);
                                }
                              }}
                              title="Elimina"
                              className="p-1 rounded bg-[#181b22] hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-[#272c38]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* --- PANNELLO NORMALE O UPGRADE RAPIDO INLINE --- */}
                        {!isUpgrading ? (
                          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Velocità</div>
                              <div className="font-bold text-zinc-200">{stats.speed}</div>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Curva</div>
                              <div className="font-bold text-zinc-200">{stats.cornering}</div>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Power Unit</div>
                              <div className="font-bold text-zinc-200">{stats.powerUnit}</div>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Qualifica</div>
                              <div className="font-bold text-zinc-200">{stats.qualifying}</div>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Pit Stop</div>
                              <div className="font-bold text-[#06b6d4]">{stats.pitStopTime}s</div>
                            </div>
                          </div>
                        ) : (
                          tempPartUpgrade && (
                            <div className="p-3 bg-[#0f1115] rounded-xl border border-amber-500/40 space-y-3 animate-in fade-in">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-amber-400 font-bold uppercase">
                                  Digita i nuovi valori (Lv. {part.level + 1}):
                                </span>
                                <button
                                  onClick={() => setUpgradingPartId(null)}
                                  className="text-zinc-500 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                                {[
                                  { label: "Velocità", key: "speed", isPit: false },
                                  { label: "Curva", key: "cornering", isPit: false },
                                  { label: "Power Unit", key: "powerUnit", isPit: false },
                                  { label: "Qualifica", key: "qualifying", isPit: false },
                                  { label: "Pit Stop", key: "pitStopTime", isPit: true },
                                ].map((item) => {
                                  const k = item.key as keyof CarStats;
                                  const currentVal = part.stats[k];
                                  const newVal = tempPartUpgrade[k];
                                  const diff = newVal - currentVal;
                                  const delta = formatDelta(diff, item.isPit);

                                  return (
                                    <div key={item.key} className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                                      <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                                        <span>{item.label}</span>
                                        {!delta.isNeutral && (
                                          <span
                                            className={`font-bold ${
                                              delta.isPositive ? "text-emerald-400" : "text-red-400"
                                            }`}
                                          >
                                            {delta.text}
                                          </span>
                                        )}
                                      </div>
                                      <input
                                        type="number"
                                        step={item.isPit ? "0.01" : "1"}
                                        value={newVal}
                                        onChange={(e) =>
                                          setTempPartUpgrade({
                                            ...tempPartUpgrade,
                                            [k]: Number(e.target.value),
                                          })
                                        }
                                        className="w-full bg-[#0f1115] border border-[#272c38] rounded px-1.5 py-1 text-center font-bold text-white text-xs focus:outline-none focus:border-amber-400"
                                      />
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => setUpgradingPartId(null)}
                                  className="flex-1 py-1.5 rounded-lg bg-[#272c38] text-zinc-300 font-mono text-[11px] uppercase"
                                >
                                  Annulla
                                </button>
                                <button
                                  onClick={() => handleConfirmPartUpgrade(part)}
                                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold text-[11px] uppercase shadow"
                                >
                                  Salva Upgrade
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* --- PILOTI --- */}
          {activeSection === "drivers" && (
            <>
              {filteredDrivers.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#181b22] border border-[#272c38] space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#e10600]/10 border border-[#e10600]/30 flex items-center justify-center mx-auto text-[#e10600]">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-white uppercase">
                      Nessun pilota nel tuo garage
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-1 max-w-md mx-auto">
                      Aggiungi i tuoi piloti reali di F1 Clash inserendo le statistiche attuali.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenAddModal("driver")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi il tuo primo Pilota</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDrivers.map((driver) => {
                    const isUpgrading = upgradingDriverId === driver.id;
                    const stats = driver.stats;
                    const totalScore =
                      stats.overtaking +
                      stats.defending +
                      stats.qualifying +
                      stats.raceStart +
                      stats.tyreManagement;

                    return (
                      <div
                        key={driver.id}
                        className={`relative p-4 rounded-xl border transition-all ${
                          driver.owned
                            ? "bg-[#181b22] border-[#272c38] hover:border-zinc-500"
                            : "bg-[#121419]/70 border-[#202530] opacity-60 hover:opacity-90"
                        }`}
                      >
                        {/* Header Pilota */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                            <span className="text-base">{driver.flag}</span>
                            <span className="text-zinc-300 font-semibold">{driver.team}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              S{driver.series}
                            </span>
                            <RarityBadge rarity={driver.rarity} />
                          </div>
                        </div>

                        {/* Nome e Posseduto */}
                        <div className="flex items-baseline justify-between mb-3">
                          <h3 className="font-mono font-bold text-base text-white tracking-wide">
                            {driver.name}
                          </h3>

                          <button
                            onClick={() => onUpdateDriver({ ...driver, owned: !driver.owned })}
                            className={`flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border transition-all ${
                              driver.owned
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                                : "bg-zinc-800 text-zinc-500 border-zinc-700"
                            }`}
                          >
                            <Check className={`w-3 h-3 ${driver.owned ? "opacity-100" : "opacity-30"}`} />
                            <span>{driver.owned ? "Posseduto" : "Non Posseduto"}</span>
                          </button>
                        </div>

                        {/* Livello & Azioni Rapide */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[#0f1115] border border-[#272c38] mb-3 text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-400">Livello:</span>
                            <span className="font-bold text-[#e10600] px-2 py-0.5 bg-[#e10600]/10 rounded border border-[#e10600]/30">
                              Lv. {driver.level}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isUpgrading ? (
                              <button
                                onClick={() => handleStartDriverUpgrade(driver)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition-all"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Level Up</span>
                              </button>
                            ) : (
                              <span className="text-amber-400 font-bold animate-pulse">
                                Upgrade a Lv. {driver.level + 1}
                              </span>
                            )}

                            <button
                              onClick={() => onOpenAddModal("driver", driver)}
                              title="Modifica completa"
                              className="p-1 rounded bg-[#181b22] hover:bg-[#272c38] text-zinc-300 border border-[#272c38]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Rimuovere il pilota "${driver.name}" dal garage?`)) {
                                  onDeleteDriver(driver.id);
                                }
                              }}
                              title="Elimina"
                              className="p-1 rounded bg-[#181b22] hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-[#272c38]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* --- PANNELLO STATISTICHE PILOTA O UPGRADE --- */}
                        {!isUpgrading ? (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs font-mono">
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Sorp.</div>
                              <div className="font-bold text-zinc-200">{stats.overtaking}</div>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Difesa</div>
                              <div className="font-bold text-zinc-200">{stats.defending}</div>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Qual.</div>
                              <div className="font-bold text-zinc-200">{stats.qualifying}</div>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Part.</div>
                              <div className="font-bold text-zinc-200">{stats.raceStart}</div>
                            </div>
                            <div className="p-1.5 rounded bg-[#0f1115]/60 border border-[#272c38]/60 text-center">
                              <div className="text-[10px] text-zinc-500 uppercase">Gomme</div>
                              <div className="font-bold text-emerald-400">{stats.tyreManagement}</div>
                            </div>
                          </div>
                        ) : (
                          tempDriverUpgrade && (
                            <div className="p-3 bg-[#0f1115] rounded-xl border border-amber-500/40 space-y-3 animate-in fade-in">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-amber-400 font-bold uppercase">
                                  Digita i nuovi valori (Lv. {driver.level + 1}):
                                </span>
                                <button
                                  onClick={() => setUpgradingDriverId(null)}
                                  className="text-zinc-500 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                                {[
                                  { label: "Sorpasso", key: "overtaking" },
                                  { label: "Difesa", key: "defending" },
                                  { label: "Qualifica", key: "qualifying" },
                                  { label: "Partenza", key: "raceStart" },
                                  { label: "Gomme", key: "tyreManagement" },
                                ].map((item) => {
                                  const k = item.key as keyof DriverStats;
                                  const currentVal = driver.stats[k];
                                  const newVal = tempDriverUpgrade[k];
                                  const diff = newVal - currentVal;
                                  const delta = formatDelta(diff);

                                  return (
                                    <div key={item.key} className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                                      <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                                        <span>{item.label}</span>
                                        {!delta.isNeutral && (
                                          <span
                                            className={`font-bold ${
                                              delta.isPositive ? "text-emerald-400" : "text-red-400"
                                            }`}
                                          >
                                            {delta.text}
                                          </span>
                                        )}
                                      </div>
                                      <input
                                        type="number"
                                        value={newVal}
                                        onChange={(e) =>
                                          setTempDriverUpgrade({
                                            ...tempDriverUpgrade,
                                            [k]: Number(e.target.value),
                                          })
                                        }
                                        className="w-full bg-[#0f1115] border border-[#272c38] rounded px-1.5 py-1 text-center font-bold text-white text-xs focus:outline-none focus:border-amber-400"
                                      />
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => setUpgradingDriverId(null)}
                                  className="flex-1 py-1.5 rounded-lg bg-[#272c38] text-zinc-300 font-mono text-[11px] uppercase"
                                >
                                  Annulla
                                </button>
                                <button
                                  onClick={() => handleConfirmDriverUpgrade(driver)}
                                  className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold text-[11px] uppercase shadow"
                                >
                                  Salva Upgrade
                                </button>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* --- BOOST --- */}
          {activeSection === "boosts" && (
            <>
              {filteredBoosts.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-[#181b22] border border-[#272c38] space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#e10600]/10 border border-[#e10600]/30 flex items-center justify-center mx-auto text-[#e10600]">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-mono font-bold text-white uppercase">
                      Nessun boost nel tuo inventario
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mt-1 max-w-md mx-auto">
                      Inserisci i boost posseduti in F1 Clash con i relativi bonus statistici.
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenAddModal("boost")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Aggiungi il tuo primo Boost</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredBoosts.map((boost) => (
                    <div
                      key={boost.id}
                      className="p-4 rounded-xl border bg-[#181b22] border-[#272c38] hover:border-zinc-500 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full shadow-sm"
                            style={{ backgroundColor: boost.color || "#06b6d4" }}
                          />
                          <h3 className="font-mono font-bold text-base text-white">{boost.name}</h3>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
                            Tier {boost.tier}
                          </span>
                          <button
                            onClick={() => onOpenAddModal("boost", boost)}
                            className="p-1 rounded bg-[#0f1115] text-zinc-400 hover:text-white border border-[#272c38]"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Eliminare il boost "${boost.name}"?`)) {
                                onDeleteBoost(boost.id);
                              }
                            }}
                            className="p-1 rounded bg-[#0f1115] text-zinc-400 hover:text-red-400 border border-[#272c38]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {boost.description && (
                        <p className="text-xs text-zinc-400 font-mono mb-3 line-clamp-2">
                          {boost.description}
                        </p>
                      )}

                      {/* Effetti */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {boost.effects.map((eff, idx) => (
                          <span
                            key={`eff-${idx}`}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#0f1115] text-[#06b6d4] border border-[#272c38]"
                          >
                            <span>{eff.stat}</span>
                            <span className="text-emerald-400">
                              {eff.value > 0 ? `+${eff.value}` : `${eff.value}s`}
                            </span>
                          </span>
                        ))}
                      </div>

                      {/* Quantità */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#272c38] text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">Quantità:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={boost.quantity <= 0}
                              onClick={() =>
                                onUpdateBoost({
                                  ...boost,
                                  quantity: Math.max(0, boost.quantity - 1),
                                  available: boost.quantity - 1 > 0,
                                })
                              }
                              className="w-5 h-5 rounded flex items-center justify-center bg-[#0f1115] text-zinc-300 disabled:opacity-30 border border-[#272c38]"
                            >
                              -
                            </button>
                            <span className="font-bold text-white min-w-[20px] text-center">
                              {boost.quantity}
                            </span>
                            <button
                              onClick={() =>
                                onUpdateBoost({
                                  ...boost,
                                  quantity: boost.quantity + 1,
                                  available: true,
                                })
                              }
                              className="w-5 h-5 rounded flex items-center justify-center bg-[#0f1115] text-zinc-300 border border-[#272c38]"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            boost.available
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700"
                          }`}
                        >
                          {boost.available ? "Disponibile" : "Esaurito"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: TABELLA EXCEL (SPREADSHEET INLINE VIEW)         */}
      {/* ======================================================== */}
      {viewMode === "table" && (
        <div className="rounded-2xl bg-[#181b22] border border-[#272c38] overflow-hidden shadow-2xl">
          <div className="p-4 bg-[#14171d] border-b border-[#272c38] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#06b6d4]" />
              <span className="font-bold uppercase text-white">
                Modalità Inserimento Rapido Excel: Modifica i numeri direttamente nelle celle
              </span>
            </div>
            <span className="text-zinc-500 text-[11px]">
              Tutte le modifiche vengono salvate istantaneamente in tempo reale
            </span>
          </div>

          <div className="overflow-x-auto">
            {/* Tabella Componenti */}
            {activeSection === "parts" && (
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-[#0f1115] text-zinc-400 border-b border-[#272c38] text-[11px] uppercase">
                    <th className="p-2.5">Nome</th>
                    <th className="p-2.5">Categoria</th>
                    <th className="p-2.5 w-16 text-center">Serie</th>
                    <th className="p-2.5 w-16 text-center">Lv</th>
                    <th className="p-2.5 w-20 text-center">Velocità</th>
                    <th className="p-2.5 w-20 text-center">Curva</th>
                    <th className="p-2.5 w-20 text-center">Power Unit</th>
                    <th className="p-2.5 w-20 text-center">Qualifica</th>
                    <th className="p-2.5 w-20 text-center text-[#06b6d4]">Pit (s)</th>
                    <th className="p-2.5 w-20 text-center">Posseduto</th>
                    <th className="p-2.5 w-16 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272c38]">
                  {filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-[#1f242e] transition-colors">
                      <td className="p-2">
                        <input
                          type="text"
                          value={part.name}
                          onChange={(e) => onUpdatePart({ ...part, name: e.target.value })}
                          className="w-full bg-transparent px-2 py-1 rounded text-white font-bold border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2">
                        <select
                          value={part.category}
                          onChange={(e) =>
                            onUpdatePart({ ...part, category: e.target.value as PartCategory })
                          }
                          className="bg-transparent text-zinc-300 px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        >
                          <option value="brakes">Freni</option>
                          <option value="gearbox">Cambio</option>
                          <option value="rearWing">Alettone Post.</option>
                          <option value="frontWing">Alettone Ant.</option>
                          <option value="suspension">Sospensioni</option>
                          <option value="engine">Motore</option>
                        </select>
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={part.series}
                          onChange={(e) => onUpdatePart({ ...part, series: Number(e.target.value) })}
                          className="w-12 bg-transparent text-center text-zinc-300 px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={1}
                          max={11}
                          value={part.level}
                          onChange={(e) => onUpdatePart({ ...part, level: Number(e.target.value) })}
                          className="w-12 bg-transparent text-center font-bold text-[#e10600] px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={part.stats.speed}
                          onChange={(e) =>
                            onUpdatePart({
                              ...part,
                              stats: { ...part.stats, speed: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={part.stats.cornering}
                          onChange={(e) =>
                            onUpdatePart({
                              ...part,
                              stats: { ...part.stats, cornering: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={part.stats.powerUnit}
                          onChange={(e) =>
                            onUpdatePart({
                              ...part,
                              stats: { ...part.stats, powerUnit: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={part.stats.qualifying}
                          onChange={(e) =>
                            onUpdatePart({
                              ...part,
                              stats: { ...part.stats, qualifying: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={part.stats.pitStopTime}
                          onChange={(e) =>
                            onUpdatePart({
                              ...part,
                              stats: { ...part.stats, pitStopTime: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center font-bold text-[#06b6d4] px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={part.owned}
                          onChange={(e) => onUpdatePart({ ...part, owned: e.target.checked })}
                          className="w-4 h-4 rounded text-[#e10600] bg-[#0f1115] border-[#272c38]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare il componente "${part.name}"?`)) {
                              onDeletePart(part.id);
                            }
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tabella Piloti */}
            {activeSection === "drivers" && (
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-[#0f1115] text-zinc-400 border-b border-[#272c38] text-[11px] uppercase">
                    <th className="p-2.5">Nome</th>
                    <th className="p-2.5">Scuderia</th>
                    <th className="p-2.5 w-12 text-center">Icona</th>
                    <th className="p-2.5 w-16 text-center">Serie</th>
                    <th className="p-2.5 w-16 text-center">Lv</th>
                    <th className="p-2.5 w-20 text-center">Sorpasso</th>
                    <th className="p-2.5 w-20 text-center">Difesa</th>
                    <th className="p-2.5 w-20 text-center">Qualifica</th>
                    <th className="p-2.5 w-20 text-center">Partenza</th>
                    <th className="p-2.5 w-20 text-center text-emerald-400">Gomme</th>
                    <th className="p-2.5 w-20 text-center">Posseduto</th>
                    <th className="p-2.5 w-16 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272c38]">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-[#1f242e] transition-colors">
                      <td className="p-2">
                        <input
                          type="text"
                          value={driver.name}
                          onChange={(e) => onUpdateDriver({ ...driver, name: e.target.value })}
                          className="w-full bg-transparent px-2 py-1 rounded text-white font-bold border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2">
                        <input
                          type="text"
                          value={driver.team}
                          onChange={(e) => onUpdateDriver({ ...driver, team: e.target.value })}
                          className="w-full bg-transparent text-zinc-300 px-2 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="text"
                          value={driver.flag}
                          onChange={(e) => onUpdateDriver({ ...driver, flag: e.target.value })}
                          className="w-10 bg-transparent text-center text-sm px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={driver.series}
                          onChange={(e) => onUpdateDriver({ ...driver, series: Number(e.target.value) })}
                          className="w-12 bg-transparent text-center text-zinc-300 px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={1}
                          max={11}
                          value={driver.level}
                          onChange={(e) => onUpdateDriver({ ...driver, level: Number(e.target.value) })}
                          className="w-12 bg-transparent text-center font-bold text-[#e10600] px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={driver.stats.overtaking}
                          onChange={(e) =>
                            onUpdateDriver({
                              ...driver,
                              stats: { ...driver.stats, overtaking: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={driver.stats.defending}
                          onChange={(e) =>
                            onUpdateDriver({
                              ...driver,
                              stats: { ...driver.stats, defending: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={driver.stats.qualifying}
                          onChange={(e) =>
                            onUpdateDriver({
                              ...driver,
                              stats: { ...driver.stats, qualifying: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={driver.stats.raceStart}
                          onChange={(e) =>
                            onUpdateDriver({
                              ...driver,
                              stats: { ...driver.stats, raceStart: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={driver.stats.tyreManagement}
                          onChange={(e) =>
                            onUpdateDriver({
                              ...driver,
                              stats: { ...driver.stats, tyreManagement: Number(e.target.value) },
                            })
                          }
                          className="w-16 bg-transparent text-center font-bold text-emerald-400 px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={driver.owned}
                          onChange={(e) => onUpdateDriver({ ...driver, owned: e.target.checked })}
                          className="w-4 h-4 rounded text-[#e10600] bg-[#0f1115] border-[#272c38]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare il pilota "${driver.name}"?`)) {
                              onDeleteDriver(driver.id);
                            }
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Tabella Boost */}
            {activeSection === "boosts" && (
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-[#0f1115] text-zinc-400 border-b border-[#272c38] text-[11px] uppercase">
                    <th className="p-2.5">Nome Boost</th>
                    <th className="p-2.5 w-16 text-center">Tier</th>
                    <th className="p-2.5 w-20 text-center">Quantità</th>
                    <th className="p-2.5">Statistica 1</th>
                    <th className="p-2.5 w-20 text-center">Valore 1</th>
                    <th className="p-2.5">Statistica 2</th>
                    <th className="p-2.5 w-20 text-center">Valore 2</th>
                    <th className="p-2.5 w-24 text-center">Disponibile</th>
                    <th className="p-2.5 w-16 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272c38]">
                  {filteredBoosts.map((boost) => (
                    <tr key={boost.id} className="hover:bg-[#1f242e] transition-colors">
                      <td className="p-2">
                        <input
                          type="text"
                          value={boost.name}
                          onChange={(e) => onUpdateBoost({ ...boost, name: e.target.value })}
                          className="w-full bg-transparent px-2 py-1 rounded text-white font-bold border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={1}
                          max={4}
                          value={boost.tier}
                          onChange={(e) =>
                            onUpdateBoost({
                              ...boost,
                              tier: Number(e.target.value) as 1 | 2 | 3 | 4,
                            })
                          }
                          className="w-12 bg-transparent text-center text-purple-400 font-bold px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min={0}
                          value={boost.quantity}
                          onChange={(e) =>
                            onUpdateBoost({
                              ...boost,
                              quantity: Number(e.target.value),
                              available: Number(e.target.value) > 0,
                            })
                          }
                          className="w-16 bg-transparent text-center font-bold text-white px-1 py-1 rounded border border-transparent hover:border-[#272c38] focus:border-[#e10600] focus:bg-[#0f1115]"
                        />
                      </td>

                      <td className="p-2 text-zinc-300">{boost.effects[0]?.stat || "-"}</td>
                      <td className="p-2 text-center text-emerald-400 font-bold">
                        {boost.effects[0] ? `+${boost.effects[0].value}` : "-"}
                      </td>

                      <td className="p-2 text-zinc-300">{boost.effects[1]?.stat || "-"}</td>
                      <td className="p-2 text-center text-emerald-400 font-bold">
                        {boost.effects[1] ? `+${boost.effects[1].value}` : "-"}
                      </td>

                      <td className="p-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            boost.available
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-zinc-800 text-zinc-500"
                          }`}
                        >
                          {boost.available ? "Sì" : "No"}
                        </span>
                      </td>

                      <td className="p-2 text-center">
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare il boost "${boost.name}"?`)) {
                              onDeleteBoost(boost.id);
                            }
                          }}
                          className="p-1 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Barra inferiore aggiungi rapido */}
          <div className="p-3 bg-[#0f1115] border-t border-[#272c38] flex justify-end">
            <button
              onClick={() =>
                onOpenAddModal(
                  activeSection === "parts" ? "part" : activeSection === "drivers" ? "driver" : "boost"
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272c38] hover:bg-[#323947] text-xs font-mono font-bold text-zinc-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-[#06b6d4]" />
              <span>
                Aggiungi Riga {activeSection === "parts" ? "Componente" : activeSection === "drivers" ? "Pilota" : "Boost"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
