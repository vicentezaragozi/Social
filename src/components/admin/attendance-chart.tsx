"use client";

import { useMemo, useState } from "react";

type RangeKey = "12h" | "24h" | "7d";

type SeriesPoint = {
  label: string;
  value: number;
};

type AttendanceChartProps = {
  seriesByRange: Record<RangeKey, SeriesPoint[]>;
};

const RANGE_LABELS: Record<RangeKey, string> = {
  "12h": "Last 12 hours",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
};

export function AttendanceChart({ seriesByRange }: AttendanceChartProps) {
  const [range, setRange] = useState<RangeKey>("12h");

  const data = seriesByRange[range];
  const hasData = data && data.some((point) => point.value > 0);

  const chartPath = useMemo(() => {
    if (!hasData || data.length === 0) return "";

    const width = 640;
    const height = 240;
    const usableWidth = width - 40;
    const usableHeight = height - 40;
    const offsetX = 20;
    const offsetY = 10;
    const maxValue = Math.max(...data.map((point) => point.value), 1);
    const step = data.length > 1 ? usableWidth / (data.length - 1) : usableWidth;

    const points = data.map((point, index) => {
      const x = offsetX + index * step;
      const y = offsetY + (usableHeight - (point.value / maxValue) * usableHeight);
      return [x, y] as const;
    });

    return points.reduce((acc, [x, y], index) => {
      const segment = `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      return acc.length ? `${acc} ${segment}` : segment;
    }, "");
  }, [data, hasData]);

  const maxValue = useMemo(
    () => Math.max(...(data ?? []).map((point) => point.value), 1),
    [data],
  );

  return (
    <div className="space-y-4 rounded-3xl border border-[#1f2c49] bg-[#0d162a]/80 p-6 shadow-lg shadow-black/25">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Attendance trend</h2>
          <p className="text-xs text-[var(--muted)]">
            Track check-ins over selectable windows to understand your busiest times.
          </p>
        </div>
        <div className="flex rounded-2xl border border-[#1f2c49] bg-[#0b1323] p-1 text-xs">
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-xl px-3 py-1.5 font-semibold transition ${
                range === key
                  ? "bg-[#1a2a48] text-white shadow-inner shadow-black/40"
                  : "text-[var(--muted)] hover:text-white"
              }`}
            >
              {RANGE_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="relative">
          <svg viewBox="0 0 680 280" className="h-64 w-full">
            <defs>
              <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#6b9eff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#6b9eff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="680" height="280" fill="#0b1323" rx="24" />
            <path
              d={`${chartPath} L 660 260 L 20 260 Z`}
              fill="url(#chartFill)"
              opacity={0.4}
            />
            <path
              d={chartPath}
              fill="none"
              stroke="#6b9eff"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {data.map((point, index) => {
              const width = 640;
              const height = 240;
              const usableWidth = width - 40;
              const usableHeight = height - 40;
              const offsetX = 20;
              const offsetY = 10;
              const step = data.length > 1 ? usableWidth / (data.length - 1) : usableWidth;
              const x = offsetX + index * step;
              const y = offsetY + (usableHeight - (point.value / maxValue) * usableHeight);

              return (
                <g key={point.label}>
                  <circle cx={x} cy={y} r={5} fill="#6b9eff" />
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#ffffff"
                    className="opacity-75"
                  >
                    {point.value}
                  </text>
                  <text
                    x={x}
                    y={260}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9aa4c6"
                  >
                    {point.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#26314d] bg-[#0b1323] px-6 py-10 text-center text-sm text-[var(--muted)]">
          No attendance data for this range yet.
        </div>
      )}
    </div>
  );
}


