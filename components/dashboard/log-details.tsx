"use client";

import React, { useState } from "react";
import { X, Play, AlertCircle, Sparkles, CheckCircle2, Terminal } from "lucide-react";
import { WebhookLog } from "@/types";
import { Button } from "@/components/ui/button";

interface LogDetailsProps {
  log: WebhookLog | null;
  onClose: () => void;
  onRetry: (logId: string) => Promise<void>;
  retrying: boolean;
}

export default function LogDetails({
  log,
  onClose,
  onRetry,
  retrying,
}: LogDetailsProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!log) return null;

  // Format payload JSON
  let formattedPayload = "";
  try {
    formattedPayload = JSON.stringify(JSON.parse(log.payload), null, 2);
  } catch (e) {
    formattedPayload = log.payload;
  }

  // Parse actions executed
  let actionsList: string[] = [];
  try {
    actionsList = JSON.parse(log.actionsTaken || "[]");
  } catch (e) {
    actionsList = [log.actionsTaken];
  }

  // Priority color tag maps
  const priorityColor = {
    High: "bg-red-950/30 text-red-400 border-red-900/40",
    Medium: "bg-yellow-950/30 text-yellow-400 border-yellow-900/40",
    Low: "bg-green-950/30 text-green-400 border-green-900/40",
  };

  const priorityStyle = priorityColor[log.aiPriority as "High" | "Medium" | "Low"] || "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <div className="fixed inset-y-0 right-0 w-[460px] bg-[#0a0a0a] border-l border-[#1f1f1f] shadow-2xl flex flex-col justify-between font-sans z-50 animate-slide-in select-none text-xs">
      {/* Header */}
      <div className="p-4 border-b border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-xs font-semibold text-zinc-200">Execution Details</h4>
          <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[320px]">
            Delivery: {log.deliveryId}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-[#161b22]/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Core Metadata */}
        <div className="grid grid-cols-2 gap-3 bg-[#111111]/30 border border-[#1f1f1f] p-3 rounded-lg font-mono text-[10px]">
          <div>
            <span className="text-zinc-500 block mb-0.5">Event Type</span>
            <span className="text-zinc-300 capitalize">{log.eventType}</span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-0.5">Trigger Action</span>
            <span className="text-zinc-300 capitalize">{log.action}</span>
          </div>
          <div className="col-span-2 border-t border-[#1f1f1f]/50 pt-2 mt-1">
            <span className="text-zinc-500 block mb-0.5">Processed At</span>
            <span className="text-zinc-300">{new Date(log.processedAt).toLocaleString()}</span>
          </div>
        </div>

        {/* AI Triage Block */}
        {log.aiSummary && (
          <div className="border border-purple-900/30 bg-purple-950/5 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px]">
              <Sparkles className="h-3.5 w-3.5" />
              AI Triage Insights
            </div>
            <p className="text-zinc-300 leading-relaxed italic">
              "{log.aiSummary}"
            </p>
            <div className="flex flex-wrap gap-2 pt-1 font-mono text-[9px]">
              {log.aiPriority && (
                <span className={`px-2 py-0.5 rounded border ${priorityStyle}`}>
                  Priority: {log.aiPriority}
                </span>
              )}
              {log.aiLabels &&
                log.aiLabels.split(",").map((lbl) => (
                  <span key={lbl} className="px-2 py-0.5 rounded border border-purple-900/40 bg-purple-950/20 text-purple-300">
                    {lbl}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Executed Actions List */}
        <div className="space-y-2">
          <div className="text-zinc-400 font-semibold text-[11px] flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            Actions Executed
          </div>
          {actionsList.length === 0 ? (
            <p className="text-zinc-500 italic pl-5">No active rules triggered for this event.</p>
          ) : (
            <ul className="space-y-1.5 pl-5 list-disc text-zinc-300 leading-normal">
              {actionsList.map((action, idx) => (
                <li key={idx} className="marker:text-zinc-600">
                  {action}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Warning Error Log */}
        {log.errorMessage && (
          <div className="border border-red-900/40 bg-red-950/10 p-3 rounded-lg flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-red-400 text-[10px] uppercase tracking-wide">Error Trace</span>
              <p className="font-mono text-[10px] text-red-300/90 leading-relaxed break-all">
                {log.errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Collapsible Raw Webhook Payload */}
        <div className="space-y-2">
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#1f1f1f] bg-[#111111]/30 hover:bg-[#111111]/50 transition-colors text-zinc-400 font-semibold text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-blue-400" />
              Raw Webhook Payload
            </span>
            <span className="text-[10px] text-zinc-500">{showRaw ? "Collapse" : "Expand"}</span>
          </button>
          
          {showRaw && (
            <pre className="p-3 bg-[#070707] border border-[#1f1f1f] rounded-lg overflow-auto max-h-64 text-[10px] font-mono text-zinc-400 leading-relaxed scrollbar-thin">
              <code>{formattedPayload}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-[#1f1f1f] bg-[#070707] flex gap-2">
        <Button
          onClick={() => onRetry(log.id)}
          disabled={retrying}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold text-xs flex items-center justify-center gap-2 h-9"
        >
          <Play className={`h-3 w-3 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Re-processing..." : "Retry Event Webhook"}
        </Button>
      </div>
    </div>
  );
}
