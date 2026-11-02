"use client";

import React, { useMemo, useState } from "react";
import { CarStats } from "@/types/f1";

interface RadarChartProps {
  statsA: CarStats;
  labelA?: string;
  colorA?: string;
  statsB?: CarStats | null;
  labelB?: string;
  colorB?: string;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  statsA,
  labelA = "Setup A",
  colorA = "#e10600",
  statsB = null,
  labelB = "Setup B",
  colorB = "#a855f7",
  size = 320,
}) => {
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);

  // Normalizza le statistiche su una scala 0 - 100 per il radar
  // Per pit stop: 0.30s = 100, 0.70s = 20
  const axes = useMemo(() => {
    const normalize = (val: number, max: number) => Math.min(100, Math.max(10, (val / max) * 100));
    const normalizePit = (pit: number) => {
      // 0.30s -> 100, 0.70s -> 20
      const clamped = Math.min(0.70, Math.max(0.30, pit));
      return Math.round(100 - ((clamped - 0.30) / 0.40) * 80);
    };

    return [
      {
        key: "speed",
        label: "Velocità",
        valA: statsA.speed,
        normA: normalize(statsA.speed, 280),
        valB: statsB ? statsB.speed : null,
        normB: statsB ? normalize(statsB.speed, 280) : null,
        display: (v: number) => `${Math.round(v)}`,
      },
      {
        key: "cornering",
        label: "Curva",
        valA: statsA.cornering,
        normA: normalize(statsA.cornering, 280),
        valB: statsB ? statsB.cornering : null,
        normB: statsB ? normalize(statsB.cornering, 280) : null,
        display: (v: number) => `${Math.round(v)}`,
      },
      {
        key: "powerUnit",
        label: "Power Unit",
        valA: statsA.powerUnit,
        normA: normalize(statsA.powerUnit, 280),
        valB: statsB ? statsB.powerUnit : null,
        normB: statsB ? normalize(statsB.powerUnit, 280) : null,
        display: (v: number) => `${Math.round(v)}`,
      },
      {
        key: "qualifying",
        label: "Qualifica",
        valA: statsA.qualifying,
        normA: normalize(statsA.qualifying, 260),
        valB: statsB ? statsB.qualifying : null,
        normB: statsB ? normalize(statsB.qualifying, 260) : null,
        display: (v: number) => `${Math.round(v)}`,
      },
      {
        key: "pitStopTime",
        label: "Pit Stop",
        valA: statsA.pitStopTime,
        normA: normalizePit(statsA.pitStopTime),
        valB: statsB ? statsB.pitStopTime : null,
        normB: statsB ? normalizePit(statsB.pitStopTime) : null,
        display: (v: number) => `${v.toFixed(2)}s`,
      },
    ];
  }, [statsA, statsB]);

  const center = size / 2;
  const radius = center - 52;
  const totalAxes = axes.length;
  const angleSlice = (Math.PI * 2) / totalAxes;

  // Calcolo punti poligono A
  const pointsA = useMemo(() => {
    return axes
      .map((axis, i) => {
        const r = (axis.normA / 100) * radius;
        const angle = i * angleSlice - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [axes, radius, center, angleSlice]);

  // Calcolo punti poligono B (se presente)
  const pointsB = useMemo(() => {
    if (!statsB) return "";
    return axes
      .map((axis, i) => {
        const norm = axis.normB ?? 50;
        const r = (norm / 100) * radius;
        const angle = i * angleSlice - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [axes, radius, center, angleSlice, statsB]);

  // Cerchi concentrici di sfondo
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible drop-shadow-md"
        >
          {/* Cerchi concentrici del radar */}
          {rings.map((ring, idx) => {
            const r = radius * ring;
            const ringPoints = axes
              .map((_, i) => {
                const angle = i * angleSlice - Math.PI / 2;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");

            return (
              <polygon
                key={`ring-${idx}`}
                points={ringPoints}
                fill="none"
                stroke="#272c38"
                strokeWidth={idx === rings.length - 1 ? 1.5 : 1}
                strokeDasharray={idx < 3 ? "3 3" : undefined}
                className="opacity-70"
              />
            );
          })}

          {/* Raggi degli assi */}
          {axes.map((_, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            return (
              <line
                key={`axis-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#272c38"
                strokeWidth={1.2}
              />
            );
          })}

          {/* Poligono Dataset B (Sovrapposto) */}
          {statsB && pointsB && (
            <>
              <polygon
                points={pointsB}
                fill={colorB}
                fillOpacity={0.25}
                stroke={colorB}
                strokeWidth={2}
                strokeDasharray="4 2"
                className="transition-all duration-300"
              />
              {axes.map((axis, i) => {
                const r = ((axis.normB ?? 50) / 100) * radius;
                const angle = i * angleSlice - Math.PI / 2;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return (
                  <circle
                    key={`dot-b-${i}`}
                    cx={x}
                    cy={y}
                    r={3.5}
                    fill={colorB}
                    stroke="#0f1115"
                    strokeWidth={1.5}
                  />
                );
              })}
            </>
          )}

          {/* Poligono Dataset A (Principale) */}
          <polygon
            points={pointsA}
            fill={colorA}
            fillOpacity={0.35}
            stroke={colorA}
            strokeWidth={2.5}
            className="transition-all duration-300"
          />

          {/* Punti vertice Dataset A */}
          {axes.map((axis, i) => {
            const r = (axis.normA / 100) * radius;
            const angle = i * angleSlice - Math.PI / 2;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            const isHovered = hoveredAxis === i;

            return (
              <circle
                key={`dot-a-${i}`}
                cx={x}
                cy={y}
                r={isHovered ? 5.5 : 4}
                fill={colorA}
                stroke="#ffffff"
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              />
            );
          })}

          {/* Etichette e valori all'esterno degli assi */}
          {axes.map((axis, i) => {
            const labelR = radius + 26;
            const angle = i * angleSlice - Math.PI / 2;
            const x = center + labelR * Math.cos(angle);
            const y = center + labelR * Math.sin(angle);

            // Calcolo allineamento testo
            let textAnchor: "middle" | "start" | "end" = "middle";
            if (Math.abs(Math.cos(angle)) > 0.3) {
              textAnchor = Math.cos(angle) > 0 ? "start" : "end";
            }

            const isHovered = hoveredAxis === i;

            return (
              <g
                key={`label-${i}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                <text
                  x={x}
                  y={y - 4}
                  textAnchor={textAnchor}
                  className={`text-[10px] font-mono tracking-wider font-semibold transition-colors ${
                    isHovered ? "fill-white" : "fill-zinc-400"
                  }`}
                >
                  {axis.label.toUpperCase()}
                </text>
                <text
                  x={x}
                  y={y + 9}
                  textAnchor={textAnchor}
                  className={`text-[11px] font-bold font-mono transition-colors ${
                    isHovered ? "fill-[#e10600]" : "fill-zinc-200"
                  }`}
                >
                  {axis.display(axis.valA)}
                  {statsB && axis.valB !== null && (
                    <tspan fill={colorB} className="font-normal">
                      {" "}
                      | {axis.display(axis.valB)}
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legenda comparativa */}
      <div className="flex items-center gap-4 mt-1 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: colorA }} />
          <span className="text-zinc-200 font-semibold">{labelA}</span>
        </div>
        {statsB && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-sm border border-dashed"
              style={{ backgroundColor: colorB, borderColor: "#fff" }}
            />
            <span className="text-zinc-300">{labelB}</span>
          </div>
        )}
      </div>
    </div>
  );
};
