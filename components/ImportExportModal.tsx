"use client";

import React, { useState } from "react";
import { Part, Driver, Boost, Track, LoadoutPreset } from "@/types/f1";
import {
  downloadProfileBackup,
  exportProfileToJson,
  validateAndImportJson,
} from "@/lib/storage";
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  FileText,
  AlertCircle,
} from "lucide-react";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  parts: Part[];
  drivers: Driver[];
  boosts: Boost[];
  presets: LoadoutPreset[];
  tracks?: Track[];
  onImportSuccess: (data: {
    parts: Part[];
    drivers: Driver[];
    boosts: Boost[];
    presets: LoadoutPreset[];
    tracks: Track[];
  }) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  parts,
  drivers,
  boosts,
  presets,
  tracks,
  onImportSuccess,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"export" | "import">("export");
  const [jsonInput, setJsonInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentJsonString = exportProfileToJson(parts, drivers, boosts, presets, tracks);

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(currentJsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadProfileBackup(parts, drivers, boosts, presets, tracks);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!jsonInput.trim()) {
      setErrorMsg("Incolla un testo JSON o carica un file di backup valido.");
      return;
    }

    const result = validateAndImportJson(jsonInput);
    if (!result.success || !result.data) {
      setErrorMsg(result.error || "Impossibile analizzare il file di backup.");
      return;
    }

    setSuccessMsg(
      `Profilo importato con successo! ${result.data.parts.length} componenti, ${result.data.drivers.length} piloti, ${result.data.presets.length} preset aggiornati.`
    );
    onImportSuccess(result.data);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#181b22] border border-[#272c38] rounded-2xl shadow-2xl p-6 text-zinc-100">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-[#272c38]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#06b6d4]" />
            <h3 className="text-lg font-mono font-bold tracking-tight text-white">
              Gestione Backup & Profilo JSON
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-[#272c38] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex gap-2 my-4 bg-[#0f1115] p-1.5 rounded-xl border border-[#272c38]">
          <button
            onClick={() => {
              setActiveSubTab("export");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              activeSubTab === "export"
                ? "bg-[#06b6d4] text-black shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Esporta Profilo</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab("import");
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
              activeSubTab === "import"
                ? "bg-[#06b6d4] text-black shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importa Profilo</span>
          </button>
        </div>

        {/* Tab Esporta */}
        {activeSubTab === "export" && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 font-mono">
              Salva o copia l&apos;intero stato del tuo garage, livelli componenti, piloti, boost e
              preset salvati in un unico file JSON.
            </p>

            <div className="relative">
              <textarea
                readOnly
                value={currentJsonString}
                rows={8}
                className="w-full bg-[#0f1115] border border-[#272c38] rounded-xl p-3 text-xs font-mono text-zinc-300 focus:outline-none select-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#06b6d4] hover:bg-[#0891b2] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Scarica File .json</span>
              </button>

              <button
                onClick={handleCopyClipboard}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#272c38] hover:bg-[#323947] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copiato negli Appunti!" : "Copia negli Appunti"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Importa */}
        {activeSubTab === "import" && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 font-mono">
              Incolla il contenuto di un backup JSON oppure carica direttamente un file salvato in
              precedenza.
            </p>

            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:font-bold file:bg-[#272c38] file:text-zinc-200 hover:file:bg-[#323947] cursor-pointer"
              />
            </div>

            <div>
              <textarea
                placeholder="Incolla qui la stringa JSON del profilo..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={7}
                className="w-full bg-[#0f1115] border border-[#272c38] rounded-xl p-3 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#06b6d4]"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-mono">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              onClick={handleApplyImport}
              className="w-full py-2.5 rounded-xl bg-[#06b6d4] hover:bg-[#0891b2] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Applica e Sovrascrivi Garage
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
