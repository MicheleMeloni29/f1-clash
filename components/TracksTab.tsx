"use client";

import React, { useState, useMemo } from "react";
import {
  Track,
  TrackCharacteristic,
  TRACK_CHARACTERISTICS,
  TRACK_CHARACTERISTIC_LIST,
} from "@/types/f1";
import { officialF1Circuits } from "@/lib/initialData";
import { TrackModal } from "./TrackModal";
import {
  MapPin,
  Plus,
  Copy,
  Edit2,
  Trash2,
  Search,
  ArrowUpDown,
  RotateCcw,
  Zap,
  Info,
} from "lucide-react";

interface TracksTabProps {
  tracks: Track[];
  onAddTrack: (track: Track) => void;
  onUpdateTrack: (track: Track) => void;
  onDeleteTrack: (id: string) => void;
}

export const TracksTab: React.FC<TracksTabProps> = ({
  tracks,
  onAddTrack,
  onUpdateTrack,
  onDeleteTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("all");
  const [selectedStatFilter, setSelectedStatFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"level" | "name" | "laps">("level");

  // Stato Modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);

  // Lista di tutti i livelli presenti (con Gran Premio sempre in cima se presente)
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

  // Filtra e ordina i circuiti
  const filteredTracks = useMemo(() => {
    return tracks
      .filter((t) => {
        if (selectedLevelFilter !== "all" && t.level !== selectedLevelFilter) return false;
        if (selectedStatFilter !== "all" && t.stat1 !== selectedStatFilter && t.stat2 !== selectedStatFilter) {
          return false;
        }
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const s1Label = TRACK_CHARACTERISTICS[t.stat1]?.label.toLowerCase() || "";
          const s2Label = TRACK_CHARACTERISTICS[t.stat2]?.label.toLowerCase() || "";
          if (
            !t.name.toLowerCase().includes(q) &&
            !t.level.toLowerCase().includes(q) &&
            !s1Label.includes(q) &&
            !s2Label.includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "laps") {
          return b.laps - a.laps;
        }
        // Ordina per livello
        return a.level.localeCompare(b.level, undefined, { numeric: true });
      });
  }, [tracks, selectedLevelFilter, selectedStatFilter, searchQuery, sortBy]);

  const handleOpenCreate = () => {
    setEditingTrack(null);
    setIsDuplicateMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (track: Track) => {
    setEditingTrack(track);
    setIsDuplicateMode(false);
    setIsModalOpen(true);
  };

  const handleOpenDuplicate = (track: Track) => {
    setEditingTrack(track);
    setIsDuplicateMode(true);
    setIsModalOpen(true);
  };

  const handleSaveModal = (track: Track) => {
    if (editingTrack && !isDuplicateMode) {
      onUpdateTrack(track);
    } else {
      onAddTrack(track);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#181b22] border border-[#272c38]">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#e10600]" />
            <h2 className="text-xl font-mono font-black text-white tracking-tight uppercase">
              Gestione Circuiti (Track Manager)
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Ogni circuito in F1 Clash richiede esattamente 2 caratteristiche (tra Sorpasso, Power Unit, Velocità, Sterzata, Partenza, Difesa, Gestione Pneumatici).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#e10600] to-[#b30500] hover:from-[#f00700] hover:to-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuovo Circuito</span>
        </button>
      </div>

      {/* Barra Filtri e Ricerca */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14171d] p-3 rounded-xl border border-[#272c38] text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          {/* Ricerca */}
          <div className="relative w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Cerca circuito o caratteristica..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#e10600]"
            />
          </div>

          {/* Filtro Livello */}
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">Livello/Serie:</span>
            <select
              value={selectedLevelFilter}
              onChange={(e) => setSelectedLevelFilter(e.target.value)}
              className="bg-[#0f1115] border border-[#272c38] rounded px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-[#e10600]"
            >
              <option value="all">Tutti i Livelli ({tracks.length})</option>
              {availableLevels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Caratteristica */}
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-zinc-500">Caratteristica:</span>
            <select
              value={selectedStatFilter}
              onChange={(e) => setSelectedStatFilter(e.target.value)}
              className="bg-[#0f1115] border border-[#272c38] rounded px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-[#e10600]"
            >
              <option value="all">Tutte le Caratteristiche</option>
              {TRACK_CHARACTERISTIC_LIST.map((c) => (
                <option key={`flt-${c.key}`} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ordinamento */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Ordina:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "level" | "name" | "laps")}
              className="bg-[#0f1115] border border-[#272c38] rounded px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-[#e10600]"
            >
              <option value="level">Per Livello/Serie</option>
              <option value="name">Per Nome</option>
              <option value="laps">Per Numero Giri (Decrescente)</option>
            </select>
          </div>
        </div>

        <div className="text-zinc-400">
          Circuiti trovati: <span className="text-white font-bold">{filteredTracks.length}</span>
        </div>
      </div>

      {/* Griglia Card Circuiti */}
      {filteredTracks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#181b22] border border-[#272c38] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#e10600]/10 border border-[#e10600]/30 flex items-center justify-center mx-auto text-[#e10600]">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-mono font-bold text-white uppercase">
              Nessun circuito trovato
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-1 max-w-md mx-auto">
              Crea i circuiti che affronti in F1 Clash indicando i giri e le due caratteristiche chiave richieste.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crea il tuo primo Circuito</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTracks.map((track) => {
            const matchOfficial = officialF1Circuits.find(
              (c) => c.name.toLowerCase() === track.name.toLowerCase()
            );
            const flag = matchOfficial?.flag ? `${matchOfficial.flag} ` : "";

            const s1Meta = TRACK_CHARACTERISTICS[track.stat1] || {
              label: track.stat1 || "Velocità",
              color: "#3b82f6",
            };
            const s2Meta = TRACK_CHARACTERISTICS[track.stat2] || {
              label: track.stat2 || "Power Unit",
              color: "#a855f7",
            };

            return (
              <div
                key={track.id}
                className="flex flex-col justify-between p-5 rounded-2xl bg-[#181b22] border border-[#272c38] hover:border-zinc-500 transition-all shadow-lg"
              >
                <div>
                  {/* Header Card Circuito */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase flex items-center gap-1 ${
                            track.level.toLowerCase().includes("gran premio")
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                              : "bg-zinc-800 text-zinc-200 border-zinc-700"
                          }`}
                        >
                          {track.level.toLowerCase().includes("gran premio") && "🏆"}
                          <span>{track.level}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#e10600]/20 text-[#ff4d4d] border border-[#e10600]/40">
                          {track.laps} GIRI
                        </span>
                      </div>
                      <h3 className="text-lg font-mono font-bold text-white tracking-tight flex items-center gap-1.5">
                        <span>{flag}{track.name}</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenDuplicate(track)}
                        title="Duplica per altro Livello"
                        className="p-1.5 rounded-lg bg-[#0f1115] hover:bg-[#272c38] text-amber-300 border border-[#272c38] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(track)}
                        title="Modifica"
                        className="p-1.5 rounded-lg bg-[#0f1115] hover:bg-[#272c38] text-zinc-300 border border-[#272c38] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Eliminare il circuito "${track.name}" (${track.level})?`
                            )
                          ) {
                            onDeleteTrack(track.id);
                          }
                        }}
                        title="Elimina"
                        className="p-1.5 rounded-lg bg-[#0f1115] hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-[#272c38] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Le 2 Caratteristiche Reali del Circuito */}
                  <div className="p-3 rounded-xl bg-[#0f1115] border border-[#272c38] my-3">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">
                      Caratteristiche Circuito (2 Chiave)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                        style={{
                          backgroundColor: `${s1Meta.color}15`,
                          borderColor: `${s1Meta.color}50`,
                          color: s1Meta.color,
                        }}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {s1Meta.label}
                      </span>
                      <span className="text-zinc-600 font-bold text-sm">+</span>
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                        style={{
                          backgroundColor: `${s2Meta.color}15`,
                          borderColor: `${s2Meta.color}50`,
                          color: s2Meta.color,
                        }}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {s2Meta.label}
                      </span>
                    </div>
                  </div>

                  {/* Note personali */}
                  {track.notes && (
                    <p className="text-xs text-zinc-400 font-mono line-clamp-2 bg-[#0f1115] p-2.5 rounded-xl border border-[#272c38] mb-3">
                      💡 {track.notes}
                    </p>
                  )}
                </div>

                {/* Footer Card */}
                <div className="pt-2 border-t border-[#272c38] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>F1 Clash Circuit ID: {track.id.slice(-6)}</span>
                  <button
                    onClick={() => handleOpenDuplicate(track)}
                    className="text-amber-400 hover:underline flex items-center gap-1 text-[10px]"
                  >
                    <span>Copia per altra Serie</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale Creazione / Modifica / Duplica */}
      <TrackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveTrack={handleSaveModal}
        editingTrack={editingTrack}
        isDuplicate={isDuplicateMode}
      />
    </div>
  );
};
