"use client";

import React from "react";
import { Shield, Sparkles } from "lucide-react";

interface MetricsPanelProps {
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  skippedRuns: number;
  connectedReposCount: number;
}

export default function MetricsPanel({
  totalRuns,
  successRuns,
  failedRuns,
  skippedRuns,
  connectedReposCount,
}: MetricsPanelProps) {
  // Percentage calculations
  const successPct = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;
  const skippedPct = totalRuns > 0 ? Math.round((skippedRuns / totalRuns) * 100) : 0;
  const failedPct = totalRuns > 0 ? Math.round((failedRuns / totalRuns) * 100) : 0;

  return (
    <div className="space-y-4 font-sans select-none text-xs">
      {/* Usage Panel */}
      <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-zinc-300">Usage</h4>
            <p className="text-[10px] text-zinc-500">Last 30 days webhook activity</p>
          </div>
          <span className="px-2 py-0.5 rounded-[4px] text-[10px] bg-green-500/10 text-green-400 font-semibold border border-green-500/20">
            Active
          </span>
        </div>

        {/* Usage Progress Metrics */}
        <div className="space-y-4">
          {/* Webhook Runs */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400 font-medium">Edge Webhook Requests</span>
              <span className="text-zinc-300 font-mono font-bold">
                {totalRuns} <span className="text-zinc-500">/ 1,000</span>
              </span>
            </div>
            <div className="h-1.5 bg-[#111111] rounded-full overflow-hidden border border-[#1f1f1f]/55">
              <div
                style={{ width: `${Math.min((totalRuns / 1000) * 100, 100)}%` }}
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Success Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400 font-medium">Success Rate</span>
              <span className="text-zinc-300 font-mono font-bold">{successPct}%</span>
            </div>
            <div className="h-1.5 bg-[#111111] rounded-full overflow-hidden border border-[#1f1f1f]/55">
              <div
                style={{ width: `${successPct}%` }}
                className="h-full bg-green-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Skipped Events */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400 font-medium">Skipped (No Rule Match)</span>
              <span className="text-zinc-300 font-mono font-bold">{skippedPct}%</span>
            </div>
            <div className="h-1.5 bg-[#111111] rounded-full overflow-hidden border border-[#1f1f1f]/55">
              <div
                style={{ width: `${skippedPct}%` }}
                className="h-full bg-zinc-600 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Error Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-zinc-400 font-medium">Failed / Errors</span>
              <span className="text-zinc-300 font-mono font-bold">{failedPct}%</span>
            </div>
            <div className="h-1.5 bg-[#111111] rounded-full overflow-hidden border border-[#1f1f1f]/55">
              <div
                style={{ width: `${failedPct}%` }}
                className="h-full bg-red-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security Shield Info Panel */}
      <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-5 flex gap-3.5 items-start">
        <div className="p-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg flex-shrink-0">
          <Shield className="h-4 w-4" />
        </div>
        <div className="space-y-1 min-w-0">
          <h4 className="text-xs font-semibold text-zinc-300">Secure Webhook Handlers</h4>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Automations are secured using HMAC-SHA256 signatures received from GitHub. Bypassed runs are logged in deployments.
          </p>
        </div>
      </div>

      {/* AI Gateway Stats */}
      <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-5 flex gap-3.5 items-start">
        <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg flex-shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="space-y-1 min-w-0">
          <h4 className="text-xs font-semibold text-zinc-300">Gemini AI Triage</h4>
          <p className="text-[11px] text-zinc-400 leading-normal">
            Uses <code className="text-[10px] bg-zinc-950/40 text-zinc-300 px-1 py-0.5 border border-purple-900/35 rounded font-mono">gemini-2.5-flash</code> for lightning-fast summaries, severity priority ranking, and automated labeling.
          </p>
        </div>
      </div>
    </div>
  );
}
