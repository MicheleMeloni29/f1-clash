"use client";

import React, { useState, useMemo } from "react";
import {
  LoadoutPreset,
  Part,
  Driver,
  Boost,
  CalculatedLoadout,
  CarStats,
  DriverStats,
} from "@/types/f1";
import { calculatePresetStats } from "@/lib/optimizer";
import { formatDelta, formatPitStop } from "@/lib/utils";
import { RadarChart } from "./RadarChart";
import { getCategoryIcon, getCategoryLabel, RarityBadge } from "./RarityBadge";
import {
  FolderArchive,
  ArrowRightLeft,
  Trash2,
  Edit2,
  Sparkles,
  Check,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  Zap,
} from "lucide-react";

interface PresetsTabProps {
  presets: LoadoutPreset[];
  allParts: Part[];
  allDrivers: Driver[];
  allBoosts: Boost[];
  onDeletePreset: (id: string) => void;
  onUpdatePreset: (updated: LoadoutPreset) => void;
  onLoadPresetToOptimizer: (preset: LoadoutPreset) => void;
  currentOptimizedSetup: CalculatedLoadout | null;
}

export const PresetsTab: React.FC<PresetsTabProps> = ({
  presets,
  allParts,
  allDrivers,
  allBoosts,
  onDeletePreset,
  onUpdatePreset,
  onLoadPresetToOptimizer,
  currentOptimizedSetup,
}) => {
  // Preset A e Preset B per il confronto Side-by-Side
  // Usiamo 'optimizer' per il setup corrente o l'ID del preset
  const [selectedIdA, setSelectedIdA] = useState<string>(
    presets[0]?.id || (currentOptimizedSetup ? "optimizer" : "")
  );
  const [selectedIdB, setSelectedIdB] = useState<string>(
    presets[1]?.id || presets[0]?.id || ""
  );

  // Modale Modifica Preset
  const [editingPreset, setEditingPreset] = useState<LoadoutPreset | null>(null);
  const [editName, setEditName] = useState("");
  const [editTag, setEditTag] = useState("");
  const [editTagColor, setEditTagColor] = useState("#e10600");
  const [editNotes, setEditNotes] = useState("");

  const handleStartEdit = (preset: LoadoutPreset) => {
    setEditingPreset(preset);
    setEditName(preset.name);
    setEditTag(preset.tag);
    setEditTagColor(preset.tagColor || "#e10600");
    setEditNotes(preset.customNotes || "");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset) return;

    onUpdatePreset({
      ...editingPreset,
      name: editName.trim() || editingPreset.name,
      tag: editTag.trim() || editingPreset.tag,
      tagColor: editTagColor,
      customNotes: editNotes.trim(),
      updatedAt: new Date().toISOString(),
    });

    setEditingPreset(null);
  };

  // Calcolo dati setup A
  const dataA: { name: string; tag: string; loadout: CalculatedLoadout } | null = useMemo(() => {
    if (selectedIdA === "optimizer" && currentOptimizedSetup) {
      return {
        name: "Setup Ottimizzato Corrente",
        tag: "Live Calc",
        loadout: currentOptimizedSetup,
      };
    }
    const found = presets.find((p) => p.id === selectedIdA);
    if (!found) return null;
    const calc = calculatePresetStats(found, allParts, allDrivers, allBoosts);
    if (!calc) return null;
    return { name: found.name, tag: found.tag, loadout: calc };
  }, [selectedIdA, presets, currentOptimizedSetup, allParts, allDrivers, allBoosts]);

  // Calcolo dati setup B
  const dataB: { name: string; tag: string; loadout: CalculatedLoadout } | null = useMemo(() => {
    if (selectedIdB === "optimizer" && currentOptimizedSetup) {
      return {
        name: "Setup Ottimizzato Corrente",
        tag: "Live Calc",
        loadout: currentOptimizedSetup,
      };
    }
    const found = presets.find((p) => p.id === selectedIdB);
    if (!found) return null;
    const calc = calculatePresetStats(found, allParts, allDrivers, allBoosts);
    if (!calc) return null;
    return { name: found.name, tag: found.tag, loadout: calc };
  }, [selectedIdB, presets, currentOptimizedSetup, allParts, allDrivers, allBoosts]);

  // Calcolo Delta (A vs B): positivo se A è migliore di B
  const deltas = useMemo(() => {
    if (!dataA || !dataB) return null;
    const carA = dataA.loadout.baseCarStats;
    const carB = dataB.loadout.baseCarStats;
    const d1A = dataA.loadout.baseDriver1Stats;
    const d1B = dataB.loadout.baseDriver1Stats;
    const d2A = dataA.loadout.baseDriver2Stats;
    const d2B = dataB.loadout.baseDriver2Stats;

    return {
      teamScore: dataA.loadout.baseTeamScore - dataB.loadout.baseTeamScore,
      car: {
        speed: carA.speed - carB.speed,
        cornering: carA.cornering - carB.cornering,
        powerUnit: carA.powerUnit - carB.powerUnit,
        qualifying: carA.qualifying - carB.qualifying,
        pitStopTime: carA.pitStopTime - carB.pitStopTime,
      },
      driver1: {
        overtaking: d1A.overtaking - d1B.overtaking,
        defending: d1A.defending - d1B.defending,
        qualifying: d1A.qualifying - d1B.qualifying,
        raceStart: d1A.raceStart - d1B.raceStart,
        tyreManagement: d1A.tyreManagement - d1B.tyreManagement,
      },
      driver2: {
        overtaking: d2A.overtaking - d2B.overtaking,
        defending: d2A.defending - d2B.defending,
        qualifying: d2A.qualifying - d2B.qualifying,
        raceStart: d2A.raceStart - d2B.raceStart,
        tyreManagement: d2A.tyreManagement - d2B.tyreManagement,
      },
    };
  }, [dataA, dataB]);

  return (
    <div className="space-y-8">
      {/* Intestazione Sezione */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#181b22] border border-[#272c38]">
        <div>
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-[#e10600]" />
            <h2 className="text-xl font-mono font-black text-white tracking-tight uppercase">
              Libreria Preset & Confronto Side-by-Side
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Tutti i preset salvati si ricalcolano automaticamente quando aggiorni i livelli nel
            garage. Confronta due configurazioni per analizzare i delta telemetrici.
          </p>
        </div>
      </div>

      {/* --- SEZIONE CONFRONTO TELEMETRICO SIDE-BY-SIDE --- */}
      <div className="p-6 rounded-2xl bg-[#181b22] border border-[#272c38] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#272c38] pb-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-[#06b6d4]" />
            <h3 className="text-base font-mono font-bold text-white uppercase tracking-wide">
              Confronto Prestazionale Telemetria (Delta View)
            </h3>
          </div>

          {/* Selettori dei 2 setup da confrontare */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-zinc-400 font-semibold">Setup A:</span>
              <select
                value={selectedIdA}
                onChange={(e) => setSelectedIdA(e.target.value)}
                className="bg-[#0f1115] border border-[#272c38] text-xs font-mono text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#e10600]"
              >
                {currentOptimizedSetup && (
                  <option value="optimizer">⚡ Setup Ottimizzatore Attuale</option>
                )}
                {presets.map((p) => (
                  <option key={`opt-a-${p.id}`} value={p.id}>
                    {p.name} ({p.tag})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-zinc-500 font-mono text-xs">VS</span>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono text-zinc-400 font-semibold">Setup B:</span>
              <select
                value={selectedIdB}
                onChange={(e) => setSelectedIdB(e.target.value)}
                className="bg-[#0f1115] border border-[#272c38] text-xs font-mono text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#a855f7]"
              >
                {currentOptimizedSetup && (
                  <option value="optimizer">⚡ Setup Ottimizzatore Attuale</option>
                )}
                {presets.map((p) => (
                  <option key={`opt-b-${p.id}`} value={p.id}>
                    {p.name} ({p.tag})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {dataA && dataB && deltas ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Banner Delta Team Score Totale & Radar Chart */}
            <div className="lg:col-span-5 flex flex-col items-center p-4 bg-[#0f1115] rounded-xl border border-[#272c38] space-y-4">
              <div className="w-full text-center">
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">
                  Delta Team Score Complessivo
                </span>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {deltas.teamScore >= 0 ? (
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-400" />
                  )}
                  <span
                    className={`text-3xl font-mono font-black ${
                      deltas.teamScore > 0
                        ? "text-emerald-400"
                        : deltas.teamScore < 0
                        ? "text-red-400"
                        : "text-zinc-300"
                    }`}
                  >
                    {deltas.teamScore > 0 ? `+${deltas.teamScore}` : deltas.teamScore} TS
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                  {deltas.teamScore > 0
                    ? `Setup A supera Setup B di ${deltas.teamScore} punti complessivi`
                    : deltas.teamScore < 0
                    ? `Setup B supera Setup A di ${Math.abs(deltas.teamScore)} punti complessivi`
                    : "I due setup hanno esattamente lo stesso Team Score"}
                </p>
              </div>

              {/* Spider Radar Chart sovrapposto */}
              <div className="w-full flex justify-center py-2">
                <RadarChart
                  statsA={dataA.loadout.baseCarStats}
                  labelA={dataA.name.slice(0, 16)}
                  colorA="#e10600"
                  statsB={dataB.loadout.baseCarStats}
                  labelB={dataB.name.slice(0, 16)}
                  colorB="#a855f7"
                  size={290}
                />
              </div>

              <div className="w-full grid grid-cols-2 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded-lg bg-[#181b22] border border-[#e10600]/40">
                  <div className="text-[10px] text-zinc-400">Team Score A</div>
                  <div className="text-base font-bold text-white">
                    {dataA.loadout.baseTeamScore}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-[#181b22] border border-[#a855f7]/40">
                  <div className="text-[10px] text-zinc-400">Team Score B</div>
                  <div className="text-base font-bold text-white">
                    {dataB.loadout.baseTeamScore}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabella Comparativa Dettagliata con Delta Verdi/Rossi */}
            <div className="lg:col-span-7 space-y-4">
              {/* Statistiche Auto */}
              <div className="p-4 bg-[#0f1115] rounded-xl border border-[#272c38]">
                <h4 className="text-xs font-mono font-bold uppercase text-[#06b6d4] mb-3 flex items-center justify-between">
                  <span>Prestazioni Vettura</span>
                  <span className="text-[10px] text-zinc-500">Valore A | Valore B | Delta</span>
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  {[
                    { label: "Velocità Massima", key: "speed", isPit: false },
                    { label: "Grip in Curva", key: "cornering", isPit: false },
                    { label: "Power Unit", key: "powerUnit", isPit: false },
                    { label: "Qualifica Auto", key: "qualifying", isPit: false },
                    { label: "Tempo Pit Stop", key: "pitStopTime", isPit: true },
                  ].map((row) => {
                    const carKey = row.key as keyof CarStats;
                    const valA = dataA.loadout.baseCarStats[carKey];
                    const valB = dataB.loadout.baseCarStats[carKey];
                    const diff = deltas.car[carKey];
                    const deltaInfo = formatDelta(diff, row.isPit);

                    return (
                      <div
                        key={row.key}
                        className="flex items-center justify-between py-1.5 px-2 rounded bg-[#181b22]/70 border border-[#272c38]/50"
                      >
                        <span className="text-zinc-300">{row.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-200">
                            {row.isPit ? formatPitStop(valA) : valA}
                          </span>
                          <span className="text-zinc-600">vs</span>
                          <span className="text-zinc-400">
                            {row.isPit ? formatPitStop(valB) : valB}
                          </span>
                          <span
                            className={`min-w-[55px] text-right font-bold ${
                              deltaInfo.isNeutral
                                ? "text-zinc-500"
                                : deltaInfo.isPositive
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {deltaInfo.text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pilota 1 e Pilota 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pilota 1 */}
                <div className="p-3 bg-[#0f1115] rounded-xl border border-[#272c38]">
                  <h5 className="text-[11px] font-mono font-bold uppercase text-[#e10600] mb-2 flex items-center justify-between">
                    <span>1° Pilota</span>
                    <span className="text-[10px] text-zinc-400">
                      {dataA.loadout.driver1.name.split(" ").pop()} vs{" "}
                      {dataB.loadout.driver1.name.split(" ").pop()}
                    </span>
                  </h5>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    {[
                      { label: "Sorpasso", key: "overtaking" },
                      { label: "Difesa", key: "defending" },
                      { label: "Qualifica", key: "qualifying" },
                      { label: "Gomme", key: "tyreManagement" },
                    ].map((row) => {
                      const dKey = row.key as keyof DriverStats;
                      const diff = deltas.driver1[dKey];
                      const dInfo = formatDelta(diff);
                      return (
                        <div key={`d1-${row.key}`} className="flex items-center justify-between">
                          <span className="text-zinc-400">{row.label}</span>
                          <span
                            className={`font-bold ${
                              dInfo.isNeutral
                                ? "text-zinc-500"
                                : dInfo.isPositive
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {dInfo.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pilota 2 */}
                <div className="p-3 bg-[#0f1115] rounded-xl border border-[#272c38]">
                  <h5 className="text-[11px] font-mono font-bold uppercase text-[#a855f7] mb-2 flex items-center justify-between">
                    <span>2° Pilota</span>
                    <span className="text-[10px] text-zinc-400">
                      {dataA.loadout.driver2.name.split(" ").pop()} vs{" "}
                      {dataB.loadout.driver2.name.split(" ").pop()}
                    </span>
                  </h5>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    {[
                      { label: "Sorpasso", key: "overtaking" },
                      { label: "Difesa", key: "defending" },
                      { label: "Qualifica", key: "qualifying" },
                      { label: "Gomme", key: "tyreManagement" },
                    ].map((row) => {
                      const dKey = row.key as keyof DriverStats;
                      const diff = deltas.driver2[dKey];
                      const dInfo = formatDelta(diff);
                      return (
                        <div key={`d2-${row.key}`} className="flex items-center justify-between">
                          <span className="text-zinc-400">{row.label}</span>
                          <span
                            className={`font-bold ${
                              dInfo.isNeutral
                                ? "text-zinc-500"
                                : dInfo.isPositive
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {dInfo.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-500 font-mono text-sm">
            Seleziona due configurazioni valide per visualizzare il confronto telemetrico.
          </div>
        )}
      </div>

      {/* --- GRIGLIA PRESET SALVATI --- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#e10600]" />
            <h3 className="text-lg font-mono font-bold text-white uppercase">
              Tutti i Preset Salvati ({presets.length})
            </h3>
          </div>
        </div>

        {presets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#181b22] border border-[#272c38] text-zinc-400 font-mono text-sm">
            Nessun preset salvato. Esegui un calcolo nell&apos;Ottimizzatore e clicca su &quot;Salva come Preset&quot; per iniziare.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {presets.map((preset) => {
              const calc = calculatePresetStats(preset, allParts, allDrivers, allBoosts);
              const d1 = allDrivers.find((d) => d.id === preset.driver1Id);
              const d2 = allDrivers.find((d) => d.id === preset.driver2Id);
              const b1 = allBoosts.find((b) => b.id === preset.driver1BoostId);
              const b2 = allBoosts.find((b) => b.id === preset.driver2BoostId);

              return (
                <div
                  key={preset.id}
                  className="flex flex-col justify-between p-5 rounded-2xl bg-[#181b22] border border-[#272c38] hover:border-zinc-500 transition-all shadow-lg"
                >
                  <div>
                    {/* Header Card Preset */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: preset.tagColor || "#e10600" }}
                          />
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                            {preset.tag}
                          </span>
                        </div>
                        <h4 className="text-base font-mono font-bold text-white tracking-tight">
                          {preset.name}
                        </h4>
                      </div>

                      {/* Team Score badge */}
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-zinc-400 uppercase">
                          Team Score
                        </div>
                        <div className="text-xl font-mono font-black text-[#e10600]">
                          {calc ? calc.baseTeamScore : "N/D"}
                        </div>
                      </div>
                    </div>

                    {/* Note strategiche */}
                    {preset.customNotes && (
                      <p className="text-xs text-zinc-400 font-mono mb-3 line-clamp-2 bg-[#0f1115] p-2 rounded-lg border border-[#272c38]">
                        &ldquo;{preset.customNotes}&rdquo;
                      </p>
                    )}

                    {/* Preview Piloti & Boost */}
                    <div className="p-2.5 rounded-xl bg-[#0f1115] border border-[#272c38] mb-3 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span>{d1?.flag}</span>
                          <span className="text-zinc-200 font-semibold">{d1?.name}</span>
                        </div>
                        {b1 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {b1.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span>{d2?.flag}</span>
                          <span className="text-zinc-200 font-semibold">{d2?.name}</span>
                        </div>
                        {b2 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            {b2.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Indicatori Statistiche Auto */}
                    {calc && (
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono mb-4 text-zinc-300">
                        <div className="p-1 rounded bg-[#0f1115] border border-[#272c38]">
                          VEL: {calc.baseCarStats.speed}
                        </div>
                        <div className="p-1 rounded bg-[#0f1115] border border-[#272c38]">
                          CUR: {calc.baseCarStats.cornering}
                        </div>
                        <div className="p-1 rounded bg-[#0f1115] border border-[#272c38]">
                          PIT: {calc.baseCarStats.pitStopTime}s
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Azioni del Preset */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#272c38] gap-2">
                    <button
                      onClick={() => onLoadPresetToOptimizer(preset)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#e10600] hover:bg-[#c50500] text-white text-xs font-mono font-bold uppercase transition-all shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Carica</span>
                    </button>

                    <button
                      onClick={() => setSelectedIdA(preset.id)}
                      title="Imposta come Setup A nel confronto"
                      className="px-2.5 py-2 rounded-lg bg-[#272c38] hover:bg-[#323947] text-zinc-200 text-xs font-mono font-bold transition-all"
                    >
                      Set A
                    </button>

                    <button
                      onClick={() => setSelectedIdB(preset.id)}
                      title="Imposta come Setup B nel confronto"
                      className="px-2.5 py-2 rounded-lg bg-[#272c38] hover:bg-[#323947] text-zinc-200 text-xs font-mono font-bold transition-all"
                    >
                      Set B
                    </button>

                    <button
                      onClick={() => handleStartEdit(preset)}
                      title="Modifica Nome / Tag / Note"
                      className="p-2 rounded-lg bg-[#272c38] hover:bg-[#323947] text-zinc-300 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Eliminare il preset "${preset.name}"?`)) {
                          onDeletePreset(preset.id);
                        }
                      }}
                      title="Elimina Preset"
                      className="p-2 rounded-lg bg-[#272c38] hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale Modifica Preset */}
      {editingPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#181b22] border border-[#272c38] rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-mono font-bold uppercase text-white mb-4">
              Modifica Dati Preset
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Nome Preset</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#e10600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Tag / Categoria</label>
                  <input
                    type="text"
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#e10600]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Colore Tag</label>
                  <input
                    type="color"
                    value={editTagColor}
                    onChange={(e) => setEditTagColor(e.target.value)}
                    className="w-full h-10 bg-[#0f1115] border border-[#272c38] rounded-lg p-1 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Note Tattiche</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-[#e10600]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPreset(null)}
                  className="flex-1 py-2 rounded-xl bg-[#272c38] text-zinc-300 font-mono text-xs uppercase"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#e10600] text-white font-mono font-bold text-xs uppercase"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
