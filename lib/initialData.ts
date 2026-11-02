import { Part, Driver, Boost, Track, LoadoutPreset } from "@/types/f1";

// Array puliti: l'utente inserisce solo i suoi veri dati di gioco
export const initialParts: Part[] = [];
export const initialDrivers: Driver[] = [];
export const initialBoosts: Boost[] = [];
export const initialPresets: LoadoutPreset[] = [];

// 1 Circuito di esempio modificabile/eliminabile con le 2 caratteristiche reali di F1 Clash
export const initialTracks: Track[] = [
  {
    id: "sample-monza-9",
    name: "Monza",
    level: "Livello 9",
    laps: 8,
    stat1: "speed", // Velocità
    stat2: "powerUnit", // Power Unit
    notes: "Circuito ultra veloce: priorità assoluta a Velocità e Power Unit.",
  },
];
export const officialF1Circuits: Array<{ name: string; flag: string }> = [
  { name: "Monza", flag: "🇮🇹" },
  { name: "Monaco", flag: "🇲🇨" },
  { name: "Silverstone", flag: "🇬🇧" },
  { name: "Spa", flag: "🇧🇪" },
  { name: "Suzuka", flag: "🇯🇵" },
  { name: "Sao Paulo", flag: "🇧🇷" },
  { name: "Sakhir", flag: "🇧🇭" },
  { name: "Jeddah", flag: "🇸🇦" },
  { name: "Melbourne", flag: "🇦🇺" },
  { name: "Baku", flag: "🇦🇿" },
  { name: "Miami", flag: "🇺🇸" },
  { name: "Barcellona", flag: "🇪🇸" },
  { name: "Madrid", flag: "🇪🇸" },
  { name: "Montreal", flag: "🇨🇦" },
  { name: "Spielberg", flag: "🇦🇹" },
  { name: "Hungaroring", flag: "🇭🇺" },
  { name: "Zandvoort", flag: "🇳🇱" },
  { name: "Singapore", flag: "🇸🇬" },
  { name: "Austin", flag: "🇺🇸" },
  { name: "Città del Messico", flag: "🇲🇽" },
  { name: "Las Vegas", flag: "🇺🇸" },
  { name: "Abu Dhabi", flag: "🇦🇪" },
  { name: "Shanghai", flag: "🇨🇳" },
];

