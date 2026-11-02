"use client";

import React, { useState, useEffect } from "react";
import { Part, Driver, Boost, Track, LoadoutPreset, CalculatedLoadout } from "@/types/f1";
import {
  loadProfileData,
  saveProfileData,
  resetProfileToDefault,
} from "@/lib/storage";
import { Header, ActiveTab } from "@/components/Header";
import { OptimizerTab } from "@/components/OptimizerTab";
import { GarageTab } from "@/components/GarageTab";
import { TracksTab } from "@/components/TracksTab";
import { PresetsTab } from "@/components/PresetsTab";
import { AddElementModal } from "@/components/AddElementModal";
import { ImportExportModal } from "@/components/ImportExportModal";
import { CheckCircle2 } from "lucide-react";

export default function F1ClashOptimizerPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("garage");

  // Stato Principale
  const [parts, setParts] = useState<Part[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [boosts, setBoosts] = useState<Boost[]>([]);
  const [presets, setPresets] = useState<LoadoutPreset[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Setup calcolato attivo
  const [calculatedSetup, setCalculatedSetup] = useState<CalculatedLoadout | null>(null);

  // Modali
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialType, setAddModalInitialType] = useState<"part" | "driver" | "boost">("part");
  const [editingItem, setEditingItem] = useState<Part | Driver | Boost | null>(null);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  // Toast Notifica
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Caricamento iniziale da localStorage
  useEffect(() => {
    const data = loadProfileData();
    setParts(data.parts);
    setDrivers(data.drivers);
    setBoosts(data.boosts);
    setPresets(data.presets);
    setTracks(data.tracks);
    setIsLoaded(true);

    if (data.parts.length >= 6 && data.drivers.length >= 2) {
      setActiveTab("optimizer");
    } else {
      setActiveTab("garage");
    }
  }, []);

  // Salvataggio automatico continuo
  useEffect(() => {
    if (!isLoaded) return;
    saveProfileData(parts, drivers, boosts, presets, tracks);
  }, [parts, drivers, boosts, presets, tracks, isLoaded]);

  // Gestori Garage
  const handleUpdatePart = (updatedPart: Part) => {
    setParts((prev) => prev.map((p) => (p.id === updatedPart.id ? updatedPart : p)));
    showToast(`Componente ${updatedPart.name} aggiornato (Lv. ${updatedPart.level})`);
  };

  const handleUpdateDriver = (updatedDriver: Driver) => {
    setDrivers((prev) => prev.map((d) => (d.id === updatedDriver.id ? updatedDriver : d)));
    showToast(`Pilota ${updatedDriver.name} aggiornato (Lv. ${updatedDriver.level})`);
  };

  const handleUpdateBoost = (updatedBoost: Boost) => {
    setBoosts((prev) => prev.map((b) => (b.id === updatedBoost.id ? updatedBoost : b)));
  };

  const handleDeletePart = (id: string) => {
    setParts((prev) => prev.filter((p) => p.id !== id));
    showToast("Componente rimosso dal garage.");
  };

  const handleDeleteDriver = (id: string) => {
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    showToast("Pilota rimosso dal garage.");
  };

  const handleDeleteBoost = (id: string) => {
    setBoosts((prev) => prev.filter((b) => b.id !== id));
    showToast("Boost rimosso dall'inventario.");
  };

  const handleAddPart = (newPart: Part) => {
    setParts((prev) => [newPart, ...prev]);
    showToast(`Componente "${newPart.name}" aggiunto al garage!`);
  };

  const handleAddDriver = (newDriver: Driver) => {
    setDrivers((prev) => [newDriver, ...prev]);
    showToast(`Pilota "${newDriver.name}" aggiunto al garage!`);
  };

  const handleAddBoost = (newBoost: Boost) => {
    setBoosts((prev) => [newBoost, ...prev]);
    showToast(`Boost "${newBoost.name}" aggiunto all'inventario!`);
  };

  // Gestione Tracciati (Track Manager)
  const handleAddTrack = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
    showToast(`Circuito "${newTrack.name}" (${newTrack.level}) aggiunto!`);
  };

  const handleUpdateTrack = (updatedTrack: Track) => {
    setTracks((prev) => prev.map((t) => (t.id === updatedTrack.id ? updatedTrack : t)));
    showToast(`Circuito "${updatedTrack.name}" aggiornato!`);
  };

  const handleDeleteTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    showToast("Circuito eliminato dal Track Manager.");
  };

  // Gestione Preset
  const handleSavePreset = (newPreset: LoadoutPreset) => {
    setPresets((prev) => [newPreset, ...prev]);
    showToast(`Preset "${newPreset.name}" salvato con successo!`);
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    showToast("Preset eliminato.");
  };

  const handleUpdatePreset = (updated: LoadoutPreset) => {
    setPresets((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Preset "${updated.name}" modificato.`);
  };

  const handleLoadPresetToOptimizer = (preset: LoadoutPreset) => {
    setActiveTab("optimizer");
    showToast(`Caricato preset "${preset.name}" nell'ottimizzatore!`);
  };

  // Reset profilo
  const handleResetData = () => {
    if (
      confirm(
        "Sei sicuro di voler ripristinare il database? Verrà pulito l'inventario per farti inserire i tuoi dati."
      )
    ) {
      const reset = resetProfileToDefault();
      setParts(reset.parts);
      setDrivers(reset.drivers);
      setBoosts(reset.boosts);
      setPresets(reset.presets);
      setTracks(reset.tracks);
      setCalculatedSetup(null);
      setActiveTab("garage");
      showToast("Database ripristinato con successo!");
    }
  };

  // Apertura modale aggiungi/modifica elemento
  const handleOpenAddModal = (
    type: "part" | "driver" | "boost",
    item?: Part | Driver | Boost
  ) => {
    setAddModalInitialType(type);
    setEditingItem(item || null);
    setIsAddModalOpen(true);
  };

  // Importazione backup
  const handleImportSuccess = (data: {
    parts: Part[];
    drivers: Driver[];
    boosts: Boost[];
    presets: LoadoutPreset[];
    tracks: Track[];
  }) => {
    setParts(data.parts);
    setDrivers(data.drivers);
    setBoosts(data.boosts);
    setPresets(data.presets);
    setTracks(data.tracks);
    setCalculatedSetup(null);
    showToast("Profilo JSON importato con successo!");
  };

  const totalOwnedParts = parts.filter((p) => p.owned).length;
  const totalOwnedDrivers = drivers.filter((d) => d.owned).length;

  if (!isLoaded) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0f1115] text-zinc-400 font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#e10600] border-t-transparent rounded-full animate-spin" />
          <span>Inizializzazione Telemetria F1 Clash...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#0f1115] text-[#f1f3f5]">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onResetData={handleResetData}
        totalOwnedParts={totalOwnedParts}
        totalOwnedDrivers={totalOwnedDrivers}
        totalTracks={tracks.length}
        totalPresets={presets.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "optimizer" && (
          <OptimizerTab
            parts={parts}
            drivers={drivers}
            boosts={boosts}
            tracks={tracks}
            onUpdateTrack={handleUpdateTrack}
            onSavePreset={handleSavePreset}
            calculatedSetup={calculatedSetup}
            setCalculatedSetup={setCalculatedSetup}
            onNavigateToGarage={() => setActiveTab("garage")}
            onNavigateToTracks={() => setActiveTab("tracks")}
          />
        )}

        {activeTab === "garage" && (
          <GarageTab
            parts={parts}
            drivers={drivers}
            boosts={boosts}
            onUpdatePart={handleUpdatePart}
            onUpdateDriver={handleUpdateDriver}
            onUpdateBoost={handleUpdateBoost}
            onDeletePart={handleDeletePart}
            onDeleteDriver={handleDeleteDriver}
            onDeleteBoost={handleDeleteBoost}
            onOpenAddModal={handleOpenAddModal}
          />
        )}

        {activeTab === "tracks" && (
          <TracksTab
            tracks={tracks}
            onAddTrack={handleAddTrack}
            onUpdateTrack={handleUpdateTrack}
            onDeleteTrack={handleDeleteTrack}
          />
        )}

        {activeTab === "presets" && (
          <PresetsTab
            presets={presets}
            allParts={parts}
            allDrivers={drivers}
            allBoosts={boosts}
            onDeletePreset={handleDeletePreset}
            onUpdatePreset={handleUpdatePreset}
            onLoadPresetToOptimizer={handleLoadPresetToOptimizer}
            currentOptimizedSetup={calculatedSetup}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#272c38] bg-[#0c0e12] py-4 px-4 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>F1 Clash Setup & Loadout Optimizer • Gestione Dati Personali 100% Reali</span>
          <span className="text-zinc-600">
            Dati salvati in locale nel tuo browser • Backup/Ripristino JSON
          </span>
        </div>
      </footer>

      {/* Modale Aggiungi/Modifica Elemento */}
      <AddElementModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onAddPart={handleAddPart}
        onAddDriver={handleAddDriver}
        onAddBoost={handleAddBoost}
        onUpdatePart={handleUpdatePart}
        onUpdateDriver={handleUpdateDriver}
        onUpdateBoost={handleUpdateBoost}
        initialType={addModalInitialType}
        editingItem={editingItem}
      />

      {/* Modale Backup & Import/Export JSON */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        parts={parts}
        drivers={drivers}
        boosts={boosts}
        presets={presets}
        tracks={tracks}
        onImportSuccess={handleImportSuccess}
      />

      {/* Toast Notifiche */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#181b22] border border-[#e10600]/60 text-white font-mono text-xs shadow-2xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
