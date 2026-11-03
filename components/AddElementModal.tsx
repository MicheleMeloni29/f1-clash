"use client";

import React, { useState, useEffect } from "react";
import { Part, Driver, Boost, PartCategory, Rarity, BoostStatKey } from "@/types/f1";
import { X, Plus, Wrench, User, Zap, Save } from "lucide-react";

interface AddElementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPart: (part: Part) => void;
  onAddDriver: (driver: Driver) => void;
  onAddBoost: (boost: Boost) => void;
  onUpdatePart?: (part: Part) => void;
  onUpdateDriver?: (driver: Driver) => void;
  onUpdateBoost?: (boost: Boost) => void;
  initialType?: "part" | "driver" | "boost";
  editingItem?: Part | Driver | Boost | null;
}

export const AddElementModal: React.FC<AddElementModalProps> = ({
  isOpen,
  onClose,
  onAddPart,
  onAddDriver,
  onAddBoost,
  onUpdatePart,
  onUpdateDriver,
  onUpdateBoost,
  initialType = "part",
  editingItem = null,
}) => {
  const [modalType, setModalType] = useState<"part" | "driver" | "boost">(initialType);

  // Form Componente
  const [partName, setPartName] = useState("");
  const [partCategory, setPartCategory] = useState<PartCategory>("brakes");
  const [partRarity, setPartRarity] = useState<Rarity>("Epic");
  const [partSeries, setPartSeries] = useState(8);
  const [partLevel, setPartLevel] = useState(5);
  const [partOwned, setPartOwned] = useState(true);
  const [partSpeed, setPartSpeed] = useState(45);
  const [partCornering, setPartCornering] = useState(45);
  const [partPowerUnit, setPartPowerUnit] = useState(45);
  const [partQualifying, setPartQualifying] = useState(45);
  const [partPitStop, setPartPitStop] = useState(0.45);
  const [partOvertakeMode, setPartOvertakeMode] = useState(50);

  // Form Pilota
  const [driverName, setDriverName] = useState("");
  const [driverTeam, setDriverTeam] = useState("");
  const [driverRarity, setDriverRarity] = useState<Rarity>("Epic");
  const [driverSeries, setDriverSeries] = useState(9);
  const [driverLevel, setDriverLevel] = useState(5);
  const [driverFlag, setDriverFlag] = useState("🏎️");
  const [driverOwned, setDriverOwned] = useState(true);
  const [driverOvertaking, setDriverOvertaking] = useState(60);
  const [driverDefending, setDriverDefending] = useState(60);
  const [driverQualifying, setDriverQualifying] = useState(60);
  const [driverRaceStart, setDriverRaceStart] = useState(60);
  const [driverTyreManagement, setDriverTyreManagement] = useState(60);

  // Form Boost
  const [boostName, setBoostName] = useState("");
  const [boostTier, setBoostTier] = useState<1 | 2 | 3 | 4>(3);
  const [boostQuantity, setBoostQuantity] = useState(10);
  const [boostDescription, setBoostDescription] = useState("");
  const [boostStat1, setBoostStat1] = useState<BoostStatKey>("speed");
  const [boostVal1, setBoostVal1] = useState(20);
  const [boostStat2, setBoostStat2] = useState<BoostStatKey>("overtaking");
  const [boostVal2, setBoostVal2] = useState(15);

  // Inizializza se è in modalità modifica
  useEffect(() => {
    if (editingItem) {
      if ("category" in editingItem) {
        setModalType("part");
        const p = editingItem as Part;
        setPartName(p.name);
        setPartCategory(p.category);
        setPartRarity(p.rarity);
        setPartSeries(p.series);
        setPartLevel(p.level);
        setPartOwned(p.owned);
        setPartSpeed(p.stats.speed);
        setPartCornering(p.stats.cornering);
        setPartPowerUnit(p.stats.powerUnit);
        setPartQualifying(p.stats.qualifying);
        setPartPitStop(p.stats.pitStopTime);
        setPartOvertakeMode(p.stats.overtakeMode ?? 50);
      } else if ("flag" in editingItem) {
        setModalType("driver");
        const d = editingItem as Driver;
        setDriverName(d.name);
        setDriverTeam(d.team || "");
        setDriverFlag(d.flag || "🏎️");
        setDriverRarity(d.rarity);
        setDriverSeries(d.series);
        setDriverLevel(d.level);
        setDriverOwned(d.owned);
        setDriverOvertaking(d.stats.overtaking);
        setDriverDefending(d.stats.defending);
        setDriverQualifying(d.stats.qualifying);
        setDriverRaceStart(d.stats.raceStart);
        setDriverTyreManagement(d.stats.tyreManagement);
      } else if ("effects" in editingItem) {
        setModalType("boost");
        const b = editingItem as Boost;
        setBoostName(b.name);
        setBoostTier(b.tier);
        setBoostQuantity(b.quantity);
        setBoostDescription(b.description || "");
        if (b.effects[0]) {
          setBoostStat1(b.effects[0].stat);
          setBoostVal1(b.effects[0].value);
        }
        if (b.effects[1]) {
          setBoostStat2(b.effects[1].stat);
          setBoostVal2(b.effects[1].value);
        }
      }
    } else {
      setModalType(initialType);
    }
  }, [editingItem, initialType, isOpen]);

  if (!isOpen) return null;

  const handleCreateOrUpdatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;

    const partData: Part = {
      id: editingItem ? editingItem.id : `custom-part-${Date.now()}`,
      name: partName.trim(),
      category: partCategory,
      rarity: partRarity,
      series: Number(partSeries),
      level: Number(partLevel),
      owned: partOwned,
      stats: {
        speed: Number(partSpeed),
        cornering: Number(partCornering),
        powerUnit: Number(partPowerUnit),
        qualifying: Number(partQualifying),
        pitStopTime: Number(partPitStop),
        overtakeMode: partCategory === "battery" ? Number(partOvertakeMode) : undefined,
      },
      previousStats: editingItem && "stats" in editingItem ? (editingItem as Part).stats : undefined,
    };

    if (editingItem && onUpdatePart) {
      onUpdatePart(partData);
    } else {
      onAddPart(partData);
    }
    onClose();
  };

  const handleCreateOrUpdateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName.trim()) return;

    const driverData: Driver = {
      id: editingItem ? editingItem.id : `custom-driver-${Date.now()}`,
      name: driverName.trim(),
      team: driverTeam.trim() || undefined,
      rarity: driverRarity,
      series: Number(driverSeries),
      level: Number(driverLevel),
      owned: driverOwned,
      flag: driverFlag || "🏎️",
      stats: {
        overtaking: Number(driverOvertaking),
        defending: Number(driverDefending),
        qualifying: Number(driverQualifying),
        raceStart: Number(driverRaceStart),
        tyreManagement: Number(driverTyreManagement),
      },
      previousStats: editingItem && "stats" in editingItem ? (editingItem as Driver).stats : undefined,
    };

    if (editingItem && onUpdateDriver) {
      onUpdateDriver(driverData);
    } else {
      onAddDriver(driverData);
    }
    onClose();
  };

  const handleCreateOrUpdateBoost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boostName.trim()) return;

    const boostData: Boost = {
      id: editingItem ? editingItem.id : `custom-boost-${Date.now()}`,
      name: boostName.trim(),
      tier: boostTier,
      quantity: Number(boostQuantity),
      available: Number(boostQuantity) > 0,
      color: boostTier === 4 ? "#a855f7" : boostTier === 3 ? "#06b6d4" : "#e10600",
      description: boostDescription || "Potenziamento personalizzato.",
      effects: [
        { stat: boostStat1, value: Number(boostVal1) },
        { stat: boostStat2, value: Number(boostVal2) },
      ],
    };

    if (editingItem && onUpdateBoost) {
      onUpdateBoost(boostData);
    } else {
      onAddBoost(boostData);
    }
    onClose();
  };

  const statOptions: Array<{ key: BoostStatKey; label: string }> = [
    { key: "speed", label: "Velocità (Auto)" },
    { key: "cornering", label: "Curva (Auto)" },
    { key: "powerUnit", label: "Power Unit (Auto)" },
    { key: "qualifying", label: "Qualifica" },
    { key: "pitStopTime", label: "Tempo Pit Stop (-sec)" },
    { key: "overtakeMode", label: "Modalità Overtake (Batteria)" },
    { key: "overtaking", label: "Sorpasso (Pilota)" },
    { key: "defending", label: "Difesa (Pilota)" },
    { key: "raceStart", label: "Partenza (Pilota)" },
    { key: "tyreManagement", label: "Gestione Gomme" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#181b22] border border-[#272c38] rounded-2xl shadow-2xl p-6 text-zinc-100">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-[#272c38]">
          <div className="flex items-center gap-2">
            {editingItem ? (
              <Save className="w-5 h-5 text-[#06b6d4]" />
            ) : (
              <Plus className="w-5 h-5 text-[#e10600]" />
            )}
            <h3 className="text-base font-mono font-bold tracking-tight text-white uppercase">
              {editingItem ? "Modifica Elemento" : "Aggiungi al Garage"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#272c38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Type (solo se non si sta modificando) */}
        {!editingItem && (
          <div className="flex gap-2 my-4 bg-[#0f1115] p-1.5 rounded-xl border border-[#272c38]">
            <button
              type="button"
              onClick={() => setModalType("part")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                modalType === "part"
                  ? "bg-[#e10600] text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Componente</span>
            </button>

            <button
              type="button"
              onClick={() => setModalType("driver")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                modalType === "driver"
                  ? "bg-[#e10600] text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Pilota</span>
            </button>

            <button
              type="button"
              onClick={() => setModalType("boost")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                modalType === "boost"
                  ? "bg-[#e10600] text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Boost</span>
            </button>
          </div>
        )}

        {/* --- FORM COMPONENTE --- */}
        {modalType === "part" && (
          <form onSubmit={handleCreateOrUpdatePart} className="space-y-4 text-xs font-mono mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Nome Componente</label>
                <input
                  type="text"
                  required
                  placeholder="es. Boombox, Vortex, Freni Apex"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Categoria Auto</label>
                <select
                  value={partCategory}
                  onChange={(e) => setPartCategory(e.target.value as PartCategory)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                >
                  <option value="brakes">Freni (Brakes)</option>
                  <option value="gearbox">Cambio (Gearbox)</option>
                  <option value="rearWing">Alettone Posteriore</option>
                  <option value="frontWing">Alettone Anteriore</option>
                  <option value="suspension">Sospensioni</option>
                  <option value="engine">Motore (Engine)</option>
                  <option value="battery">⚡ Batteria (Battery)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Rarità</label>
                <select
                  value={partRarity}
                  onChange={(e) => setPartRarity(e.target.value as Rarity)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                >
                  <option value="Common">🔵 Comune (Azzurro)</option>
                  <option value="Rare">🟠 Raro (Arancio)</option>
                  <option value="Epic">🟣 Epico (Viola)</option>
                  <option value="Legendary">📜 Leggendario (Beige)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Serie (1-12)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={partSeries}
                    onChange={(e) => setPartSeries(Number(e.target.value))}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Livello Attuale</label>
                  <input
                    type="number"
                    min={1}
                    max={11}
                    value={partLevel}
                    onChange={(e) => setPartLevel(Number(e.target.value))}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                  />
                </div>
              </div>
            </div>

            {/* Inserimento diretto statistiche reali */}
            <div className="p-3 bg-[#0f1115] rounded-xl border border-[#272c38] space-y-3">
              <span className="text-[11px] font-bold uppercase text-[#06b6d4] block">
                Statistiche Reali al Livello {partLevel} (da F1 Clash)
              </span>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Velocità</label>
                  <input
                    type="number"
                    required
                    value={partSpeed}
                    onChange={(e) => setPartSpeed(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Curva</label>
                  <input
                    type="number"
                    required
                    value={partCornering}
                    onChange={(e) => setPartCornering(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Power Unit</label>
                  <input
                    type="number"
                    required
                    value={partPowerUnit}
                    onChange={(e) => setPartPowerUnit(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Qualifica</label>
                  <input
                    type="number"
                    required
                    value={partQualifying}
                    onChange={(e) => setPartQualifying(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Pit Stop (sec)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={partPitStop}
                    onChange={(e) => setPartPitStop(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-[#06b6d4] font-bold text-center"
                  />
                </div>
              </div>

              {partCategory === "battery" && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                    <span>⚡</span> Modalità Overtake (Statistica Esclusiva Batteria)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={partOvertakeMode}
                    onChange={(e) => setPartOvertakeMode(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-amber-500/40 rounded px-2.5 py-1.5 text-sm font-mono text-amber-300 font-bold text-center focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Statistica chiave delle batterie in F1 Clash: si somma all&apos;assetto auto e al Team Score complessivo.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="partOwned"
                checked={partOwned}
                onChange={(e) => setPartOwned(e.target.checked)}
                className="w-4 h-4 rounded text-[#e10600] bg-[#0f1115] border-[#272c38] focus:ring-0"
              />
              <label htmlFor="partOwned" className="text-zinc-300 cursor-pointer">
                Segna come Già Posseduto nel Garage
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold uppercase text-xs tracking-wider shadow-lg transition-all"
            >
              {editingItem ? "Salva Modifiche Componente" : "Aggiungi Componente al Garage"}
            </button>
          </form>
        )}

        {/* --- FORM PILOTA --- */}
        {modalType === "driver" && (
          <form onSubmit={handleCreateOrUpdateDriver} className="space-y-4 text-xs font-mono mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Nome Pilota</label>
                <input
                  type="text"
                  required
                  placeholder="es. Verstappen, Leclerc, Hamilton"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Rarità</label>
                <select
                  value={driverRarity}
                  onChange={(e) => setDriverRarity(e.target.value as Rarity)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                >
                  <option value="Common">🔵 Comune (Azzurro)</option>
                  <option value="Rare">🟠 Raro (Arancio)</option>
                  <option value="Epic">🟣 Epico (Viola)</option>
                  <option value="Legendary">📜 Leggendario (Beige)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Serie (1-12)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={driverSeries}
                    onChange={(e) => setDriverSeries(Number(e.target.value))}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Livello</label>
                  <input
                    type="number"
                    min={1}
                    max={11}
                    value={driverLevel}
                    onChange={(e) => setDriverLevel(Number(e.target.value))}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Icona/Emoji</label>
                  <input
                    type="text"
                    value={driverFlag}
                    onChange={(e) => setDriverFlag(e.target.value)}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-center"
                  />
                </div>
              </div>
            </div>

            {/* Inserimento diretto statistiche pilota */}
            <div className="p-3 bg-[#0f1115] rounded-xl border border-[#272c38] space-y-3">
              <span className="text-[11px] font-bold uppercase text-[#06b6d4] block">
                Statistiche Reali Pilota al Livello {driverLevel}
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Sorpasso</label>
                  <input
                    type="number"
                    required
                    value={driverOvertaking}
                    onChange={(e) => setDriverOvertaking(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Difesa</label>
                  <input
                    type="number"
                    required
                    value={driverDefending}
                    onChange={(e) => setDriverDefending(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Qualifica</label>
                  <input
                    type="number"
                    required
                    value={driverQualifying}
                    onChange={(e) => setDriverQualifying(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Partenza</label>
                  <input
                    type="number"
                    required
                    value={driverRaceStart}
                    onChange={(e) => setDriverRaceStart(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-white text-center"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-0.5">Gestione Gomme</label>
                  <input
                    type="number"
                    required
                    value={driverTyreManagement}
                    onChange={(e) => setDriverTyreManagement(Number(e.target.value))}
                    className="w-full bg-[#181b22] border border-[#272c38] rounded px-2.5 py-1.5 text-sm font-mono text-emerald-400 font-bold text-center"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="driverOwned"
                checked={driverOwned}
                onChange={(e) => setDriverOwned(e.target.checked)}
                className="w-4 h-4 rounded text-[#e10600] bg-[#0f1115] border-[#272c38] focus:ring-0"
              />
              <label htmlFor="driverOwned" className="text-zinc-300 cursor-pointer">
                Segna come Già Posseduto nel Garage
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold uppercase text-xs tracking-wider shadow-lg transition-all"
            >
              {editingItem ? "Salva Modifiche Pilota" : "Aggiungi Pilota al Garage"}
            </button>
          </form>
        )}

        {/* --- FORM BOOST --- */}
        {modalType === "boost" && (
          <form onSubmit={handleCreateOrUpdateBoost} className="space-y-4 text-xs font-mono mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1">Nome Boost</label>
                <input
                  type="text"
                  required
                  placeholder="es. Titanio, Zefiro, Corsa"
                  value={boostName}
                  onChange={(e) => setBoostName(e.target.value)}
                  className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 mb-1">Tier (1-4)</label>
                  <select
                    value={boostTier}
                    onChange={(e) => setBoostTier(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                  >
                    <option value={1}>Tier 1</option>
                    <option value={2}>Tier 2</option>
                    <option value={3}>Tier 3</option>
                    <option value={4}>Tier 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Quantità</label>
                  <input
                    type="number"
                    min={0}
                    value={boostQuantity}
                    onChange={(e) => setBoostQuantity(Number(e.target.value))}
                    className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Descrizione Tattica</label>
              <input
                type="text"
                placeholder="es. Ottimo per rettilinei lunghi e sorpasso"
                value={boostDescription}
                onChange={(e) => setBoostDescription(e.target.value)}
                className="w-full bg-[#0f1115] border border-[#272c38] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#e10600]"
              />
            </div>

            <div className="p-3 bg-[#0f1115] rounded-xl border border-[#272c38] space-y-3">
              <span className="text-[11px] font-bold uppercase text-[#a855f7] block">
                Bonus Statistiche (1 o 2 Statistiche Potenziate)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex gap-2 items-center">
                  <select
                    value={boostStat1}
                    onChange={(e) => setBoostStat1(e.target.value as BoostStatKey)}
                    className="flex-1 bg-[#181b22] border border-[#272c38] rounded px-2 py-1.5 text-xs text-white"
                  >
                    {statOptions.map((opt) => (
                      <option key={`bopt1-${opt.key}`} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={boostVal1}
                    onChange={(e) => setBoostVal1(Number(e.target.value))}
                    className="w-16 bg-[#181b22] border border-[#272c38] rounded px-2 py-1.5 text-xs text-center text-white"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <select
                    value={boostStat2}
                    onChange={(e) => setBoostStat2(e.target.value as BoostStatKey)}
                    className="flex-1 bg-[#181b22] border border-[#272c38] rounded px-2 py-1.5 text-xs text-white"
                  >
                    {statOptions.map((opt) => (
                      <option key={`bopt2-${opt.key}`} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={boostVal2}
                    onChange={(e) => setBoostVal2(Number(e.target.value))}
                    className="w-16 bg-[#181b22] border border-[#272c38] rounded px-2 py-1.5 text-xs text-center text-white"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#e10600] hover:bg-[#c50500] text-white font-mono font-bold uppercase text-xs tracking-wider shadow-lg transition-all"
            >
              {editingItem ? "Salva Modifiche Boost" : "Aggiungi Boost all'Inventario"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
