import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPitStop(seconds: number): string {
  return `${seconds.toFixed(2)}s`;
}

export function formatDelta(val: number, isPitStop = false): { text: string; isPositive: boolean; isNeutral: boolean } {
  if (Math.abs(val) < 0.001) {
    return { text: "0", isPositive: false, isNeutral: true };
  }
  
  if (isPitStop) {
    // For pit stops, lower time is better!
    const isPositive = val < 0;
    const sign = val > 0 ? "+" : "";
    return {
      text: `${sign}${val.toFixed(2)}s`,
      isPositive,
      isNeutral: false,
    };
  }

  const isPositive = val > 0;
  const sign = val > 0 ? "+" : "";
  return {
    text: `${sign}${Math.round(val)}`,
    isPositive,
    isNeutral: false,
  };
}
