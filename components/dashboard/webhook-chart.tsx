"use client";

import React, { useState } from "react";
import { WebhookLog } from "@/types";

interface WebhookChartProps {
  logs: WebhookLog[];
}

type TabType = "runs" | "success" | "errors";
type RangeType = "1w" | "1m" | "6m" | "max";

export default function WebhookChart({ logs }: WebhookChartProps) {
  const [activeTab, setActiveTab] = useState<TabType>("runs");
  const [range, setRange] = useState<RangeType>("1w");

  // Aggregate logs dynamically based on selected date range
  const getChartData = () => {
    const data = [];
    const now = new Date();

    if (range === "1w") {
      // Last 7 days, daily points
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayLogs = logs.filter((log) => {
          const logDate = new Date(log.processedAt);
          return (
            logDate.getDate() === d.getDate() &&
            logDate.getMonth() === d.getMonth() &&
            logDate.getFullYear() === d.getFullYear()
          );
        });
        data.push({
          label,
          runs: dayLogs.length,
          success: dayLogs.filter((l) => l.status === "success").length,
          errors: dayLogs.filter((l) => l.status === "failed").length,
        });
      }
    } else if (range === "1m") {
      // Last 30 days, grouped into 6 points of 5 days
      for (let i = 5; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i + 1) * 5);
        const end = new Date();
        end.setDate(now.getDate() - i * 5);
        const label = `${start.getDate()}-${end.getDate()} ${end.toLocaleDateString("en-US", { month: "short" })}`;
        const rangeLogs = logs.filter((log) => {
          const logDate = new Date(log.processedAt);
          return logDate > start && logDate <= end;
        });
        data.push({
          label,
          runs: rangeLogs.length,
          success: rangeLogs.filter((l) => l.status === "success").length,
          errors: rangeLogs.filter((l) => l.status === "failed").length,
        });
      }
    } else {
      // Last 6 months / Max, grouped by month
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleDateString("en-US", { month: "short" });
        const rangeLogs = logs.filter((log) => {
          const logDate = new Date(log.processedAt);
          return logDate.getMonth() === d.getMonth() && logDate.getFullYear() === d.getFullYear();
        });
        data.push({
          label,
          runs: rangeLogs.length,
          success: rangeLogs.filter((l) => l.status === "success").length,
          errors: rangeLogs.filter((l) => l.status === "failed").length,
        });
      }
    }
    return data;
  };

  const chartData = getChartData();
  const totalRuns = logs.length;
  const totalSuccess = logs.filter((l) => l.status === "success").length;
  const totalErrors = logs.filter((l) => l.status === "failed").length;

  // Chart layout specs (Optimized wide ratio to stay narrow on page)
  const width = 800;
  const height = 100;
  const paddingX = 30;
  const paddingY = 15;

  const maxVal = Math.max(...chartData.map((d) => d[activeTab]), 5);
  const points = chartData.map((d, i) => {
    const val = d[activeTab];
    const x = paddingX + (i * (width - 2 * paddingX)) / (chartData.length - 1);
    const y = height - paddingY - (val * (height - 2 * paddingY)) / maxVal;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : "";

  const themeMap = {
    runs: { color: "stroke-blue-500", fill: "url(#blueGrad)", text: "text-blue-500" },
    success: { color: "stroke-green-500", fill: "url(#greenGrad)", text: "text-green-500" },
    errors: { color: "stroke-red-500", fill: "url(#redGrad)", text: "text-red-500" },
  };

  const activeTheme = themeMap[activeTab];

  return (
    <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-4 space-y-4 select-none font-sans text-xs">
      {/* Header controls (Tabs on left, range selectors on right) */}
      <div className="flex justify-between items-center gap-4">
        {/* Metric tabs */}
        <div className="flex items-center gap-1.5 bg-[#111111]/60 p-0.5 rounded-lg border border-[#1f1f1f]">
          {(["runs", "success", "errors"] as TabType[]).map((tab) => {
            const labelMap = { runs: "Runs", success: "Success Rate", errors: "Errors" };
            const valueMap = {
              runs: totalRuns,
              success: `${totalRuns > 0 ? Math.round((totalSuccess / totalRuns) * 100) : 0}%`,
              errors: totalErrors,
            };
            const activeClass =
              activeTab === tab
                ? "bg-[#1f1f1f] text-zinc-100 font-semibold"
                : "text-zinc-500 hover:text-zinc-300";

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-[10px] transition-all flex items-center gap-1.5 ${activeClass}`}
              >
                <span>{labelMap[tab]}</span>
                <span className="font-mono font-bold text-[9px]">{valueMap[tab]}</span>
              </button>
            );
          })}
        </div>

        {/* Range selectors */}
        <div className="flex items-center gap-1 bg-[#111111]/60 p-0.5 rounded-lg border border-[#1f1f1f]">
          {(["1w", "1m", "6m", "max"] as RangeType[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-mono font-bold transition-all ${
                range === r
                  ? "bg-[#1f1f1f] text-zinc-200"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* SVG line chart plot */}
      <div className="relative pt-1 w-full">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="overflow-visible">
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#141414" strokeWidth="0.5" strokeDasharray="1 3" />
          <line x1={paddingX} y1={(height - paddingY) / 2} x2={width - paddingX} y2={(height - paddingY) / 2} stroke="#141414" strokeWidth="0.5" strokeDasharray="1 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#1f1f1f" strokeWidth="0.75" />

          {/* Area */}
          {areaPath && <path d={areaPath} fill={activeTheme.fill} />}

          {/* Line */}
          {linePath && <path d={linePath} fill="none" className={activeTheme.color} strokeWidth="1" strokeLinecap="round" />}

          {/* Nodes */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="1.5" fill="#0a0a0a" className={activeTheme.color} strokeWidth="1" />
              <text x={p.x} y={p.y - 5} textAnchor="middle" fill="#71717a" className="font-mono text-[6px]">
                {chartData[idx][activeTab]}
              </text>
            </g>
          ))}

          {/* Labels */}
          {chartData.map((d, i) => {
            const x = paddingX + (i * (width - 2 * paddingX)) / (chartData.length - 1);
            return (
              <text key={i} x={x} y={height - 4} textAnchor="middle" fill="#52525b" className="text-[7px] font-mono font-medium">
                {d.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
