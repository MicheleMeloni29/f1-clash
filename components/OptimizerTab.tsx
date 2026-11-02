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
import { runOptimization, applyBoostToStats, calculateTeamScore } from "@/lib/optimizer";
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
  CheckCircle2,
  Info,
  Layers,
  Flag,
  Wrench,
  AlertTriangle,
  Settings2,
  Plus,
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

  // Pesi Personalizzati
  const [customWeights, setCustomWeights] = useState<CustomWeights>({
    car: {
      speed: 7,
      cornering: 7,
      powerUnit: 7,
      qualifying: 6,
      pitStopTime: 5,
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

  // Lista di tutti i livelli presenti nei tracciati (con Gran Premio sempre in cima se presente)
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

  // Seleziona il circuito corrente
  const selectedTrack = useMemo(() => {
    return (
      filteredTracks.find((t) => t.id === selectedTrackId) ||
      tracks.find((t) => t.id === selectedTrackId) ||
      filteredTracks[0] ||
      tracks[0]
    );
  }, [tracks, filteredTracks, selectedTrackId]);

  // Aggiorna l'ID selezionato se il filtro esclude l'attuale
  useEffect(() => {
    if (filteredTracks.length > 0 && !filteredTracks.some((t) => t.id === selectedTrackId)) {
      setSelectedTrackId(filteredTracks[0].id);
    }
  }, [filteredTracks, selectedTrackId]);

  // Verifica requisiti minimi per il calcolo
  const categories: PartCategory[] = [
    "brakes",
    "gearbox",
    "rearWing",
    "frontWing",
    "suspension",
    "engine",
  ];
  const missingCategories = categories.filter(
    (cat) => !parts.some((p) => p.owned && p.category === cat)
  );
  const ownedDriversCount = drivers.filter((d) => d.owned).length;
  const isGarageReady = missingCategories.length === 0 && ownedDriversCount >= 2;

  // Esecuzione calcolo
  const handleCalculate = () => {
    if (!isGarageReady) return;
    const result = runOptimization(
      parts,
      drivers,
      boosts,
      mode,
      selectedTrack,
      customWeights
    );

    if (result) {
      setCalculatedSetup(result);
      setSelectedD1BoostId(result.recommendedBoosts?.driver1.selectedId);
      setSelectedD2BoostId(result.recommendedBoosts?.driver2.selectedId);
    }
  };

  useEffect(() => {
    if (isGarageReady) {
      handleCalculate();
    } else {
      setCalculatedSetup(null);
    }
  }, [parts, drivers, boosts, isGarageReady, selectedTrack?.id, mode]);

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

  const handleOpenSaveModal = () => {
    if (!effectiveSetup) return;
    const defaultName =
      mode === "track" && selectedTrack
        ? `Assetto ${selectedTrack.name} (${selectedTrack.level})`
        : mode === "overall"
        ? "Setup Globale Max Score"
        : "Setup Pesi Personalizzati";

    setSaveName(defaultName);
    setSaveTag(mode === "track" && selectedTrack ? selectedTrack.level : "Personalizzato");
    setSaveTagColor(mode === "track" ? "#e10600" : "#8b5cf6");
    const s1L = selectedTrack ? (TRACK_CHARACTERISTICS[selectedTrack.stat1]?.label || selectedTrack.stat1) : "";
    const s2L = selectedTrack ? (TRACK_CHARACTERISTICS[selectedTrack.stat2]?.label || selectedTrack.stat2) : "";

    setSaveNotes(
      selectedTrack
        ? `Gara: ${selectedTrack.name} (${selectedTrack.level} • ${selectedTrack.laps} Giri). Caratteristiche: ${s1L} + ${s2L}.`
        : "Configurazione salvata dall'ottimizzatore."
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

  return (
    <div className="space-y-6">
      {/* SELETTORE STRATEGIA */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-[#272c38] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#e10600]" />
              <h2 className="text-xl font-mono font-black text-white tracking-tight uppercase">
                Calcolatore Setup Matematico
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Calcola il setup migliore per la tua gara specifica considerando Livello, Giri e Statistiche Ottimali.
            </p>
          </div>

          <button
            disabled={!isGarageReady}
            onClick={handleCalculate}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#e10600] to-[#b30500] hover:from-[#f00700] hover:to-[#c50500] text-white font-mono font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(225,6,0,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-spin text-amber-300" style={{ animationDuration: "3s" }} />
            <span>Calcola Setup Ottimale</span>
          </button>
        </div>

        {/* 3 Modalità */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setMode("track")}
            className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
              mode === "track"
                ? "bg-[#0f1115] border-[#e10600] ring-1 ring-[#e10600]"
                : "bg-[#14171d] border-[#272c38] hover:border-zinc-500 text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${mode === "track" ? "text-[#e10600]" : "text-zinc-500"}`} />
                <span className="font-mono font-bold text-sm text-white">Setup Gara Specifica</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                Pesi 2.5x & Giri
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Seleziona il circuito e il livello: l&apos;algoritmo calcola l&apos;assetto perfetto in base ai giri e alle statistiche richieste.
            </p>
          </button>

          <button
            onClick={() => setMode("overall")}
            className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
              mode === "overall"
                ? "bg-[#0f1115] border-[#e10600] ring-1 ring-[#e10600]"
                : "bg-[#14171d] border-[#272c38] hover:border-zinc-500 text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className={`w-4 h-4 ${mode === "overall" ? "text-[#e10600]" : "text-zinc-500"}`} />
                <span className="font-mono font-bold text-sm text-white">Setup Globale Max Score</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                1.0x Flat
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Massimizza il punteggio totale assoluto (Team Score) del tuo garage sommando tutti i valori.
            </p>
          </button>

          <button
            onClick={() => setMode("custom")}
            className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
              mode === "custom"
                ? "bg-[#0f1115] border-[#e10600] ring-1 ring-[#e10600]"
                : "bg-[#14171d] border-[#272c38] hover:border-zinc-500 text-zinc-400"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sliders className={`w-4 h-4 ${mode === "custom" ? "text-[#e10600]" : "text-zinc-500"}`} />
                <span className="font-mono font-bold text-sm text-white">Pesi Personalizzati</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                Slider 0-10 & Cap
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Slider di importanza statistica e opzione Tetto Massimo Team Score per il matchmaking.
            </p>
          </button>
        </div>

        {/* MODALITÀ GARA: CIRCUITO CON FORMATTAZIONE SPECIFICA */}
        {mode === "track" && (
          <div className="p-4 rounded-xl bg-[#0f1115] border border-[#272c38] space-y-4">
            {tracks.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 font-mono text-xs space-y-2">
                <p>Nessun circuito configurato. Crea il tuo primo circuito nel Track Manager.</p>
                <button
                  onClick={onNavigateToTracks}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e10600] text-white font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vai a Gestione Circuiti</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    {/* Filtro Livello / Serie */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-400">Filtra Livello:</span>
                      <select
                        value={selectedLevelFilter}
                        onChange={(e) => setSelectedLevelFilter(e.target.value)}
                        className="bg-[#181b22] border border-[#272c38] rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#e10600]"
                      >
                        <option value="all">Tutti i Livelli</option>
                        {availableLevels.map((lvl) => (
                          <option key={lvl} value={lvl}>
                            {lvl}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Menu a tendina formattato: [Livello X] Nome - Y Giri (Auto: Stat | Pilota: Stat) */}
                    <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                      <span className="text-xs font-mono text-zinc-400">Gara:</span>
                      <select
                        value={selectedTrack?.id || ""}
                        onChange={(e) => setSelectedTrackId(e.target.value)}
                        className="flex-1 bg-[#181b22] border border-[#272c38] rounded-lg px-3 py-2 text-xs font-mono text-white font-bold focus:outline-none focus:border-[#e10600]"
                      >
                        {filteredTracks.map((trk) => {
                          const matchOfficial = officialF1Circuits.find(
                            (c) => c.name.toLowerCase() === trk.name.toLowerCase()
                          );
                          const flag = matchOfficial?.flag ? `${matchOfficial.flag} ` : "";
                          const s1L = TRACK_CHARACTERISTICS[trk.stat1]?.label || trk.stat1;
                          const s2L = TRACK_CHARACTERISTICS[trk.stat2]?.label || trk.stat2;
                          return (
                            <option key={trk.id} value={trk.id}>
                              [{trk.level}] {flag}{trk.name} - {trk.laps} Giri ({s1L} + {s2L})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>

                  {selectedTrack && (
                    <button
                      onClick={() => setIsEditTrackOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#272c38] hover:bg-[#323947] text-xs font-mono text-amber-300 border border-amber-500/30 transition-all"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Modifica Circuito</span>
                    </button>
                  )}
                </div>

                {/* Scheda Parametri Gara Attuale */}
                {selectedTrack && (() => {
                  const s1Info = TRACK_CHARACTERISTICS[selectedTrack.stat1] || {
                    label: selectedTrack.stat1,
                    color: "#3b82f6",
                  };
                  const s2Info = TRACK_CHARACTERISTICS[selectedTrack.stat2] || {
                    label: selectedTrack.stat2,
                    color: "#a855f7",
                  };

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#272c38] text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-[#181b22] border border-[#272c38]">
                        <div className="text-[10px] text-zinc-500 uppercase">Giri di Gara</div>
                        <div className="font-bold text-white text-base">
                          {selectedTrack.laps} GIRI
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#181b22] border border-[#272c38]">
                        <div className="text-[10px] text-zinc-500 uppercase">1ª Caratteristica</div>
                        <div
                          className="font-bold uppercase flex items-center gap-1 mt-0.5 text-xs truncate"
                          style={{ color: s1Info.color }}
                        >
                          <Zap className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{s1Info.label}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">Priorità 2.5x</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#181b22] border border-[#272c38]">
                        <div className="text-[10px] text-zinc-500 uppercase">2ª Caratteristica</div>
                        <div
                          className="font-bold uppercase flex items-center gap-1 mt-0.5 text-xs truncate"
                          style={{ color: s2Info.color }}
                        >
                          <Zap className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{s2Info.label}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400">Priorità 2.3x</span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#181b22] border border-[#272c38]">
                        <div className="text-[10px] text-zinc-500 uppercase">Strategia / Note</div>
                        <div className="font-bold text-zinc-300 truncate" title={selectedTrack.notes}>
                          {selectedTrack.notes || "Nessuna nota."}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* MODALITÀ SLIDER & CAP */}
        {mode === "custom" && (
          <div className="p-4 rounded-xl bg-[#0f1115] border border-[#272c38] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#272c38]">
              <span className="text-xs font-mono font-bold text-white uppercase">
                Pesi Statistiche Vettura & Piloti (0 - 10)
              </span>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono select-none">
                  <input
                    type="checkbox"
                    checked={customWeights.teamScoreCapEnabled}
                    onChange={(e) =>
                      setCustomWeights({
                        ...customWeights,
                        teamScoreCapEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-[#e10600] bg-[#0f1115] border-[#272c38] focus:ring-0"
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
                    className="w-24 bg-[#181b22] border border-[#e10600] rounded px-2 py-1 text-xs font-mono font-bold text-white text-center"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { label: "Velocità", key: "speed" },
                { label: "Curva", key: "cornering" },
                { label: "Power Unit", key: "powerUnit" },
                { label: "Qualifica Auto", key: "qualifying" },
                { label: "Pit Stop", key: "pitStopTime" },
              ].map((item) => {
                const k = item.key as keyof CarStats;
                const val = customWeights.car[k];
                return (
                  <div key={item.key} className="p-2.5 rounded bg-[#181b22] border border-[#272c38]">
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-zinc-400">{item.label}</span>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              {[
                { label: "Sorpasso", key: "overtaking" },
                { label: "Difesa", key: "defending" },
                { label: "Qualifica Pilota", key: "qualifying" },
                { label: "Partenza", key: "raceStart" },
                { label: "Gestione Gomme", key: "tyreManagement" },
              ].map((item) => {
                const k = item.key as keyof DriverStats;
                const val = customWeights.driver[k];
                return (
                  <div key={item.key} className="p-2.5 rounded bg-[#181b22] border border-[#272c38]">
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-zinc-400">{item.label}</span>
                      <span className="font-bold text-[#06b6d4]">{val}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={val}
                      onChange={(e) =>
                        setCustomWeights({
                          ...customWeights,
                          driver: { ...customWeights.driver, [k]: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-[#06b6d4] cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* STATO GARAGE INCOMPLETO */}
      {!isGarageReady && (
        <div className="p-8 rounded-2xl bg-[#181b22] border border-[#272c38] text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-mono font-bold text-white uppercase">
              Garage Incompleto: Inserisci i tuoi componenti e piloti
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-1 max-w-lg mx-auto">
              Per calcolare il setup servono almeno 1 componente per categoria e almeno 2 piloti.
            </p>
          </div>

          <button
            onClick={onNavigateToGarage}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <Wrench className="w-4 h-4" />
            <span>Vai al Garage</span>
          </button>
        </div>
      )}

      {/* RISULTATI OTTIMIZZATORE */}
      {effectiveSetup && isGarageReady && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#181b22] border border-[#272c38] shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#0f1115] border border-[#e10600]/40">
                <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  Team Score Totale
                </span>
                <span className="text-3xl font-mono font-black text-white tracking-tight">
                  {currentTeamScore}
                </span>
              </div>

              <div className="text-xs font-mono space-y-1 text-zinc-400">
                <div>
                  Auto:{" "}
                  <span className="text-zinc-200 font-bold">
                    {effectiveSetup.scoreBreakdown.carScore}
                  </span>
                </div>
                <div>
                  Piloti:{" "}
                  <span className="text-zinc-200 font-bold">
                    {effectiveSetup.scoreBreakdown.driver1Score +
                      effectiveSetup.scoreBreakdown.driver2Score}{" "}
                    ({effectiveSetup.scoreBreakdown.driver1Score} +{" "}
                    {effectiveSetup.scoreBreakdown.driver2Score})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowBoostedStats(!showBoostedStats)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase transition-all ${
                  showBoostedStats
                    ? "bg-purple-950/40 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                    : "bg-[#0f1115] text-zinc-400 border-[#272c38] hover:text-white"
                }`}
              >
                <Zap className={`w-4 h-4 ${showBoostedStats ? "text-purple-400 fill-purple-400" : ""}`} />
                <span>{showBoostedStats ? "Con Boost Attivi" : "Assetto Base"}</span>
              </button>

              <button
                onClick={handleOpenSaveModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>Salva come Preset</span>
              </button>
            </div>
          </div>

          {/* Griglia Radar Chart + Box Strategia Giri & Boost */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#181b22] border border-[#272c38] flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#e10600]" />
                  <span>Impronta Telemetrica Vettura</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">6 Parametri Auto</span>
              </div>

              {currentCarStats && (
                <RadarChart
                  statsA={currentCarStats}
                  labelA={showBoostedStats ? "Setup + Boost" : "Setup Base"}
                  colorA="#e10600"
                  size={300}
                />
              )}

              {currentCarStats && (
                <div className="w-full grid grid-cols-3 gap-2 mt-4 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#0f1115] border border-[#272c38]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Velocità</span>
                    <span className="font-bold text-white">{currentCarStats.speed}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0f1115] border border-[#272c38]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Curva</span>
                    <span className="font-bold text-white">{currentCarStats.cornering}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0f1115] border border-[#272c38]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Power Unit</span>
                    <span className="font-bold text-white">{currentCarStats.powerUnit}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0f1115] border border-[#272c38]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Qualifica</span>
                    <span className="font-bold text-white">{currentCarStats.qualifying}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0f1115] border border-[#272c38]">
                    <span className="text-[10px] text-zinc-500 uppercase block">Pit Stop</span>
                    <span className="font-bold text-[#06b6d4]">{currentCarStats.pitStopTime}s</span>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-4">
              {/* Strategia Gara & Box Giri */}
              <div className="p-5 rounded-2xl bg-[#181b22] border border-[#272c38] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#06b6d4]" />
                    <h3 className="text-sm font-mono font-bold text-white uppercase">
                      Analisi Gara & Strategia Giri
                    </h3>
                  </div>
                  {selectedTrack && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e10600]/20 text-[#ff4d4d] border border-[#e10600]/40 font-bold">
                      {selectedTrack.laps} GIRI
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {effectiveSetup.strategyAdvice.map((adv, idx) => (
                    <div
                      key={`adv-${idx}`}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0f1115] border border-[#272c38]/60 text-zinc-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raccomandazioni Boost Mirate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#181b22] border border-[#272c38] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                      <span>{effectiveSetup.driver1.flag}</span>
                      <span>Boost {effectiveSetup.driver1.name.split(" ").pop()}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#06b6d4] uppercase">1° Pilota</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    {effectiveSetup.recommendedBoosts?.driver1.synergic ? (
                      <button
                        onClick={() =>
                          setSelectedD1BoostId(
                            effectiveSetup.recommendedBoosts?.driver1.synergic?.id
                          )
                        }
                        className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                          selectedD1BoostId ===
                          effectiveSetup.recommendedBoosts?.driver1.synergic?.id
                            ? "bg-cyan-950/30 border-[#06b6d4] text-white"
                            : "bg-[#0f1115] border-[#272c38] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-[#06b6d4]">⚡ Sinergico Tracciato</span>
                          <span className="text-zinc-300 font-bold">
                            {effectiveSetup.recommendedBoosts.driver1.synergic.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">
                          {effectiveSetup.recommendedBoosts.driver1.synergic.description}
                        </p>
                      </button>
                    ) : (
                      <div className="p-2 text-zinc-500 text-[11px]">Nessun boost disponibile</div>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#181b22] border border-[#272c38] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                      <span>{effectiveSetup.driver2.flag}</span>
                      <span>Boost {effectiveSetup.driver2.name.split(" ").pop()}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#06b6d4] uppercase">2° Pilota</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    {effectiveSetup.recommendedBoosts?.driver2.synergic ? (
                      <button
                        onClick={() =>
                          setSelectedD2BoostId(
                            effectiveSetup.recommendedBoosts?.driver2.synergic?.id
                          )
                        }
                        className={`w-full p-2.5 rounded-lg border text-left transition-all ${
                          selectedD2BoostId ===
                          effectiveSetup.recommendedBoosts?.driver2.synergic?.id
                            ? "bg-cyan-950/30 border-[#06b6d4] text-white"
                            : "bg-[#0f1115] border-[#272c38] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-[#06b6d4]">⚡ Sinergico Tracciato</span>
                          <span className="text-zinc-300 font-bold">
                            {effectiveSetup.recommendedBoosts.driver2.synergic.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">
                          {effectiveSetup.recommendedBoosts.driver2.synergic.description}
                        </p>
                      </button>
                    ) : (
                      <div className="p-2 text-zinc-500 text-[11px]">Nessun boost disponibile</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Componenti Ottimali */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-[#e10600]" />
              <h3 className="text-base font-mono font-bold text-white uppercase tracking-wide">
                Configurazione Ottimale Vettura (6 Componenti)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              {(
                [
                  "brakes",
                  "gearbox",
                  "rearWing",
                  "frontWing",
                  "suspension",
                  "engine",
                ] as const
              ).map((cat) => {
                const part = effectiveSetup.parts[cat];
                return (
                  <div
                    key={cat}
                    className="p-3.5 rounded-xl bg-[#181b22] border border-[#272c38] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-1.5">
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(cat, "w-3.5 h-3.5 text-zinc-300")}
                          <span>{getCategoryLabel(cat)}</span>
                        </span>
                        <RarityBadge rarity={part.rarity} />
                      </div>

                      <h4 className="font-mono font-bold text-sm text-white mb-2 truncate">
                        {part.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#272c38] text-[11px] font-mono">
                      <span className="text-zinc-400">Serie {part.series}</span>
                      <span className="text-[#e10600] font-bold">Lv. {part.level}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2 Piloti Ottimali */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-5 h-5 text-[#e10600]" />
              <h3 className="text-base font-mono font-bold text-white uppercase tracking-wide">
                Coppia Piloti Selezionata
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#181b22] border border-[#272c38]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{effectiveSetup.driver1.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-mono font-bold text-white">
                          {effectiveSetup.driver1.name}
                        </h4>
                        <RarityBadge rarity={effectiveSetup.driver1.rarity} />
                      </div>
                      <p className="text-xs font-mono text-zinc-400">
                        {effectiveSetup.driver1.team} • Lv. {effectiveSetup.driver1.level} (S
                        {effectiveSetup.driver1.series})
                      </p>
                    </div>
                  </div>

                  {effectiveSetup.driver1Boost && (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                      {effectiveSetup.driver1Boost.name}
                    </span>
                  )}
                </div>

                {currentD1Stats && (
                  <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono mt-3">
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">SORP</span>
                      <span className="font-bold text-zinc-200">{currentD1Stats.overtaking}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">DIF</span>
                      <span className="font-bold text-zinc-200">{currentD1Stats.defending}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">QUAL</span>
                      <span className="font-bold text-zinc-200">{currentD1Stats.qualifying}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">PART</span>
                      <span className="font-bold text-zinc-200">{currentD1Stats.raceStart}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">GOMME</span>
                      <span className="font-bold text-emerald-400">{currentD1Stats.tyreManagement}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-[#181b22] border border-[#272c38]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{effectiveSetup.driver2.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-mono font-bold text-white">
                          {effectiveSetup.driver2.name}
                        </h4>
                        <RarityBadge rarity={effectiveSetup.driver2.rarity} />
                      </div>
                      <p className="text-xs font-mono text-zinc-400">
                        {effectiveSetup.driver2.team} • Lv. {effectiveSetup.driver2.level} (S
                        {effectiveSetup.driver2.series})
                      </p>
                    </div>
                  </div>

                  {effectiveSetup.driver2Boost && (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                      {effectiveSetup.driver2Boost.name}
                    </span>
                  )}
                </div>

                {currentD2Stats && (
                  <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono mt-3">
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">SORP</span>
                      <span className="font-bold text-zinc-200">{currentD2Stats.overtaking}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">DIF</span>
                      <span className="font-bold text-zinc-200">{currentD2Stats.defending}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">QUAL</span>
                      <span className="font-bold text-zinc-200">{currentD2Stats.qualifying}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">PART</span>
                      <span className="font-bold text-zinc-200">{currentD2Stats.raceStart}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0f1115] border border-[#272c38]">
                      <span className="text-[10px] text-zinc-500 block">GOMME</span>
                      <span className="font-bold text-emerald-400">{currentD2Stats.tyreManagement}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
