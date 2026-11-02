"use client";

import React, { useState, useEffect } from "react";
import {
  Track,
  TrackCharacteristic,
  TRACK_CHARACTERISTIC_LIST,
  TRACK_CHARACTERISTICS,
} from "@/types/f1";
import { officialF1Circuits } from "@/lib/initialData";
import { X, MapPin, Plus, Save, Copy, Zap, Flame } from "lucide-react";

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrack: (track: Track) => void;
  editingTrack?: Track | null;
  isDuplicate?: boolean;
}

export const TrackModal: React.FC<TrackModalProps> = ({
  isOpen,
  onClose,
  onSaveTrack,
  editingTrack = null,
  isDuplicate = false,
}) => {
  const [name, setName] = useState("Monza");
  const [customName, setCustomName] = useState("");
  const [isCustomName, setIsCustomName] = useState(false);
  const [level, setLevel] = useState("Livello 9");
  const [laps, setLaps] = useState(8);
  const [stat1, setStat1] = useState<TrackCharacteristic>("speed");
  const [stat2, setStat2] = useState<TrackCharacteristic>("powerUnit");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editingTrack) {
      const matchOfficial = officialF1Circuits.some((c) => c.name === editingTrack.name);
      if (matchOfficial) {
        setName(editingTrack.name);
        setIsCustomName(false);
      } else {
        setName("other");
        setCustomName(editingTrack.name);
        setIsCustomName(true);
      }

      setLevel(isDuplicate ? `${editingTrack.level} (Copia)` : editingTrack.level);
      setLaps(editingTrack.laps);
      setStat1(editingTrack.stat1 || "speed");
      setStat2(editingTrack.stat2 || "powerUnit");
      setNotes(editingTrack.notes || "");
    } else {
      setName("Monza");
      setIsCustomName(false);
      setLevel("Livello 9");
      setLaps(8);
      setStat1("speed");
      setStat2("powerUnit");
      setNotes("");
    }
  }, [editingTrack, isDuplicate, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = isCustomName ? customName.trim() || "Circuito Personalizzato" : name;

    const trackData: Track = {
      id: editingTrack && !isDuplicate ? editingTrack.id : `track-${Date.now()}`,
      name: finalName,
      level: level.trim() || "Livello 1",
      laps: Number(laps) || 8,
      stat1,
      stat2,
      notes: notes.trim(),
    };

    onSaveTrack(trackData);
    onClose();
  };

  const stat1Meta = TRACK_CHARACTERISTICS[stat1];
  const stat2Meta = TRACK_CHARACTERISTICS[stat2];

  // Preset rapidi di combo frequenti in F1 Clash
  const quickCombos: Array<{ label: string; s1: TrackCharacteristic; s2: TrackCharacteristic }> = [
    { label: "Velocità + Power Unit", s1: "speed", s2: "powerUnit" },
    { label: "Sterzata + Sorpasso", s1: "cornering", s2: "overtaking" },
    { label: "Sterzata + Difesa", s1: "cornering", s2: "defending" },
    { label: "Partenza + Sorpasso", s1: "raceStart", s2: "overtaking" },
    { label: "Sterzata + Gest. Gomme", s1: "cornering", s2: "tyreManagement" },
    { label: "Velocità + Sorpasso", s1: "speed", s2: "overtaking" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#181b22] border border-[#272c38] rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[92vh] overflow-y-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#272c38]">
          <div className="flex items-center gap-2">
            {isDuplicate ? (
              <Copy className="w-5 h-5 text-amber-400" />
            ) : editingTrack ? (
              <Save className="w-5 h-5 text-[#06b6d4]" />
            ) : (
              <Plus className="w-5 h-5 text-[#e10600]" />
            )}
            <h3 className="text-base font-mono font-bold text-white uppercase tracking-tight">
              {isDuplicate
                ? `Duplica Circuito "${editingTrack?.name}"`
                : editingTrack
                ? `Modifica Circuito: ${editingTrack.name}`
                : "Crea Nuovo Circuito per F1 Clash"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#272c38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs font-mono">
          {/* Nome Circuito */}
          <div>
            <label className="block text-zinc-400 mb-1">Nome Circuito</label>
            <div className="space-y-2">
              <select
                value={isCustomName ? "other" : name}
                onChange={(e) => {
                  if (e.target.value === "other") {
                    setIsCustomName(true);
                  } else {
                    setIsCustomName(false);
                    setName(e.target.value);
                  }
                }}
                className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#e10600]"
              >
                {officialF1Circuits.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
                <option value="other">✍️ Altro Nome Personalizzato...</option>
              </select>

              {isCustomName && (
                <input
                  type="text"
                  required
                  placeholder="Digita il nome del circuito..."
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#e10600] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Livello / Serie e Giri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1">Livello / Serie</label>
              <div className="space-y-1.5">
                <select
                  value={
                    level === "Gran Premio" ||
                    Array.from({ length: 12 }, (_, i) => `Livello ${i + 1}`).includes(level)
                      ? level
                      : "custom"
                  }
                  onChange={(e) => {
                    if (e.target.value !== "custom") {
                      setLevel(e.target.value);
                    }
                  }}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#e10600]"
                >
                  <option value="Gran Premio">🏆 Gran Premio</option>
                  {Array.from({ length: 12 }, (_, i) => 12 - i).map((lvl) => (
                    <option key={`lvl-${lvl}`} value={`Livello ${lvl}`}>
                      Livello {lvl}
                    </option>
                  ))}
                  <option value="custom">✍️ Altro (Personalizzato)...</option>
                </select>

                <input
                  type="text"
                  required
                  placeholder="es. Gran Premio, Livello 9, ecc."
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#e10600]"
                />

                {/* Quick chips rapidi */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setLevel("Gran Premio")}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                      level === "Gran Premio"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow"
                        : "bg-[#181b22] text-zinc-400 border-[#272c38] hover:text-white"
                    }`}
                  >
                    🏆 Gran Premio
                  </button>
                  <button
                    type="button"
                    onClick={() => setLevel("Livello 12")}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-[#181b22] text-zinc-400 border border-[#272c38] hover:text-white"
                  >
                    Lv 12
                  </button>
                  <button
                    type="button"
                    onClick={() => setLevel("Livello 11")}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-[#181b22] text-zinc-400 border border-[#272c38] hover:text-white"
                  >
                    Lv 11
                  </button>
                  <button
                    type="button"
                    onClick={() => setLevel("Livello 10")}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-[#181b22] text-zinc-400 border border-[#272c38] hover:text-white"
                  >
                    Lv 10
                  </button>
                  <button
                    type="button"
                    onClick={() => setLevel("Livello 9")}
                    className="px-1.5 py-0.5 rounded text-[10px] bg-[#181b22] text-zinc-400 border border-[#272c38] hover:text-white"
                  >
                    Lv 9
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Numero di Giri (Laps)</label>
              <input
                type="number"
                min={1}
                max={40}
                required
                value={laps}
                onChange={(e) => setLaps(Number(e.target.value))}
                className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-white font-bold text-center text-sm focus:outline-none focus:border-[#e10600]"
              />
              <span className="text-[10px] text-zinc-500 block mt-1">
                Gara sprint (3-6 giri) o standard (7+ giri)
              </span>
            </div>
          </div>

          {/* LE 2 CARATTERISTICHE REALI DI F1 CLASH */}
          <div className="p-4 bg-[#0f1115] rounded-xl border border-[#272c38] space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#e10600]" />
                  <span>Caratteristiche del Circuito (Solo 2)</span>
                </span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  In F1 Clash ogni circuito ha 2 caratteristiche chiave tra le 7 possibili.
                </span>
              </div>
            </div>

            {/* Preview visiva dei 2 badge */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-[#14171d] border border-[#272c38]">
              <span className="text-[10px] text-zinc-500 uppercase font-bold">Attive:</span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border"
                style={{
                  backgroundColor: `${stat1Meta.color}20`,
                  borderColor: `${stat1Meta.color}60`,
                  color: stat1Meta.color,
                }}
              >
                1. {stat1Meta.label}
              </span>
              <span className="text-zinc-600 font-bold">+</span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border"
                style={{
                  backgroundColor: `${stat2Meta.color}20`,
                  borderColor: `${stat2Meta.color}60`,
                  color: stat2Meta.color,
                }}
              >
                2. {stat2Meta.label}
              </span>
            </div>

            {/* Menu a tendina per le 2 caratteristiche */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-zinc-400 mb-1 font-bold">
                  1ª Caratteristica
                </label>
                <select
                  value={stat1}
                  onChange={(e) => setStat1(e.target.value as TrackCharacteristic)}
                  className="w-full bg-[#181b22] border border-[#272c38] rounded-lg px-2.5 py-2 text-white font-bold focus:outline-none focus:border-[#e10600]"
                >
                  {TRACK_CHARACTERISTIC_LIST.map((c) => (
                    <option key={`s1-${c.key}`} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-bold">
                  2ª Caratteristica
                </label>
                <select
                  value={stat2}
                  onChange={(e) => setStat2(e.target.value as TrackCharacteristic)}
                  className="w-full bg-[#181b22] border border-[#272c38] rounded-lg px-2.5 py-2 text-white font-bold focus:outline-none focus:border-amber-400"
                >
                  {TRACK_CHARACTERISTIC_LIST.map((c) => (
                    <option key={`s2-${c.key}`} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick combos veloci */}
            <div className="pt-1">
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                Combo Rapide Frequenti:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickCombos.map((combo) => (
                  <button
                    key={combo.label}
                    type="button"
                    onClick={() => {
                      setStat1(combo.s1);
                      setStat2(combo.s2);
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                      stat1 === combo.s1 && stat2 === combo.s2
                        ? "bg-zinc-700 text-white border-white/40 shadow"
                        : "bg-[#181b22] text-zinc-400 border-[#272c38] hover:text-white"
                    }`}
                  >
                    {combo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Note Personali / Strategia Giri */}
          <div>
            <label className="block text-zinc-400 mb-1">Note Personali & Strategia Giri</label>
            <textarea
              rows={2}
              placeholder="es. 8 giri: 4 giri Soft + 4 giri Soft. Sosta consigliata al giro 4."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg p-2 text-white focus:outline-none focus:border-[#e10600]"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#272c38] hover:bg-[#323947] text-zinc-300 font-bold uppercase text-xs transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-bold uppercase text-xs shadow-lg transition-all"
            >
              {isDuplicate ? "Crea Copia Circuito" : editingTrack ? "Salva Modifiche" : "Crea Circuito"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
