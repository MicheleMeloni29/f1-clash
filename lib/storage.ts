import { Part, Driver, Boost, Track, LoadoutPreset, AppProfileData } from "@/types/f1";
import { initialTracks, initialParts, initialDrivers, initialBoosts, initialPresets } from "./initialData";

const STORAGE_KEY = "f1_clash_custom_profile_v3";
const CURRENT_VERSION = "3.0.0";

export function loadProfileData(): {
  parts: Part[];
  drivers: Driver[];
  boosts: Boost[];
  presets: LoadoutPreset[];
  tracks: Track[];
} {
  if (typeof window === "undefined") {
    return {
      parts: initialParts,
      drivers: initialDrivers,
      boosts: initialBoosts,
      presets: initialPresets,
      tracks: initialTracks,
    };
  }

  try {
    // Controllo migrazione da versioni precedenti
    const v2Raw = localStorage.getItem("f1_clash_custom_profile_v2");
    const currentRaw = localStorage.getItem(STORAGE_KEY);

    let parsed: Partial<AppProfileData> | null = null;
    if (currentRaw) {
      parsed = JSON.parse(currentRaw);
    } else if (v2Raw) {
      try {
        const v2Parsed = JSON.parse(v2Raw);
        parsed = {
          parts: v2Parsed.parts,
          drivers: v2Parsed.drivers,
          boosts: v2Parsed.boosts,
          presets: v2Parsed.presets,
          tracks: initialTracks, // Usa il nuovo modello Track
        };
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      const defaultData: AppProfileData = {
        version: CURRENT_VERSION,
        lastUpdated: new Date().toISOString(),
        parts: [],
        drivers: [],
        boosts: [],
        presets: [],
        tracks: initialTracks,
      };
      saveProfileData(defaultData.parts, defaultData.drivers, defaultData.boosts, defaultData.presets, defaultData.tracks);
      return {
        parts: [],
        drivers: [],
        boosts: [],
        presets: [],
        tracks: initialTracks,
      };
    }

    const cleanParts = Array.isArray(parsed.parts)
      ? parsed.parts.filter((p) => !p.id.startsWith("br-") && !p.id.startsWith("gb-") && !p.id.startsWith("rw-") && !p.id.startsWith("fw-") && !p.id.startsWith("su-") && !p.id.startsWith("en-"))
      : [];

    const cleanDrivers = Array.isArray(parsed.drivers)
      ? parsed.drivers.filter((d) => !d.id.startsWith("drv-"))
      : [];

    const cleanBoosts = Array.isArray(parsed.boosts)
      ? parsed.boosts.filter((b) => !b.id.startsWith("bst-"))
      : [];

    const cleanPresets = Array.isArray(parsed.presets)
      ? parsed.presets.filter((pre) => !pre.id.startsWith("pre-"))
      : [];

    // Verifica compatibilità modello Track (2 caratteristiche reali di F1 Clash: stat1 e stat2)
    let tracks: Track[] = initialTracks;
    if (Array.isArray(parsed.tracks) && parsed.tracks.length > 0) {
      tracks = parsed.tracks.map((t: any, index: number) => {
        // Se ha già stat1 e stat2, è conforme al modello
        if (t.stat1 && t.stat2) {
          return t as Track;
        }

        // Migrazione automatica da modelli precedenti
        let s1: any = "speed";
        let s2: any = "powerUnit";

        if (t.optimalCarStat && ["speed", "cornering", "powerUnit"].includes(t.optimalCarStat)) {
          s1 = t.optimalCarStat;
        }
        if (t.optimalDriverStat && ["overtaking", "defending", "raceStart", "tyreManagement"].includes(t.optimalDriverStat)) {
          s2 = t.optimalDriverStat;
        }

        return {
          id: t.id || `track-${Date.now()}-${index}`,
          name: t.name || "Monza",
          level: t.level || "Livello 9",
          laps: Number(t.laps) || 8,
          stat1: s1,
          stat2: s2,
          notes: t.notes || "",
        } as Track;
      });
    }

    return {
      parts: cleanParts,
      drivers: cleanDrivers,
      boosts: cleanBoosts,
      presets: cleanPresets,
      tracks,
    };
  } catch (err) {
    console.error("Errore nel caricamento del profilo da localStorage:", err);
    return {
      parts: [],
      drivers: [],
      boosts: [],
      presets: [],
      tracks: initialTracks,
    };
  }
}

export function saveProfileData(
  parts: Part[],
  drivers: Driver[],
  boosts: Boost[],
  presets: LoadoutPreset[],
  tracks: Track[] = initialTracks
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const profile: AppProfileData = {
      version: CURRENT_VERSION,
      lastUpdated: new Date().toISOString(),
      parts,
      drivers,
      boosts,
      presets,
      tracks,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (err) {
    console.error("Errore salvataggio dati in localStorage:", err);
    return false;
  }
}

export function exportProfileToJson(
  parts: Part[],
  drivers: Driver[],
  boosts: Boost[],
  presets: LoadoutPreset[],
  tracks: Track[] = initialTracks
): string {
  const profile: AppProfileData = {
    version: CURRENT_VERSION,
    lastUpdated: new Date().toISOString(),
    parts,
    drivers,
    boosts,
    presets,
    tracks,
  };
  return JSON.stringify(profile, null, 2);
}

export function downloadProfileBackup(
  parts: Part[],
  drivers: Driver[],
  boosts: Boost[],
  presets: LoadoutPreset[],
  tracks: Track[] = initialTracks
) {
  const json = exportProfileToJson(parts, drivers, boosts, presets, tracks);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `f1-clash-custom-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateAndImportJson(rawJson: string): {
  success: boolean;
  data?: {
    parts: Part[];
    drivers: Driver[];
    boosts: Boost[];
    presets: LoadoutPreset[];
    tracks: Track[];
  };
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJson);

    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Il file JSON fornito non contiene un oggetto valido." };
    }

    if (!Array.isArray(parsed.parts) || !Array.isArray(parsed.drivers)) {
      return {
        success: false,
        error: "Struttura dati non valida nel file di backup.",
      };
    }

    const parts: Part[] = parsed.parts;
    const drivers: Driver[] = parsed.drivers;
    const boosts: Boost[] = Array.isArray(parsed.boosts) ? parsed.boosts : [];
    const presets: LoadoutPreset[] = Array.isArray(parsed.presets) ? parsed.presets : [];
    const tracks: Track[] = Array.isArray(parsed.tracks) && parsed.tracks.length > 0 ? parsed.tracks : initialTracks;

    saveProfileData(parts, drivers, boosts, presets, tracks);

    return {
      success: true,
      data: { parts, drivers, boosts, presets, tracks },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Errore sconosciuto";
    return { success: false, error: `Sintassi JSON non valida: ${msg}` };
  }
}

export function resetProfileToDefault(): {
  parts: Part[];
  drivers: Driver[];
  boosts: Boost[];
  presets: LoadoutPreset[];
  tracks: Track[];
} {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("f1_clash_custom_profile_v2");
    localStorage.removeItem("f1_clash_optimizer_data_v1");
  }
  saveProfileData([], [], [], [], initialTracks);
  return {
    parts: [],
    drivers: [],
    boosts: [],
    presets: [],
    tracks: initialTracks,
  };
}
