import {
  Part,
  Driver,
  Boost,
  Track,
  TrackCharacteristic,
  TRACK_CHARACTERISTICS,
  PartCategory,
  CarStats,
  DriverStats,
  CalculatedLoadout,
  CustomWeights,
  OptimizationMode,
  LoadoutPreset,
} from "@/types/f1";

export const PART_CATEGORIES: PartCategory[] = [
  "brakes",
  "gearbox",
  "rearWing",
  "frontWing",
  "suspension",
  "engine",
  "battery",
];

export interface PitstopEstimation {
  minStops: number;
  maxStops: number;
  avgStops: number;
  label: string;
}

/**
 * Tabella stima pit stop basata rigorosamente sul numero di giri della gara in F1 Clash:
 * 4 giri: da 0 a 1 pitstop
 * 5 giri: da 0 a 2 pitstop
 * 6 giri: da 1 a 2 pitstop
 * 7 giri: da 1 a 3 pitstop
 * 8 giri: da 1 a 3 pitstop
 * 9 giri: da 1 a 4 pitstop
 * 10 giri: da 2 a 4 pitstop
 */
export function getPitstopEstimation(laps: number): PitstopEstimation {
  if (laps <= 3) {
    return { minStops: 0, maxStops: 0, avgStops: 0, label: "0 soste (Sprint breve)" };
  }
  switch (laps) {
    case 4:
      return { minStops: 0, maxStops: 1, avgStops: 0.5, label: "0 - 1 sosta" };
    case 5:
      return { minStops: 0, maxStops: 2, avgStops: 1.0, label: "0 - 2 soste" };
    case 6:
      return { minStops: 1, maxStops: 2, avgStops: 1.5, label: "1 - 2 soste" };
    case 7:
      return { minStops: 1, maxStops: 3, avgStops: 2.0, label: "1 - 3 soste" };
    case 8:
      return { minStops: 1, maxStops: 3, avgStops: 2.0, label: "1 - 3 soste" };
    case 9:
      return { minStops: 1, maxStops: 4, avgStops: 2.5, label: "1 - 4 soste" };
    case 10:
      return { minStops: 2, maxStops: 4, avgStops: 3.0, label: "2 - 4 soste" };
    default:
      if (laps > 10) {
        return { minStops: 2, maxStops: 4, avgStops: 3.0, label: "2 - 4 soste (Endurance)" };
      }
      return { minStops: 1, maxStops: 2, avgStops: 1.5, label: "1 - 2 soste" };
  }
}

export function getPartStatsAtLevel(part: Part): CarStats {
  return part.stats;
}

export function getDriverStatsAtLevel(driver: Driver): DriverStats {
  return driver.stats;
}

export function calculateCarStats(parts: Record<PartCategory, Part>): CarStats {
  const categories = PART_CATEGORIES;

  let speed = 0;
  let cornering = 0;
  let powerUnit = 0;
  let qualifying = 0;
  let pitStopTimeSum = 0;
  let count = 0;

  for (const cat of categories) {
    const part = parts[cat];
    if (part) {
      count++;
      const stats = part.stats;
      speed += stats.speed;
      cornering += stats.cornering;
      powerUnit += stats.powerUnit;
      qualifying += stats.qualifying;
      pitStopTimeSum += stats.pitStopTime;
    }
  }

  const avgPitStopTime = count > 0 ? Number((pitStopTimeSum / count).toFixed(2)) : 0.45;
  const overtakeMode = parts.battery?.stats.overtakeMode || 0;

  return {
    speed,
    cornering,
    powerUnit,
    qualifying,
    pitStopTime: avgPitStopTime,
    overtakeMode,
  };
}

export function calculateTeamScore(
  carStats: CarStats,
  driver1Stats: DriverStats,
  driver2Stats: DriverStats
): {
  total: number;
  carScore: number;
  driver1Score: number;
  driver2Score: number;
} {
  const pitBonus = Math.max(0, Math.round((0.9 - carStats.pitStopTime) * 120));
  const carScore =
    carStats.speed +
    carStats.cornering +
    carStats.powerUnit +
    carStats.qualifying +
    (carStats.overtakeMode || 0) +
    pitBonus;

  const driver1Score =
    driver1Stats.overtaking +
    driver1Stats.defending +
    driver1Stats.qualifying +
    driver1Stats.raceStart +
    driver1Stats.tyreManagement;

  const driver2Score =
    driver2Stats.overtaking +
    driver2Stats.defending +
    driver2Stats.qualifying +
    driver2Stats.raceStart +
    driver2Stats.tyreManagement;

  return {
    total: carScore + driver1Score + driver2Score,
    carScore,
    driver1Score,
    driver2Score,
  };
}

export function applyBoostToStats(
  baseCar: CarStats,
  baseDriver1: DriverStats,
  baseDriver2: DriverStats,
  boost1?: Boost,
  boost2?: Boost
): {
  carStats: CarStats;
  driver1Stats: DriverStats;
  driver2Stats: DriverStats;
} {
  const car = { ...baseCar };
  const d1 = { ...baseDriver1 };
  const d2 = { ...baseDriver2 };

  const applyEffect = (effect: { stat: string; value: number }, targetDriver: DriverStats) => {
    switch (effect.stat) {
      case "overtaking":
        targetDriver.overtaking += effect.value;
        break;
      case "defending":
        targetDriver.defending += effect.value;
        break;
      case "qualifying":
        targetDriver.qualifying += effect.value;
        break;
      case "raceStart":
        targetDriver.raceStart += effect.value;
        break;
      case "tyreManagement":
        targetDriver.tyreManagement += effect.value;
        break;
      case "speed":
        car.speed += Math.round(effect.value / 2);
        break;
      case "cornering":
        car.cornering += Math.round(effect.value / 2);
        break;
      case "powerUnit":
        car.powerUnit += Math.round(effect.value / 2);
        break;
      case "pitStopTime":
        car.pitStopTime = Math.max(0.20, Number((car.pitStopTime + effect.value / 2).toFixed(2)));
        break;
      case "overtakeMode":
        car.overtakeMode = (car.overtakeMode || 0) + effect.value;
        break;
    }
  };

  if (boost1) {
    for (const eff of boost1.effects) {
      applyEffect(eff, d1);
    }
  }

  if (boost2) {
    for (const eff of boost2.effects) {
      applyEffect(eff, d2);
    }
  }

  return { carStats: car, driver1Stats: d1, driver2Stats: d2 };
}

// Raccomandazione Boost con priorità proporzionale all'influenza del circuito
export function recommendBoosts(
  track: Track | undefined,
  driver1: Driver,
  driver2: Driver,
  carStats: CarStats,
  availableBoosts: Boost[],
  trackMultiplier: number = 2.0
): {
  driver1: { synergic?: Boost; compensatory?: Boost; selectedId?: string };
  driver2: { synergic?: Boost; compensatory?: Boost; selectedId?: string };
} {
  const boosts = availableBoosts.filter((b) => b.available && b.quantity > 0);
  if (boosts.length === 0) {
    return {
      driver1: {},
      driver2: {},
    };
  }

  const d1Stats = driver1.stats;
  const d2Stats = driver2.stats;

  const getSynergyScore = (boost: Boost) => {
    let score = 0;
    for (const eff of boost.effects) {
      if (track) {
        // Entrambe le caratteristiche del tracciato hanno lo stesso identico peso
        if (eff.stat === track.stat1 || eff.stat === track.stat2) {
          score += eff.value * (1.1 + trackMultiplier * 0.9);
        } else if (eff.stat === "tyreManagement" && track.laps >= 6) {
          const pitEst = getPitstopEstimation(track.laps);
          score += eff.value * (1.0 + pitEst.avgStops * 0.4);
        } else {
          score += eff.value * 0.8;
        }
      } else {
        score += eff.value * 1.0;
      }
    }
    return score;
  };

  const sortedBySynergy = [...boosts].sort((a, b) => getSynergyScore(b) - getSynergyScore(a));
  const synergic1 = sortedBySynergy[0];
  const synergic2 = sortedBySynergy.length > 1 ? sortedBySynergy[1] : sortedBySynergy[0];

  const getCompensatoryBoost = (driverStats: DriverStats) => {
    const weaknesses: Array<{ stat: string; val: number }> = [
      { stat: "tyreManagement", val: driverStats.tyreManagement },
      { stat: "defending", val: driverStats.defending },
      { stat: "raceStart", val: driverStats.raceStart },
      { stat: "pitStopTime", val: carStats.pitStopTime * 100 },
    ];
    if (track && track.laps >= 6) {
      const idx = weaknesses.findIndex((w) => w.stat === "tyreManagement");
      if (idx !== -1) {
        const pitEst = getPitstopEstimation(track.laps);
        weaknesses[idx].val *= Math.max(0.3, 0.8 - (pitEst.avgStops - 1) * 0.15);
      }
    }
    weaknesses.sort((a, b) => a.val - b.val);
    const worstStat = weaknesses[0].stat;

    const bestComp = [...boosts].sort((a, b) => {
      const aVal = a.effects.find((e) => e.stat === worstStat)?.value ?? 0;
      const bVal = b.effects.find((e) => e.stat === worstStat)?.value ?? 0;
      return bVal - aVal;
    })[0];

    return bestComp || sortedBySynergy[0];
  };

  const comp1 = getCompensatoryBoost(d1Stats);
  const comp2 = getCompensatoryBoost(d2Stats);

  return {
    driver1: {
      synergic: synergic1,
      compensatory: comp1,
      selectedId: synergic1?.id,
    },
    driver2: {
      synergic: synergic2,
      compensatory: comp2,
      selectedId: comp2?.id || synergic2?.id,
    },
  };
}

export function generateTacticalAdvice(
  track: Track | undefined,
  carStats: CarStats,
  d1: Driver,
  d2: Driver,
  trackMultiplier: number = 2.0
): string[] {
  const advice: string[] = [];
  const d1Stats = d1.stats;
  const d2Stats = d2.stats;

  if (track) {
    const s1Info = TRACK_CHARACTERISTICS[track.stat1] || { label: track.stat1 || "Velocità" };
    const s2Info = TRACK_CHARACTERISTICS[track.stat2] || { label: track.stat2 || "Power Unit" };
    const weightDisplay = trackMultiplier.toFixed(1);

    // Entrambe le statistiche del circuito hanno lo stesso identico peso
    advice.push(
      `Requisiti ${track.name} (${track.level} • ${track.laps} Giri): Focus paritario su ${s1Info.label.toUpperCase()} (${weightDisplay}x) e ${s2Info.label.toUpperCase()} (${weightDisplay}x).`
    );

    if (trackMultiplier <= 1.2) {
      advice.push(
        `Influenza Tracciato Minima (${weightDisplay}x): Massimizzazione quasi totale del Team Score assoluto. L'algoritmo predilige componenti con punteggio complessivo alto.`
      );
    } else if (trackMultiplier <= 2.2) {
      advice.push(
        `Influenza Tracciato Bilanciata (${weightDisplay}x): Eccellente compromesso competitivo tra un alto Team Score generale e il bonus specialistico del tracciato.`
      );
    } else {
      advice.push(
        `Influenza Tracciato Aggressiva (${weightDisplay}x): Assetto specialistico focalizzato al massimo su ${s1Info.label} e ${s2Info.label}.`
      );
    }

    // Gestione Giri e Tabella Pit Stop
    const pitEst = getPitstopEstimation(track.laps);
    advice.push(
      `Finestra Pit Stop Stimata: ${pitEst.label} su ${track.laps} giri. (Impatto tempo pitstop e gestione gomme calibrato dinamicamente).`
    );

    const hasTyreStat = track.stat1 === "tyreManagement" || track.stat2 === "tyreManagement";
    if (track.laps >= 7 || hasTyreStat) {
      const minTyre = Math.min(d1Stats.tyreManagement, d2Stats.tyreManagement);
      advice.push(
        `Gara Lunga (${track.laps} Giri): Usura gomme critica. Con ${pitEst.maxStops} soste massime previste, una sosta anticipata o un Boost gomma salveranno la gara.`
      );
      if (minTyre < 55) {
        advice.push(
          `Allerta Usura Gomme: Pilota più debole a ${minTyre} in Gestione Gomme. Consigliato Boost compensativo per non perdere terreno negli stint centrali.`
        );
      }
    } else if (track.laps <= 4) {
      advice.push(
        `Gara Sprint (${track.laps} Giri • ${pitEst.label}): Strategia no-stop o sosta lampo (${carStats.pitStopTime}s). Ogni decimo guadagnato in pit lane è decisivo.`
      );
    }

    if (track.notes) {
      advice.push(`Note Personali Circuito: "${track.notes}"`);
    }
  } else {
    advice.push("Setup Globale Bilanciato calcolato per massimizzare il Team Score assoluto.");
  }

  return advice;
}

export function runOptimization(
  parts: Part[],
  drivers: Driver[],
  boosts: Boost[],
  mode: OptimizationMode,
  selectedTrack?: Track,
  customWeights?: CustomWeights,
  trackMultiplier: number = 2.0
): CalculatedLoadout | null {
  const ownedParts = parts.filter((p) => p.owned);
  const ownedDrivers = drivers.filter((d) => d.owned);

  if (ownedDrivers.length < 2) return null;

  const categories = PART_CATEGORIES;

  for (const cat of categories) {
    if (!ownedParts.some((p) => p.category === cat)) {
      return null;
    }
  }

  let carWeights: Record<keyof CarStats, number> = {
    speed: 1.0,
    cornering: 1.0,
    powerUnit: 1.0,
    qualifying: 1.0,
    pitStopTime: 1.0,
    overtakeMode: 1.0,
  };

  let driverWeights: Record<keyof DriverStats, number> = {
    overtaking: 1.0,
    defending: 1.0,
    qualifying: 1.0,
    raceStart: 1.0,
    tyreManagement: 1.0,
  };

  if (mode === "track" && selectedTrack) {
    // 1. Specializzazione Dinamica: quando la pista richiede statistiche specifiche,
    // le altre statistiche non richieste scendono (da 1.0x a 0.20x-0.65x) in base all'aggressività del moltiplicatore.
    // In questo modo i componenti e i piloti con alta specializzazione vincono nettamente su quelli generici.
    const nonTrackBaseWeight = Math.max(
      0.20,
      Number((1.0 - (trackMultiplier - 1.0) * 0.35).toFixed(2))
    );

    carWeights = {
      speed: nonTrackBaseWeight,
      cornering: nonTrackBaseWeight,
      powerUnit: nonTrackBaseWeight,
      qualifying: nonTrackBaseWeight,
      pitStopTime: nonTrackBaseWeight,
      overtakeMode: nonTrackBaseWeight,
    };

    driverWeights = {
      overtaking: nonTrackBaseWeight,
      defending: nonTrackBaseWeight,
      qualifying: nonTrackBaseWeight,
      raceStart: nonTrackBaseWeight,
      tyreManagement: nonTrackBaseWeight,
    };

    const trackWeight = Number(trackMultiplier.toFixed(2));
    const s1 = selectedTrack.stat1;
    const s2 = selectedTrack.stat2;

    const isCarStat = (st: TrackCharacteristic) => st === "speed" || st === "cornering" || st === "powerUnit";
    const isDriverStat = (st: TrackCharacteristic) =>
      st === "overtaking" || st === "defending" || st === "raceStart" || st === "tyreManagement";

    const hasCarStat = isCarStat(s1) || isCarStat(s2);
    const hasDriverStat = isDriverStat(s1) || isDriverStat(s2);

    // Applica il peso massimo paritario alle 2 caratteristiche esplicitamente richieste dal tracciato
    if (isCarStat(s1)) carWeights[s1 as keyof CarStats] = trackWeight;
    if (isCarStat(s2)) carWeights[s2 as keyof CarStats] = trackWeight;

    if (isDriverStat(s1)) driverWeights[s1 as keyof DriverStats] = trackWeight;
    if (isDriverStat(s2)) driverWeights[s2 as keyof DriverStats] = trackWeight;

    // 2. Correlazione Tattica Automatica per l'altra categoria:
    // Se la pista richiede SOLO statistiche Auto (es. Velocità e PU), specializza anche i piloti in base al layout
    if (!hasDriverStat) {
      if (s1 === "speed" || s2 === "speed" || s1 === "powerUnit" || s2 === "powerUnit") {
        driverWeights.qualifying = Math.max(driverWeights.qualifying, Number((trackWeight * 0.85).toFixed(2)));
        driverWeights.raceStart = Math.max(driverWeights.raceStart, Number((trackWeight * 0.70).toFixed(2)));
      }
      if (s1 === "cornering" || s2 === "cornering") {
        driverWeights.overtaking = Math.max(driverWeights.overtaking, Number((trackWeight * 0.85).toFixed(2)));
        driverWeights.defending = Math.max(driverWeights.defending, Number((trackWeight * 0.70).toFixed(2)));
      }
    }

    // Se la pista richiede SOLO statistiche Pilota (es. Sorpasso e Difesa), specializza anche l'auto a supporto
    if (!hasCarStat) {
      if (s1 === "overtaking" || s2 === "overtaking") {
        carWeights.powerUnit = Math.max(carWeights.powerUnit, Number((trackWeight * 0.85).toFixed(2)));
        carWeights.speed = Math.max(carWeights.speed, Number((trackWeight * 0.70).toFixed(2)));
      }
      if (s1 === "raceStart" || s2 === "raceStart" || s1 === "defending" || s2 === "defending") {
        carWeights.qualifying = Math.max(carWeights.qualifying, Number((trackWeight * 0.85).toFixed(2)));
        carWeights.cornering = Math.max(carWeights.cornering, Number((trackWeight * 0.70).toFixed(2)));
      }
    }

    // 3. Calibrazione Pit Stop e Gestione Gomme in base ai Giri della gara (Tabella Soste)
    const pitEst = getPitstopEstimation(selectedTrack.laps);
    if (pitEst.avgStops > 0) {
      carWeights.pitStopTime = Math.max(
        carWeights.pitStopTime,
        Number((nonTrackBaseWeight + pitEst.avgStops * 0.45 * (trackMultiplier / 2)).toFixed(2))
      );
      driverWeights.tyreManagement = Math.max(
        driverWeights.tyreManagement,
        Number((nonTrackBaseWeight + pitEst.avgStops * 0.50 * (trackMultiplier / 2)).toFixed(2))
      );
    }
  } else if (mode === "custom" && customWeights) {
    carWeights = { ...customWeights.car };
    driverWeights = { ...customWeights.driver };
  }

  const scorePart = (p: Part): number => {
    const s = p.stats;
    const pitScore = Math.max(0, (1.0 - s.pitStopTime) * 50);
    const overtakeScore = (s.overtakeMode || 0) * (carWeights.overtakeMode ?? 1.0);
    return (
      s.speed * carWeights.speed +
      s.cornering * carWeights.cornering +
      s.powerUnit * carWeights.powerUnit +
      s.qualifying * carWeights.qualifying +
      pitScore * carWeights.pitStopTime +
      overtakeScore
    );
  };

  const scoreDriver = (d: Driver): number => {
    const s = d.stats;
    return (
      s.overtaking * driverWeights.overtaking +
      s.defending * driverWeights.defending +
      s.qualifying * driverWeights.qualifying +
      s.raceStart * driverWeights.raceStart +
      s.tyreManagement * driverWeights.tyreManagement
    );
  };

  const capEnabled = mode === "custom" && !!customWeights?.teamScoreCapEnabled;
  const maxCap = customWeights?.teamScoreCap ?? 9999;

  let chosenParts: Record<PartCategory, Part>;
  let chosenDriver1: Driver;
  let chosenDriver2: Driver;

  if (!capEnabled) {
    const bestParts = {} as Record<PartCategory, Part>;
    for (const cat of categories) {
      const candidates = ownedParts.filter((p) => p.category === cat);
      candidates.sort((a, b) => scorePart(b) - scorePart(a));
      bestParts[cat] = candidates[0];
    }
    chosenParts = bestParts;

    const sortedDrivers = [...ownedDrivers].sort((a, b) => scoreDriver(b) - scoreDriver(a));
    chosenDriver1 = sortedDrivers[0];
    chosenDriver2 = sortedDrivers[1];
  } else {
    const topPerCat: Record<PartCategory, Part[]> = {
      brakes: ownedParts.filter((p) => p.category === "brakes").sort((a, b) => scorePart(b) - scorePart(a)).slice(0, 3),
      gearbox: ownedParts.filter((p) => p.category === "gearbox").sort((a, b) => scorePart(b) - scorePart(a)).slice(0, 3),
      rearWing: ownedParts.filter((p) => p.category === "rearWing").sort((a, b) => scorePart(b) - scorePart(a)).slice(0, 3),
      frontWing: ownedParts.filter((p) => p.category === "frontWing").sort((a, b) => scorePart(b) - scorePart(a)).slice(0, 3),
      suspension: ownedParts.filter((p) => p.category === "suspension").sort((a, b) => scorePart(b) - scorePart(a)).slice(0, 3),
      engine: ownedParts.filter((p) => p.category === "engine").sort((a, b) => scorePart(b) - scorePart(a)).slice(0, 3),
      battery: ownedParts.filter((p) => p.category === "battery").sort((a, b) => scorePart(b) - scorePart(a)).slice(0, 3),
    };

    const sortedDrivers = [...ownedDrivers].sort((a, b) => scoreDriver(b) - scoreDriver(a));
    const driverPairs: Array<{ d1: Driver; d2: Driver; score: number }> = [];
    for (let i = 0; i < sortedDrivers.length; i++) {
      for (let j = i + 1; j < sortedDrivers.length; j++) {
        driverPairs.push({
          d1: sortedDrivers[i],
          d2: sortedDrivers[j],
          score: scoreDriver(sortedDrivers[i]) + scoreDriver(sortedDrivers[j]),
        });
      }
    }
    driverPairs.sort((a, b) => b.score - a.score);

    let bestTotalScore = -1;
    let fallbackBestTotalScore = -1;
    let fallbackCombination: { parts: Record<PartCategory, Part>; d1: Driver; d2: Driver } | null = null;
    let selectedCombination: { parts: Record<PartCategory, Part>; d1: Driver; d2: Driver } | null = null;

    const topPairs = driverPairs.slice(0, 4);
    for (const pair of topPairs) {
      const d1Stats = pair.d1.stats;
      const d2Stats = pair.d2.stats;

      for (const br of topPerCat.brakes) {
        for (const gb of topPerCat.gearbox) {
          for (const rw of topPerCat.rearWing) {
            for (const fw of topPerCat.frontWing) {
              for (const su of topPerCat.suspension) {
                for (const en of topPerCat.engine) {
                  for (const bat of topPerCat.battery) {
                    const currentParts: Record<PartCategory, Part> = {
                      brakes: br,
                      gearbox: gb,
                      rearWing: rw,
                      frontWing: fw,
                      suspension: su,
                      engine: en,
                      battery: bat,
                    };

                    const carStats = calculateCarStats(currentParts);
                    const ts = calculateTeamScore(carStats, d1Stats, d2Stats).total;
                    const weightedScore =
                      scorePart(br) +
                      scorePart(gb) +
                      scorePart(rw) +
                      scorePart(fw) +
                      scorePart(su) +
                      scorePart(en) +
                      scorePart(bat) +
                      pair.score;

                    if (weightedScore > fallbackBestTotalScore) {
                      fallbackBestTotalScore = weightedScore;
                      fallbackCombination = { parts: currentParts, d1: pair.d1, d2: pair.d2 };
                    }

                    if (ts <= maxCap && weightedScore > bestTotalScore) {
                      bestTotalScore = weightedScore;
                      selectedCombination = { parts: currentParts, d1: pair.d1, d2: pair.d2 };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    const finalCombo = selectedCombination || fallbackCombination!;
    chosenParts = finalCombo.parts;
    chosenDriver1 = finalCombo.d1;
    chosenDriver2 = finalCombo.d2;
  }

  const baseCarStats = calculateCarStats(chosenParts);
  const baseD1Stats = chosenDriver1.stats;
  const baseD2Stats = chosenDriver2.stats;
  const baseScores = calculateTeamScore(baseCarStats, baseD1Stats, baseD2Stats);

  const recommendedBoosts = recommendBoosts(
    selectedTrack,
    chosenDriver1,
    chosenDriver2,
    baseCarStats,
    boosts,
    trackMultiplier
  );

  const d1Boost = recommendedBoosts.driver1.synergic;
  const d2Boost = recommendedBoosts.driver2.compensatory || recommendedBoosts.driver2.synergic;

  const {
    carStats: boostedCarStats,
    driver1Stats: boostedD1Stats,
    driver2Stats: boostedD2Stats,
  } = applyBoostToStats(baseCarStats, baseD1Stats, baseD2Stats, d1Boost, d2Boost);

  const boostedScores = calculateTeamScore(boostedCarStats, boostedD1Stats, boostedD2Stats);

  const strategyAdvice = generateTacticalAdvice(
    selectedTrack,
    baseCarStats,
    chosenDriver1,
    chosenDriver2,
    trackMultiplier
  );

  return {
    parts: chosenParts,
    driver1: chosenDriver1,
    driver2: chosenDriver2,
    recommendedBoosts,
    driver1Boost: d1Boost,
    driver2Boost: d2Boost,
    baseCarStats,
    baseDriver1Stats: baseD1Stats,
    baseDriver2Stats: baseD2Stats,
    boostedCarStats,
    boostedDriver1Stats: boostedD1Stats,
    boostedDriver2Stats: boostedD2Stats,
    baseTeamScore: baseScores.total,
    boostedTeamScore: boostedScores.total,
    scoreBreakdown: {
      carScore: baseScores.carScore,
      driver1Score: baseScores.driver1Score,
      driver2Score: baseScores.driver2Score,
    },
    strategyAdvice,
  };
}

export function calculatePresetStats(
  preset: LoadoutPreset,
  allParts: Part[],
  allDrivers: Driver[],
  allBoosts: Boost[]
): CalculatedLoadout | null {
  const partsMap: Partial<Record<PartCategory, Part>> = {};
  const categories = PART_CATEGORIES;

  for (const cat of categories) {
    const partId = preset.parts[cat];
    let found = allParts.find((p) => p.id === partId);
    
    // Retrocompatibilità: se un preset salvato in precedenza non include ancora la batteria,
    // cerca la prima batteria posseduta nel garage come fallback
    if (!found && cat === "battery") {
      found = allParts.find((p) => p.category === "battery" && p.owned) || allParts.find((p) => p.category === "battery");
    }

    if (!found) return null;
    partsMap[cat] = found;
  }

  const d1 = allDrivers.find((d) => d.id === preset.driver1Id);
  const d2 = allDrivers.find((d) => d.id === preset.driver2Id);
  if (!d1 || !d2) return null;

  const boost1 = allBoosts.find((b) => b.id === preset.driver1BoostId);
  const boost2 = allBoosts.find((b) => b.id === preset.driver2BoostId);

  const baseCarStats = calculateCarStats(partsMap as Record<PartCategory, Part>);
  const baseD1Stats = d1.stats;
  const baseD2Stats = d2.stats;
  const baseScores = calculateTeamScore(baseCarStats, baseD1Stats, baseD2Stats);

  const {
    carStats: boostedCarStats,
    driver1Stats: boostedD1Stats,
    driver2Stats: boostedD2Stats,
  } = applyBoostToStats(baseCarStats, baseD1Stats, baseD2Stats, boost1, boost2);

  const boostedScores = calculateTeamScore(boostedCarStats, boostedD1Stats, boostedD2Stats);

  return {
    parts: partsMap as Record<PartCategory, Part>,
    driver1: d1,
    driver2: d2,
    driver1Boost: boost1,
    driver2Boost: boost2,
    baseCarStats,
    baseDriver1Stats: baseD1Stats,
    baseDriver2Stats: baseD2Stats,
    boostedCarStats,
    boostedDriver1Stats: boostedD1Stats,
    boostedDriver2Stats: boostedD2Stats,
    baseTeamScore: baseScores.total,
    boostedTeamScore: boostedScores.total,
    scoreBreakdown: {
      carScore: baseScores.carScore,
      driver1Score: baseScores.driver1Score,
      driver2Score: baseScores.driver2Score,
    },
    strategyAdvice: [`Preset: ${preset.name} - Note: ${preset.customNotes || "Nessuna nota."}`],
  };
}
