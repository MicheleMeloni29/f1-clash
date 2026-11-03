"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Part,
  Driver,
  Boost,
  Track,
  TrackCharacteristic,
  TRACK_CHARACTERISTICS,
  CalculatedLoadout,
  CustomWeights,
  OptimizationMode,
  LoadoutPreset,
  CarStats,
  DriverStats,
  PartCategory,
} from "@/types/f1";
import {
  runOptimization,
  applyBoostToStats,
  calculateTeamScore,
  getPitstopEstimation,
  PART_CATEGORIES,
} from "@/lib/optimizer";
import { RadarChart } from "./RadarChart";
import {
  RarityBadge,
  getCategoryIcon,
  getCategoryLabel,
} from "./RarityBadge";
import { TrackModal } from "./TrackModal";
import { officialF1Circuits } from "@/lib/initialData";
import {
  Sparkles,
  MapPin,
  Sliders,
  Award,
  Zap,
  BookmarkPlus,
  Gauge,
  Layers,
  Flag,
  Wrench,
  AlertTriangle,
  Settings2,
  Plus,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

interface OptimizerTabProps {
  parts: Part[];
  drivers: Driver[];
  boosts: Boost[];
  tracks: Track[];
  onUpdateTrack: (updatedTrack: Track) => void;
  onSavePreset: (preset: LoadoutPreset) => void;
  calculatedSetup: CalculatedLoadout | null;
  setCalculatedSetup: React.Dispatch<React.SetStateAction<CalculatedLoadout | null>>;
  onNavigateToGarage: () => void;
  onNavigateToTracks: () => void;
}

export const OptimizerTab: React.FC<OptimizerTabProps> = ({
  parts,
  drivers,
  boosts,
  tracks,
  onUpdateTrack,
  onSavePreset,
  calculatedSetup,
  setCalculatedSetup,
  onNavigateToGarage,
  onNavigateToTracks,
}) => {
  const [mode, setMode] = useState<OptimizationMode>("track");
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id || "");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("all");

  const [showBoostedStats, setShowBoostedStats] = useState<boolean>(true);
  const [selectedD1BoostId, setSelectedD1BoostId] = useState<string | undefined>(undefined);
  const [selectedD2BoostId, setSelectedD2BoostId] = useState<string | undefined>(undefined);

  // Modale Modifica Circuito Rapida
  const [isEditTrackOpen, setIsEditTrackOpen] = useState(false);

  // Moltiplicatore / Influenza del Tracciato (1.0x - 3.5x)
  const [trackMultiplier, setTrackMultiplier] = useState<number>(2.0);

  // Feedback Visivo di Calcolo e Sincronizzazione Telemetrica
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<string>("");
  const [calculatedTargetLabel, setCalculatedTargetLabel] = useState<string>("");
  const [pulseGlow, setPulseGlow] = useState<boolean>(false);

  // Pesi Personalizzati
  const [customWeights, setCustomWeights] = useState<CustomWeights>({
    car: {
      speed: 7,
      cornering: 7,
      powerUnit: 7,
      qualifying: 6,
      pitStopTime: 5,
      overtakeMode: 6,
    },
    driver: {
      overtaking: 8,
      defending: 7,
      qualifying: 8,
      raceStart: 7,
      tyreManagement: 7,
    },
    teamScoreCapEnabled: false,
    teamScoreCap: 1100,
  });

  // Modale Salva Preset
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveTag, setSaveTag] = useState("Serie 9");
  const [saveTagColor, setSaveTagColor] = useState("#e10600");
  const [saveNotes, setSaveNotes] = useState("");

  // Lista livelli unici (con Gran Premio sempre in cima se presente)
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => set.add(t.level));
    const arr = Array.from(set);
    return arr.sort((a, b) => {
      if (a.toLowerCase().includes("gran premio")) return -1;
      if (b.toLowerCase().includes("gran premio")) return 1;
      return b.localeCompare(a, undefined, { numeric: true });
    });
  }, [tracks]);

  // Circuiti filtrati
  const filteredTracks = useMemo(() => {
    if (selectedLevelFilter === "all") return tracks;
    return tracks.filter((t) => t.level === selectedLevelFilter);
  }, [tracks, selectedLevelFilter]);

  // Circuito corrente
  const selectedTrack = useMemo(() => {
    return (
      filteredTracks.find((t) => t.id === selectedTrackId) ||
      tracks.find((t) => t.id === selectedTrackId) ||
      filteredTracks[0] ||
      tracks[0]
    );
  }, [tracks, filteredTracks, selectedTrackId]);

  // Aggiorna ID se il filtro esclude l'attuale
  useEffect(() => {
    if (filteredTracks.length > 0 && !filteredTracks.some((t) => t.id === selectedTrackId)) {
      setSelectedTrackId(filteredTracks[0].id);
    }
  }, [filteredTracks, selectedTrackId]);

  // Verifica requisiti minimi per il calcolo (7 categorie auto + 2 piloti)
  const categories = PART_CATEGORIES;
  const missingCategories = categories.filter(
    (cat) => !parts.some((p) => p.owned && p.category === cat)
  );
  const ownedDriversCount = drivers.filter((d) => d.owned).length;
  const isGarageReady = missingCategories.length === 0 && ownedDriversCount >= 2;

  // Esecuzione calcolo setup con animazione di scansione telemetrica
  const triggerCalculation = (showAnimation: boolean = true) => {
    if (!isGarageReady) return;

    if (showAnimation) {
      setIsCalculating(true);
      setPulseGlow(true);
    }

    const result = runOptimization(
      parts,
      drivers,
      boosts,
      mode,
      selectedTrack,
      customWeights,
      trackMultiplier
    );

    if (result) {
      setCalculatedSetup(result);
      setSelectedD1BoostId(result.recommendedBoosts?.driver1.selectedId);
      setSelectedD2BoostId(result.recommendedBoosts?.driver2.selectedId);

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastCalculatedAt(timeStr);

      const target =
        mode === "track" && selectedTrack
          ? `${selectedTrack.name} • ${selectedTrack.level}`
          : mode === "overall"
          ? "Max Score Globale"
          : "Pesi Personalizzati";
      setCalculatedTargetLabel(target);
    }

    if (showAnimation) {
      setTimeout(() => {
        setIsCalculating(false);
      }, 350);
      setTimeout(() => {
        setPulseGlow(false);
      }, 1200);
    }
  };

  useEffect(() => {
    if (isGarageReady) {
      triggerCalculation(true);
    } else {
      setCalculatedSetup(null);
    }
  }, [
    parts,
    drivers,
    boosts,
    isGarageReady,
    selectedTrack?.id,
    selectedTrack?.laps,
    selectedTrack?.stat1,
    selectedTrack?.stat2,
    mode,
    trackMultiplier,
    customWeights,
  ]);

  // Setup attivo con Boost calcolati
  const effectiveSetup = useMemo(() => {
    if (!calculatedSetup) return null;

    const b1 = boosts.find((b) => b.id === selectedD1BoostId);
    const b2 = boosts.find((b) => b.id === selectedD2BoostId);

    const {
      carStats: boostedCar,
      driver1Stats: boostedD1,
      driver2Stats: boostedD2,
    } = applyBoostToStats(
      calculatedSetup.baseCarStats,
      calculatedSetup.baseDriver1Stats,
      calculatedSetup.baseDriver2Stats,
      b1,
      b2
    );

    const scores = calculateTeamScore(boostedCar, boostedD1, boostedD2);

    return {
      ...calculatedSetup,
      driver1Boost: b1,
      driver2Boost: b2,
      boostedCarStats: boostedCar,
      boostedDriver1Stats: boostedD1,
      boostedDriver2Stats: boostedD2,
      boostedTeamScore: scores.total,
    };
  }, [calculatedSetup, selectedD1BoostId, selectedD2BoostId, boosts]);

  // Apertura modale salvataggio preset
  const handleOpenSaveModal = () => {
    if (!effectiveSetup) return;
    const defaultName =
      mode === "track" && selectedTrack
        ? `${selectedTrack.name} (${selectedTrack.level})`
        : "Setup Ottimizzato";
    setSaveName(defaultName);
    setSaveTag(selectedTrack?.level || "Personalizzato");
    setSaveTagColor("#e10600");
    setSaveNotes(
      mode === "track" && selectedTrack
        ? `Assetto calcolato per ${selectedTrack.name} • ${selectedTrack.laps} giri.`
        : "Assetto bilanciato calcolato."
    );
    setIsSaveModalOpen(true);
  };

  const handleConfirmSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSetup) return;

    const newPreset: LoadoutPreset = {
      id: `preset-${Date.now()}`,
      name: saveName.trim() || "Preset Personalizzato",
      tag: saveTag.trim() || "Personalizzato",
      tagColor: saveTagColor,
      parts: {
        brakes: effectiveSetup.parts.brakes.id,
        gearbox: effectiveSetup.parts.gearbox.id,
        rearWing: effectiveSetup.parts.rearWing.id,
        frontWing: effectiveSetup.parts.frontWing.id,
        suspension: effectiveSetup.parts.suspension.id,
        engine: effectiveSetup.parts.engine.id,
        battery: effectiveSetup.parts.battery.id,
      },
      driver1Id: effectiveSetup.driver1.id,
      driver2Id: effectiveSetup.driver2.id,
      driver1BoostId: selectedD1BoostId,
      driver2BoostId: selectedD2BoostId,
      customNotes: saveNotes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSavePreset(newPreset);
    setIsSaveModalOpen(false);
  };

  const currentCarStats = showBoostedStats && effectiveSetup
    ? effectiveSetup.boostedCarStats
    : effectiveSetup?.baseCarStats;

  const currentD1Stats = showBoostedStats && effectiveSetup
    ? effectiveSetup.boostedDriver1Stats
    : effectiveSetup?.baseDriver1Stats;

  const currentD2Stats = showBoostedStats && effectiveSetup
    ? effectiveSetup.boostedDriver2Stats
    : effectiveSetup?.baseDriver2Stats;

  const currentTeamScore = showBoostedStats && effectiveSetup
    ? effectiveSetup.boostedTeamScore
    : effectiveSetup?.baseTeamScore;

  // Stima soste pit stop per il circuito corrente
  const pitEst = selectedTrack ? getPitstopEstimation(selectedTrack.laps) : null;
  const officialCircuit = selectedTrack
    ? officialF1Circuits.find((c) => c.name.toLowerCase() === selectedTrack.name.toLowerCase())
    : null;

  return (
    <div className="space-y-6">
      {/* BANNER AVVISO GARAGE INCOMPLETO */}
      {!isGarageReady && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold uppercase block">Inventario Garage Incompleto per il Calcolo:</span>
              <span className="text-zinc-400">
                {missingCategories.length > 0 &&
                  `Mancano componenti posseduti per: ${missingCategories
                    .map((c) => getCategoryLabel(c))
                    .join(", ")}. `}
                {ownedDriversCount < 2 && `Servono almeno 2 piloti posseduti (attuali: ${ownedDriversCount}).`}
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateToGarage}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold uppercase tracking-wider transition-all whitespace-nowrap self-start sm:self-auto"
          >
            Completa Garage
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* LAYOUT A 2 COLONNE: SINISTRA CONTROLLI, DESTRA TELEMETRIA */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* --- COLONNA SINISTRA: SELETTORE MODALITÀ & CIRCUITO (4/12) --- */}
        <div className="xl:col-span-4 space-y-4">
          <div className="p-5 rounded-2xl bg-[#181b22] border border-[#272c38] shadow-xl space-y-4">
            {/* Header del blocco parametri */}
            <div className="flex items-center justify-between border-b border-[#272c38] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#e10600]" />
                <h3 className="font-mono font-bold text-sm text-white uppercase tracking-tight">
                  Parametri Setup
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                F1 Clash Engine
              </span>
            </div>

            {/* 3 Modalità di Calcolo Compatte */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0f1115] rounded-xl border border-[#272c38] text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setMode("track")}
                className={`py-2 px-1 rounded-lg font-bold uppercase transition-all truncate text-center ${
                  mode === "track"
                    ? "bg-[#e10600] text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Gara Specifica
              </button>
              <button
                type="button"
                onClick={() => setMode("overall")}
                className={`py-2 px-1 rounded-lg font-bold uppercase transition-all truncate text-center ${
                  mode === "overall"
                    ? "bg-[#e10600] text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Max Score
              </button>
              <button
                type="button"
                onClick={() => setMode("custom")}
                className={`py-2 px-1 rounded-lg font-bold uppercase transition-all truncate text-center ${
                  mode === "custom"
                    ? "bg-[#e10600] text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Personalizzati
              </button>
            </div>

            {/* --- SEZIONE CIRCUITO UNIFICATA (MODALITÀ GARA) --- */}
            {mode === "track" && (
              <div className="space-y-3">
                {tracks.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400 font-mono text-xs space-y-2 bg-[#0f1115] rounded-xl border border-[#272c38]">
                    <p>Nessun circuito configurato.</p>
                    <button
                      onClick={onNavigateToTracks}
                      className="px-3 py-1.5 rounded-lg bg-[#e10600] text-white font-bold"
                    >
                      Vai a Gestione Circuiti
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Selettori compatti: Livello e Circuito */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedLevelFilter}
                          onChange={(e) => setSelectedLevelFilter(e.target.value)}
                          className="w-1/3 bg-[#0f1115] border border-[#272c38] rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#e10600]"
                        >
                          <option value="all">Tutti i Livelli</option>
                          {availableLevels.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>

                        <select
                          value={selectedTrack?.id || ""}
                          onChange={(e) => setSelectedTrackId(e.target.value)}
                          className="w-2/3 bg-[#0f1115] border border-[#272c38] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white font-bold focus:outline-none focus:border-[#e10600] truncate"
                        >
                          {filteredTracks.map((trk) => {
                            const match = officialF1Circuits.find(
                              (c) => c.name.toLowerCase() === trk.name.toLowerCase()
                            );
                            const flag = match?.flag ? `${match.flag} ` : "";
                            return (
                              <option key={trk.id} value={trk.id}>
                                [{trk.level}] {flag}{trk.name} ({trk.laps} Giri)
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {/* CARD CIRCUITO UNIFICATA & BADGE STRATEGICO */}
                    {selectedTrack && (
                      <div className="p-3.5 rounded-xl bg-[#0f1115] border border-[#272c38] space-y-3">
                        {/* Intestazione Circuito */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {officialCircuit?.flag || "🏎️"}
                            </span>
                            <div>
                              <h4 className="font-mono font-bold text-sm text-white tracking-wide">
                                {selectedTrack.name}
                              </h4>
                              <span className="text-[10px] font-mono text-zinc-400">
                                {selectedTrack.level}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => setIsEditTrackOpen(true)}
                            title="Modifica rapida parametri circuito"
                            className="p-1.5 rounded-lg bg-[#181b22] hover:bg-[#272c38] text-amber-300 border border-amber-500/30 transition-all"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Metriche Chiave: Giri + Finestra Pit Stop */}
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div className="p-2 rounded-lg bg-[#181b22] border border-[#272c38]">
                            <span className="text-[10px] text-zinc-500 uppercase block">Giri Gara</span>
                            <span className="font-bold text-white text-sm">{selectedTrack.laps} Giri</span>
                          </div>

                          <div className="p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/30">
                            <span className="text-[10px] text-cyan-400 uppercase block font-bold">Pit Stop</span>
                            <span className="font-bold text-cyan-200 text-sm">
                              {pitEst?.label || "1-2 soste"}
                            </span>
                          </div>
                        </div>

                        {/* Le 2 Statistiche Paritarie con Badge Moltiplicatore */}
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-mono text-zinc-400 uppercase flex items-center justify-between">
                            <span>Statistiche Chiave (Peso Paritario):</span>
                            <span className="text-amber-400 font-bold">{trackMultiplier.toFixed(1)}x</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {(() => {
                              const s1Meta = TRACK_CHARACTERISTICS[selectedTrack.stat1] || {
                                label: selectedTrack.stat1,
                                color: "#3b82f6",
                              };
                              const s2Meta = TRACK_CHARACTERISTICS[selectedTrack.stat2] || {
                                label: selectedTrack.stat2,
                                color: "#a855f7",
                              };
                              return (
                                <>
                                  <div
                                    className="p-2 rounded-lg bg-[#181b22] border flex items-center gap-1.5 truncate"
                                    style={{ borderColor: `${s1Meta.color}50` }}
                                  >
                                    <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: s1Meta.color }} />
                                    <span className="text-xs font-mono font-bold text-white truncate">
                                      {s1Meta.label}
                                    </span>
                                  </div>

                                  <div
                                    className="p-2 rounded-lg bg-[#181b22] border flex items-center gap-1.5 truncate"
                                    style={{ borderColor: `${s2Meta.color}50` }}
                                  >
                                    <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: s2Meta.color }} />
                                    <span className="text-xs font-mono font-bold text-white truncate">
                                      {s2Meta.label}
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Note circuito se presenti */}
                        {selectedTrack.notes && (
                          <p className="text-[11px] font-mono text-zinc-400 bg-[#181b22] p-2 rounded-lg border border-[#272c38] italic">
                            &ldquo;{selectedTrack.notes}&rdquo;
                          </p>
                        )}

                        {/* Slider Influenza Pista */}
                        <div className="pt-2 border-t border-[#272c38] space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-zinc-400">Peso Pista:</span>
                            <div className="flex items-center gap-1">
                              {[1.0, 1.5, 2.0, 2.5, 3.0].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setTrackMultiplier(val)}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                    Math.abs(trackMultiplier - val) < 0.05
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                                      : "bg-[#181b22] text-zinc-400 hover:text-white"
                                  }`}
                                >
                                  {val.toFixed(1)}x
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            type="range"
                            min={1.0}
                            max={3.5}
                            step={0.1}
                            value={trackMultiplier}
                            onChange={(e) => setTrackMultiplier(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* --- SEZIONE PESI PERSONALIZZATI (MODALITÀ CUSTOM) --- */}
            {mode === "custom" && (
              <div className="p-3.5 rounded-xl bg-[#0f1115] border border-[#272c38] space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-[#272c38]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={customWeights.teamScoreCapEnabled}
                      onChange={(e) =>
                        setCustomWeights({
                          ...customWeights,
                          teamScoreCapEnabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#e10600] bg-[#181b22] border-[#272c38]"
                    />
                    <span className="text-amber-400 font-bold">Tetto Max TS:</span>
                  </label>

                  {customWeights.teamScoreCapEnabled && (
                    <input
                      type="number"
                      min={400}
                      max={2000}
                      step={10}
                      value={customWeights.teamScoreCap}
                      onChange={(e) =>
                        setCustomWeights({
                          ...customWeights,
                          teamScoreCap: Number(e.target.value),
                        })
                      }
                      className="w-20 bg-[#181b22] border border-[#e10600] rounded px-2 py-0.5 font-bold text-white text-center"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Velocità", key: "speed" },
                    { label: "Curva", key: "cornering" },
                    { label: "Power Unit", key: "powerUnit" },
                    { label: "Qualifica Auto", key: "qualifying" },
                    { label: "Pit Stop", key: "pitStopTime" },
                    { label: "⚡ Overtake", key: "overtakeMode" },
                  ].map((item) => {
                    const k = item.key as keyof CarStats;
                    const val = customWeights.car[k];
                    return (
                      <div key={item.key} className="p-2 rounded bg-[#181b22] border border-[#272c38]">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-zinc-400 truncate">{item.label}</span>
                          <span className="font-bold text-[#e10600]">{val}</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={val}
                          onChange={(e) =>
                            setCustomWeights({
                              ...customWeights,
                              car: { ...customWeights.car, [k]: Number(e.target.value) },
                            })
                          }
                          className="w-full accent-[#e10600] cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottone Primario Calcola Setup */}
            <button
              disabled={!isGarageReady || isCalculating}
              onClick={() => triggerCalculation(true)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e10600] to-[#b30500] hover:from-[#f00700] hover:to-[#c50500] text-white font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(225,6,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Ricalcolo Telemetria...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{lastCalculatedAt ? "Ricalcola Setup" : "Calcola Setup Ottimale"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* --- COLONNA DESTRA: TELEMETRIA UNIFICATA & LOADOUT (8/12) --- */}
        <div
          className={`xl:col-span-8 space-y-5 transition-all duration-300 ${
            isCalculating ? "opacity-60 scale-[0.995]" : "opacity-100 scale-100"
          }`}
        >
          {!effectiveSetup ? (
            <div className="p-12 text-center rounded-2xl bg-[#181b22] border border-[#272c38] text-zinc-400 font-mono text-sm space-y-3 shadow-xl">
              <div className="w-12 h-12 rounded-full bg-[#e10600]/10 border border-[#e10600]/30 flex items-center justify-center mx-auto text-[#e10600]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white uppercase">
                In Attesa di Calcolo Setup
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Seleziona i parametri a sinistra e premi &quot;Calcola Setup Ottimale&quot; per visualizzare l&apos;assetto matematico perfetto.
              </p>
            </div>
          ) : (
            <>
              {/* BANNER RISULTATO TELEMETRICO: TEAM SCORE & AZIONI */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#181b22] border border-[#272c38] shadow-xl space-y-4">
                {/* BADGE DI STATO SINCRONIZZAZIONE TELEMETRICA */}
                {lastCalculatedAt && (
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#272c38]/60">
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all duration-300 ${
                        pulseGlow
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                          : "bg-[#0f1115] text-zinc-300 border border-[#272c38]"
                      }`}
                    >
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            isCalculating ? "bg-amber-400" : "bg-emerald-400"
                          }`}
                        />
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${
                            isCalculating ? "bg-amber-400" : "bg-emerald-500"
                          }`}
                        />
                      </span>
                      <span>
                        {isCalculating
                          ? "Ricalcolo telemetria in corso..."
                          : `⚡ Assetto Sincronizzato: [${calculatedTargetLabel}]`}
                      </span>
                      <span className="text-zinc-500 text-[10px] font-normal">
                        • ore {lastCalculatedAt}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400/80 uppercase tracking-widest hidden sm:inline">
                      Live Telemetry OK
                    </span>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Team score counter */}
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">
                        Team Score Complessivo
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-3xl sm:text-4xl font-mono font-black tracking-tight transition-colors duration-300 ${
                            pulseGlow ? "text-emerald-400" : "text-white"
                          }`}
                        >
                          {currentTeamScore}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-500 uppercase">TS</span>
                        {showBoostedStats && effectiveSetup.boostedTeamScore > effectiveSetup.baseTeamScore && (
                          <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                            +{effectiveSetup.boostedTeamScore - effectiveSetup.baseTeamScore} Boost
                          </span>
                        )}
                      </div>
                    </div>

                  <div className="h-8 w-px bg-[#272c38] hidden sm:block" />

                  {/* Dettaglio Break Down */}
                  <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-zinc-400">
                    <div>
                      <span className="text-[10px] block text-zinc-500 uppercase">Auto</span>
                      <span className="font-bold text-zinc-200">
                        {effectiveSetup.scoreBreakdown.carScore}
                      </span>
                    </div>
                    <span>+</span>
                    <div>
                      <span className="text-[10px] block text-zinc-500 uppercase">P1</span>
                      <span className="font-bold text-zinc-200">
                        {effectiveSetup.scoreBreakdown.driver1Score}
                      </span>
                    </div>
                    <span>+</span>
                    <div>
                      <span className="text-[10px] block text-zinc-500 uppercase">P2</span>
                      <span className="font-bold text-zinc-200">
                        {effectiveSetup.scoreBreakdown.driver2Score}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Toggle Boost & Salva Preset */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowBoostedStats(!showBoostedStats)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold uppercase transition-all ${
                      showBoostedStats
                        ? "bg-purple-950/40 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                        : "bg-[#0f1115] text-zinc-400 border-[#272c38] hover:text-white"
                    }`}
                  >
                    <Zap className={`w-3.5 h-3.5 ${showBoostedStats ? "text-purple-400 fill-purple-400" : ""}`} />
                    <span>{showBoostedStats ? "Boost ON" : "Boost OFF"}</span>
                  </button>

                  <button
                    onClick={handleOpenSaveModal}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Salva Preset</span>
                  </button>
                </div>
              </div>
            </div>

              {/* SEZIONE AUTO: RADAR CHART SULLE PRESTAZIONI VETTURA (SENZA CASELLE DOPPIE SOTTO) */}
              <div className="p-5 rounded-2xl bg-[#181b22] border border-[#272c38] shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#272c38] pb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#e10600]" />
                    <h3 className="font-mono font-bold text-sm text-white uppercase tracking-tight">
                      Impronta Telemetrica Vettura
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    6 Parametri Auto (Valori diretti sui vertici)
                  </span>
                </div>

                <div className="flex justify-center py-2">
                  {currentCarStats && (
                    <RadarChart
                      statsA={currentCarStats}
                      labelA={showBoostedStats ? "Setup + Boost" : "Setup Base"}
                      colorA="#e10600"
                      size={280}
                    />
                  )}
                </div>
              </div>

              {/* SEZIONE 7 COMPONENTI OTTIMALI */}
              <div className="p-5 rounded-2xl bg-[#181b22] border border-[#272c38] shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#272c38] pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#e10600]" />
                    <h3 className="font-mono font-bold text-sm text-white uppercase tracking-tight">
                      Assetto 7 Componenti
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Garage Ottimizzato
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {categories.map((cat) => {
                    const part = effectiveSetup.parts[cat];
                    if (!part) return null;
                    return (
                      <div
                        key={cat}
                        className="p-3 rounded-xl bg-[#0f1115] border border-[#272c38] flex flex-col justify-between hover:border-zinc-500 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono mb-1">
                            <span className="flex items-center gap-1 truncate">
                              {getCategoryIcon(cat, "w-3 h-3 text-zinc-300 shrink-0")}
                              <span className="truncate">{getCategoryLabel(cat)}</span>
                            </span>
                          </div>

                          <h4 className="font-mono font-bold text-xs text-white truncate mb-1" title={part.name}>
                            {part.name}
                          </h4>

                          <RarityBadge rarity={part.rarity} />

                          {/* Motivazione Telemetrica: perché è stato scelto */}
                          {(() => {
                            if (mode === "track" && selectedTrack) {
                              const s1 = selectedTrack.stat1;
                              const s2 = selectedTrack.stat2;
                              const statMap: Record<string, { label: string; val: number }> = {
                                speed: { label: "Velocità", val: part.stats.speed },
                                cornering: { label: "Curva", val: part.stats.cornering },
                                powerUnit: { label: "Power Unit", val: part.stats.powerUnit },
                              };
                              const relevant = [s1, s2].filter((s) => statMap[s]);
                              if (relevant.length > 0) {
                                relevant.sort((a, b) => statMap[b].val - statMap[a].val);
                                const best = statMap[relevant[0]];
                                return (
                                  <div className="mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-400 flex items-center justify-between">
                                    <span className="truncate">⭐ {best.label}</span>
                                    <span>{best.val}</span>
                                  </div>
                                );
                              }
                            }
                            return null;
                          })()}

                          {cat === "battery" && (
                            <div className="mt-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[9px] font-mono font-bold text-amber-400 flex items-center justify-between">
                              <span>⚡ Overtake</span>
                              <span>+{part.stats.overtakeMode ?? 0}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#272c38] text-[10px] font-mono">
                          <span className="text-zinc-500">S{part.series}</span>
                          <span className="text-[#e10600] font-bold">Lv. {part.level}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEZIONE 2 PILOTI 'ALL-IN-ONE' CON SLOT BOOST INTEGRATO */}
              <div className="p-5 rounded-2xl bg-[#181b22] border border-[#272c38] shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#272c38] pb-3">
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-[#e10600]" />
                    <h3 className="font-mono font-bold text-sm text-white uppercase tracking-tight">
                      Coppia Piloti & Slot Boost
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    Seleziona o Cambia Boost Direttamente sulla Card
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CARD PILOTA 1 */}
                  <div className="p-4 rounded-xl bg-[#0f1115] border border-[#272c38] space-y-3">
                    {/* Header Pilota 1 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{effectiveSetup.driver1.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-mono font-bold text-sm text-white">
                              {effectiveSetup.driver1.name}
                            </h4>
                            <RarityBadge rarity={effectiveSetup.driver1.rarity} />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-400">
                            {effectiveSetup.driver1.team ? `${effectiveSetup.driver1.team} • ` : ""}
                            Lv. {effectiveSetup.driver1.level} (Serie {effectiveSetup.driver1.series})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          if (mode === "track" && selectedTrack) {
                            const dStats = effectiveSetup.driver1.stats;
                            const dMap: Record<string, { label: string; val: number }> = {
                              overtaking: { label: "Sorp", val: dStats.overtaking },
                              defending: { label: "Dif", val: dStats.defending },
                              raceStart: { label: "Part", val: dStats.raceStart },
                              tyreManagement: { label: "Gomme", val: dStats.tyreManagement },
                              qualifying: { label: "Qual", val: dStats.qualifying },
                            };
                            const s1 = selectedTrack.stat1;
                            const s2 = selectedTrack.stat2;
                            const matches = [s1, s2].filter((s) => dMap[s]);
                            if (matches.length > 0) {
                              matches.sort((a, b) => dMap[b].val - dMap[a].val);
                              const b = dMap[matches[0]];
                              return (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ⭐ {b.label}: {b.val}
                                </span>
                              );
                            } else {
                              const b = selectedTrack.laps >= 7 ? dMap.tyreManagement : dMap.qualifying;
                              return (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  ⭐ {b.label}: {b.val}
                                </span>
                              );
                            }
                          }
                          return null;
                        })()}
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase px-2 py-0.5 rounded bg-[#181b22] border border-[#272c38]">
                          1° Pilota
                        </span>
                      </div>
                    </div>

                    {/* Statistiche Pilota 1 */}
                    {currentD1Stats && (
                      <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-mono">
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">SORP</span>
                          <span className="font-bold text-zinc-200">{currentD1Stats.overtaking}</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">DIF</span>
                          <span className="font-bold text-zinc-200">{currentD1Stats.defending}</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">QUAL</span>
                          <span className="font-bold text-zinc-200">{currentD1Stats.qualifying}</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">PART</span>
                          <span className="font-bold text-zinc-200">{currentD1Stats.raceStart}</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">GOMME</span>
                          <span className="font-bold text-emerald-400">{currentD1Stats.tyreManagement}</span>
                        </div>
                      </div>
                    )}

                    {/* SLOT BOOST INTEGRATO PILOTA 1 */}
                    <div className="p-2.5 rounded-lg bg-[#181b22] border border-purple-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[10px] text-purple-400 font-bold uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>Slot Boost Consigliato</span>
                        </span>
                        {effectiveSetup.driver1Boost && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Qtà: {effectiveSetup.driver1Boost.quantity}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={selectedD1BoostId || ""}
                          onChange={(e) => setSelectedD1BoostId(e.target.value || undefined)}
                          className="flex-1 bg-[#0f1115] border border-[#272c38] rounded-lg px-2.5 py-1.5 text-xs font-mono text-purple-200 font-bold focus:outline-none focus:border-purple-400"
                        >
                          <option value="">Nessun Boost Selezionato</option>
                          {boosts
                            .filter((b) => b.available && b.quantity > 0)
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} (Tier {b.tier} • {b.quantity} rimasti)
                              </option>
                            ))}
                        </select>
                      </div>

                      {effectiveSetup.driver1Boost && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {effectiveSetup.driver1Boost.effects.map((eff, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold"
                            >
                              +{eff.value} {eff.stat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CARD PILOTA 2 */}
                  <div className="p-4 rounded-xl bg-[#0f1115] border border-[#272c38] space-y-3">
                    {/* Header Pilota 2 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{effectiveSetup.driver2.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-mono font-bold text-sm text-white">
                              {effectiveSetup.driver2.name}
                            </h4>
                            <RarityBadge rarity={effectiveSetup.driver2.rarity} />
                          </div>
                          <p className="text-[10px] font-mono text-zinc-400">
                            {effectiveSetup.driver2.team ? `${effectiveSetup.driver2.team} • ` : ""}
                            Lv. {effectiveSetup.driver2.level} (Serie {effectiveSetup.driver2.series})
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          if (mode === "track" && selectedTrack) {
                            const dStats = effectiveSetup.driver2.stats;
                            const dMap: Record<string, { label: string; val: number }> = {
                              overtaking: { label: "Sorp", val: dStats.overtaking },
                              defending: { label: "Dif", val: dStats.defending },
                              raceStart: { label: "Part", val: dStats.raceStart },
                              tyreManagement: { label: "Gomme", val: dStats.tyreManagement },
                              qualifying: { label: "Qual", val: dStats.qualifying },
                            };
                            const s1 = selectedTrack.stat1;
                            const s2 = selectedTrack.stat2;
                            const matches = [s1, s2].filter((s) => dMap[s]);
                            if (matches.length > 0) {
                              matches.sort((a, b) => dMap[b].val - dMap[a].val);
                              const b = dMap[matches[0]];
                              return (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ⭐ {b.label}: {b.val}
                                </span>
                              );
                            } else {
                              const b = selectedTrack.laps >= 7 ? dMap.tyreManagement : dMap.qualifying;
                              return (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  ⭐ {b.label}: {b.val}
                                </span>
                              );
                            }
                          }
                          return null;
                        })()}
                        <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase px-2 py-0.5 rounded bg-[#181b22] border border-[#272c38]">
                          2° Pilota
                        </span>
                      </div>
                    </div>

                    {/* Statistiche Pilota 2 */}
                    {currentD2Stats && (
                      <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-mono">
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">SORP</span>
                          <span className="font-bold text-zinc-200">{currentD2Stats.overtaking}</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">DIF</span>
                          <span className="font-bold text-zinc-200">{currentD2Stats.defending}</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">QUAL</span>
                          <span className="font-bold text-zinc-200">{currentD2Stats.qualifying}</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">PART</span>
                          <span className="font-bold text-zinc-200">{currentD2Stats.raceStart}</span>
                        </div>
                        <div className="p-1.5 rounded bg-[#181b22] border border-[#272c38]">
                          <span className="text-[9px] text-zinc-500 block">GOMME</span>
                          <span className="font-bold text-emerald-400">{currentD2Stats.tyreManagement}</span>
                        </div>
                      </div>
                    )}

                    {/* SLOT BOOST INTEGRATO PILOTA 2 */}
                    <div className="p-2.5 rounded-lg bg-[#181b22] border border-purple-500/30 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[10px] text-purple-400 font-bold uppercase flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          <span>Slot Boost Consigliato</span>
                        </span>
                        {effectiveSetup.driver2Boost && (
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Qtà: {effectiveSetup.driver2Boost.quantity}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={selectedD2BoostId || ""}
                          onChange={(e) => setSelectedD2BoostId(e.target.value || undefined)}
                          className="flex-1 bg-[#0f1115] border border-[#272c38] rounded-lg px-2.5 py-1.5 text-xs font-mono text-purple-200 font-bold focus:outline-none focus:border-purple-400"
                        >
                          <option value="">Nessun Boost Selezionato</option>
                          {boosts
                            .filter((b) => b.available && b.quantity > 0)
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name} (Tier {b.tier} • {b.quantity} rimasti)
                              </option>
                            ))}
                        </select>
                      </div>

                      {effectiveSetup.driver2Boost && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {effectiveSetup.driver2Boost.effects.map((eff, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold"
                            >
                              +{eff.value} {eff.stat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modale Salva Preset */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#181b22] border border-[#272c38] rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <BookmarkPlus className="w-5 h-5 text-[#e10600]" />
              <h3 className="text-base font-mono font-bold uppercase text-white">
                Salva Setup come Preset
              </h3>
            </div>

            <form onSubmit={handleConfirmSavePreset} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-400 mb-1">Nome Preset</label>
                <input
                  type="text"
                  required
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Tag / Categoria</label>
                  <input
                    type="text"
                    value={saveTag}
                    onChange={(e) => setSaveTag(e.target.value)}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Colore Tag</label>
                  <input
                    type="color"
                    value={saveTagColor}
                    onChange={(e) => setSaveTagColor(e.target.value)}
                    className="w-full h-10 bg-[#0f1115] border border-[#272c38] rounded-lg p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Note Tattiche</label>
                <textarea
                  rows={3}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg p-2 text-white focus:outline-none focus:border-[#e10600]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#272c38] text-zinc-300 font-bold uppercase"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#e10600] text-white font-bold uppercase shadow-lg"
                >
                  Conferma e Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Modifica Rapida Circuito Selezionato */}
      {selectedTrack && (
        <TrackModal
          isOpen={isEditTrackOpen}
          onClose={() => setIsEditTrackOpen(false)}
          editingTrack={selectedTrack}
          onSaveTrack={onUpdateTrack}
        />
      )}
    </div>
  );
};
