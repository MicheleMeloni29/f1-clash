export type PartCategory =
  | "brakes"
  | "gearbox"
  | "rearWing"
  | "frontWing"
  | "suspension"
  | "engine";

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary";

export interface CarStats {
  speed: number;
  cornering: number;
  powerUnit: number;
  qualifying: number;
  pitStopTime: number; // in secondi (es. 0.45s) - più basso è meglio!
}

export interface DriverStats {
  overtaking: number;
  defending: number;
  qualifying: number;
  raceStart: number;
  tyreManagement: number;
}

export interface Part {
  id: string;
  name: string;
  category: PartCategory;
  rarity: Rarity;
  series: number;
  level: number;
  owned: boolean;
  stats: CarStats;
  previousStats?: CarStats;
}

export interface Driver {
  id: string;
  name: string;
  team: string;
  rarity: Rarity;
  series: number;
  level: number;
  owned: boolean;
  number?: number;
  flag: string;
  stats: DriverStats;
  previousStats?: DriverStats;
}

export type BoostStatKey = keyof CarStats | keyof DriverStats;

export interface BoostEffect {
  stat: BoostStatKey;
  value: number;
}

export interface Boost {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  quantity: number;
  available: boolean;
  color?: string;
  description?: string;
  effects: BoostEffect[];
}

// Le sole 7 caratteristiche possibili dei circuiti in F1 Clash
export type TrackCharacteristic =
  | "overtaking" // Sorpasso
  | "powerUnit" // Power Unit
  | "speed" // Velocità
  | "cornering" // Sterzata
  | "raceStart" // Partenza
  | "defending" // Difesa
  | "tyreManagement"; // Gestione Pneumatici

export interface TrackCharacteristicMeta {
  key: TrackCharacteristic;
  label: string;
  category: "car" | "driver";
  color: string;
}

export const TRACK_CHARACTERISTICS: Record<TrackCharacteristic, TrackCharacteristicMeta> = {
  overtaking: {
    key: "overtaking",
    label: "Sorpasso",
    category: "driver",
    color: "#f97316", // Arancio
  },
  powerUnit: {
    key: "powerUnit",
    label: "Power Unit",
    category: "car",
    color: "#a855f7", // Viola
  },
  speed: {
    key: "speed",
    label: "Velocità",
    category: "car",
    color: "#3b82f6", // Blu
  },
  cornering: {
    key: "cornering",
    label: "Sterzata",
    category: "car",
    color: "#10b981", // Smeraldo
  },
  raceStart: {
    key: "raceStart",
    label: "Partenza",
    category: "driver",
    color: "#eab308", // Giallo ambra
  },
  defending: {
    key: "defending",
    label: "Difesa",
    category: "driver",
    color: "#06b6d4", // Ciano
  },
  tyreManagement: {
    key: "tyreManagement",
    label: "Gestione Pneumatici",
    category: "driver",
    color: "#ec4899", // Rosa
  },
};

export const TRACK_CHARACTERISTIC_LIST: TrackCharacteristicMeta[] = [
  TRACK_CHARACTERISTICS.overtaking,
  TRACK_CHARACTERISTICS.powerUnit,
  TRACK_CHARACTERISTICS.speed,
  TRACK_CHARACTERISTICS.cornering,
  TRACK_CHARACTERISTICS.raceStart,
  TRACK_CHARACTERISTICS.defending,
  TRACK_CHARACTERISTICS.tyreManagement,
];

export interface Track {
  id: string;
  name: string;
  level: string; // es. "Livello 4", "Livello 9", "Gran Premio"
  laps: number; // numero di giri di gara in quel livello
  stat1: TrackCharacteristic; // Prima caratteristica del circuito (tra le 7)
  stat2: TrackCharacteristic; // Seconda caratteristica del circuito (tra le 7)
  notes?: string; // Note personali opzionali
}

export interface LoadoutPreset {
  id: string;
  name: string;
  tag: string;
  tagColor: string;
  parts: Record<PartCategory, string>;
  driver1Id: string;
  driver2Id: string;
  driver1BoostId?: string;
  driver2BoostId?: string;
  customNotes: string;
  createdAt: string;
  updatedAt: string;
}

export type OptimizationMode = "track" | "overall" | "custom";

export interface CustomWeights {
  car: {
    speed: number;
    cornering: number;
    powerUnit: number;
    qualifying: number;
    pitStopTime: number;
  };
  driver: {
    overtaking: number;
    defending: number;
    qualifying: number;
    raceStart: number;
    tyreManagement: number;
  };
  teamScoreCapEnabled: boolean;
  teamScoreCap: number;
}

export interface BoostRecommendation {
  synergic?: Boost;
  compensatory?: Boost;
  selectedId?: string;
}

export interface CalculatedLoadout {
  parts: Record<PartCategory, Part>;
  driver1: Driver;
  driver2: Driver;
  recommendedBoosts?: {
    driver1: BoostRecommendation;
    driver2: BoostRecommendation;
  };
  driver1Boost?: Boost;
  driver2Boost?: Boost;
  baseCarStats: CarStats;
  baseDriver1Stats: DriverStats;
  baseDriver2Stats: DriverStats;
  boostedCarStats: CarStats;
  boostedDriver1Stats: DriverStats;
  boostedDriver2Stats: DriverStats;
  baseTeamScore: number;
  boostedTeamScore: number;
  scoreBreakdown: {
    carScore: number;
    driver1Score: number;
    driver2Score: number;
  };
  strategyAdvice: string[];
}

export interface AppProfileData {
  version: string;
  lastUpdated: string;
  parts: Part[];
  drivers: Driver[];
  boosts: Boost[];
  presets: LoadoutPreset[];
  tracks: Track[];
}
