"use client";

import React, { useState, useEffect } from "react";
import { GitBranch, GitCommit, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle, Search, ScrollText, SearchX } from "lucide-react";
import { WebhookLog } from "@/types";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import { Shimmer } from "shimmer-from-structure";

interface LogsTabProps {
  logs: WebhookLog[];
  loadingLogs: boolean;
  fetchLogs: () => void;
  onSelectLog: (log: WebhookLog) => void;
  error?: string | null;
}

export default function LogsTab({
  logs,
  loadingLogs,
  fetchLogs,
  onSelectLog,
  error = null,
}: LogsTabProps) {
  const [filterRepo, setFilterRepo] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRepo, debouncedSearch]);

  const repoNames = Array.from(new Set(logs.map((l) => l.repository.fullName.split("/")[1])));

  // Parse payload JSON helper
  const parsePayload = (log: WebhookLog) => {
    let msg = "", hash = "", avatar = "", branch = "main";
    try {
      const obj = JSON.parse(log.payload);
      avatar = obj.sender?.avatar_url || "";
      if (log.eventType === "push") {
        msg = obj.commits?.[0]?.message || "Push event";
        hash = obj.commits?.[0]?.id?.slice(0, 7) || log.deliveryId.slice(0, 7);
        branch = obj.ref?.replace("refs/heads/", "") || "main";
      } else if (log.eventType === "issues") {
        msg = `#${obj.issue?.number || ""} ${obj.issue?.title || "Opened"}`;
        hash = `issue #${obj.issue?.number || ""}`;
        branch = "issues";
      } else if (log.eventType === "pull_request") {
        msg = `#${obj.pull_request?.number || ""} ${obj.pull_request?.title || "Opened"}`;
        hash = `pr #${obj.pull_request?.number || ""}`;
        branch = "pull_request";
      }
    } catch {
      msg = `${log.eventType}: ${log.action}`;
      hash = log.id.slice(0, 7);
    }
    return { commitMessage: msg || `${log.eventType}: ${log.action}`, commitHash: hash || log.id.slice(0, 7), avatarUrl: avatar, branchName: branch };
  };

  const filteredLogs = logs
    .filter((log) => {
      if (filterRepo !== "all" && log.repository.fullName.split("/")[1] !== filterRepo) return false;
      if (!debouncedSearch.trim()) return true;
      const { commitMessage, commitHash, branchName } = parsePayload(log);
      const q = debouncedSearch.toLowerCase();
      return commitMessage.toLowerCase().includes(q) || commitHash.toLowerCase().includes(q) || branchName.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()); // Latest on top

  const totalPages = Math.max(Math.ceil(filteredLogs.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredLogs.length);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  const getDuration = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return `${(hash % 30) + 5}s`;
  };

  if (error) {
    return (
      <div className="border border-red-900/30 bg-red-950/5 rounded-xl p-8 text-center space-y-3 font-sans">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
        <div className="space-y-1">
          <h5 className="font-bold text-zinc-200 text-xs">Failed to load logs</h5>
          <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-normal">{error}</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchLogs} className="border-red-900/40 hover:bg-red-950/20 text-red-400 text-[10px] h-7 px-3.5">
          <RefreshCw className="h-3 w-3 mr-1.5" /> Retry loading logs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans select-none text-xs">
      {/* Filters & Search Header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1f1f1f] pb-4 text-[11px] text-zinc-500 font-medium">
        <select
          value={filterRepo}
          onChange={(e) => setFilterRepo(e.target.value)}
          className="border border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-300 px-3 py-1.5 rounded-md focus:outline-none cursor-pointer"
        >
          <option value="all">All Repositories</option>
          {repoNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>

        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-800 transition-colors"
          />
        </div>

        <Button size="sm" variant="outline" className="border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-400 h-7 px-2.5 ml-auto" onClick={fetchLogs} disabled={loadingLogs} title="Refresh logs">
          <RefreshCw className={`h-3 w-3 ${loadingLogs ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Deployment Table list */}
      {loadingLogs ? (
        <Shimmer
          loading={true}
          shimmerColor="rgba(255, 255, 255, 0.06)"
          backgroundColor="rgba(255, 255, 255, 0.03)"
          duration={1.8}
          fallbackBorderRadius={8}
        >
          <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl overflow-hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
                  <th className="py-3 px-4"><div className="h-2.5 w-20 bg-zinc-800/50 rounded" /></th>
                  <th className="py-3 px-4"><div className="h-2.5 w-12 bg-zinc-800/50 rounded" /></th>
                  <th className="py-3 px-4"><div className="h-2.5 w-16 bg-zinc-800/50 rounded" /></th>
                  <th className="py-3 px-4"><div className="h-2.5 w-12 bg-zinc-800/50 rounded" /></th>
                  <th className="py-3 px-4"><div className="h-2.5 w-14 bg-zinc-800/50 rounded" /></th>
                  <th className="py-3 px-4"><div className="h-2.5 w-16 bg-zinc-800/50 rounded" /></th>
                  <th className="py-3 px-4"><div className="h-2.5 w-10 bg-zinc-800/50 rounded" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]/50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-b border-[#1f1f1f]/30">
                    <td className="py-3 px-4"><div className="h-3 w-40 bg-zinc-800/30 rounded" /></td>
                    <td className="py-3 px-4"><div className="flex items-center gap-1.5"><div className="h-1.5 w-1.5 rounded-full bg-zinc-700" /><div className="h-2.5 w-14 bg-zinc-800/30 rounded" /></div></td>
                    <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="h-4.5 w-4.5 rounded bg-zinc-800/40" /><div className="h-2.5 w-16 bg-zinc-800/30 rounded" /></div></td>
                    <td className="py-3 px-4"><div className="h-2.5 w-16 bg-zinc-800/30 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-2.5 w-14 bg-zinc-800/30 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-2.5 w-20 bg-zinc-800/30 rounded" /></td>
                    <td className="py-3 px-4"><div className="h-5 w-5 rounded-full bg-zinc-800/40" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Shimmer>
      ) : paginatedLogs.length === 0 ? (
        <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-12 text-center">
          {debouncedSearch.trim() ? (
            <div className="space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-zinc-900/50 border border-[#1f1f1f] flex items-center justify-center">
                <SearchX className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-zinc-300 text-sm">No matching logs</h5>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  No webhook logs match &ldquo;<span className="text-zinc-400 font-medium">{searchQuery}</span>&rdquo;. Try a different search term or filter.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="border-[#1f1f1f] bg-[#111] hover:bg-[#161b22] text-zinc-400 text-[10px] h-7 px-3 mt-1"
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-zinc-900/50 border border-[#1f1f1f] flex items-center justify-center">
                <ScrollText className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-zinc-300 text-sm">No webhook logs yet</h5>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Logs will appear here once GitHub delivers webhook events. Connect a repository and trigger an event to get started.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchLogs}
                className="border-[#1f1f1f] bg-[#111] hover:bg-[#161b22] text-zinc-400 text-[10px] h-7 px-3 mt-1"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Refresh logs
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#1f1f1f] text-zinc-500 font-semibold text-[10px] uppercase tracking-wider bg-[#0d0d0d]">
                  <th className="py-3 px-4">Commit / Event</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-4">Hash</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Pushed</th>
                  <th className="py-3 px-4">Author</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]/50">
                {paginatedLogs.map((log) => {
                  const { commitMessage, commitHash, avatarUrl, branchName } = parsePayload(log);
                  const duration = getDuration(log.id);
                  const repoName = log.repository.fullName.split("/")[1] || "repo";
                  const initialChar = repoName.slice(0, 1).toUpperCase();

                  const statusConfig = {
                    success: { color: "text-green-400", dot: "bg-green-500", label: "Ready" },
                    failed: { color: "text-red-400", dot: "bg-red-500", label: "Error" },
                    skipped: { color: "text-zinc-500", dot: "bg-zinc-500", label: "Skipped" },
                    pending: { color: "text-blue-400", dot: "bg-blue-500 animate-pulse", label: "Building" },
                  };
                  const statusItem = statusConfig[log.status] || statusConfig.skipped;

                  // Render specific date/time string
                  const formattedTime = new Date(log.processedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });

                  return (
                    <tr key={log.id} onClick={() => onSelectLog(log)} className="hover:bg-[#111111]/50 cursor-pointer transition-colors border-b border-[#1f1f1f]/30">
                      <td className="py-3 px-4 font-semibold text-zinc-200 truncate max-w-[240px]">{commitMessage}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${statusItem.dot}`} />
                          <span className={`font-mono text-[10px] ${statusItem.color}`}>
                            {statusItem.label} <span className="text-zinc-500 text-[9px]">{duration}</span>
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-4.5 w-4.5 rounded-[4px] flex items-center justify-center font-bold text-zinc-300 text-[8px] font-mono shadow-sm bg-[#111111] border border-[#1f1f1f]">
                            {initialChar}
                          </div>
                          <span className="text-zinc-300 font-medium font-sans">{repoName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1">
                          <GitCommit className="h-3.5 w-3.5 text-zinc-600" />
                          <span>{commitHash}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-zinc-400">
                        <div className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3 text-zinc-600" />
                          <span>{branchName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[10px] text-zinc-500">{formattedTime}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {avatarUrl ? <img src={avatarUrl} alt="author" className="h-5 w-5 rounded-full border border-[#1f1f1f]" /> : <div className="h-5 w-5 rounded-full bg-zinc-800 border border-[#1f1f1f]" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border-t border-[#1f1f1f] text-[10px] text-zinc-500 font-mono">
            <div>
              {filteredLogs.length > 0 ? (
                <span>Showing <span className="font-semibold text-zinc-300">{startIndex + 1}</span>–<span className="font-semibold text-zinc-300">{endIndex}</span> of <span className="font-semibold text-zinc-300">{filteredLogs.length}</span> logs</span>
              ) : (
                <span>Showing 0 of 0 logs</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" disabled={currentPage === 1 || loadingLogs} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-400 h-6 w-12 px-0 flex items-center justify-center disabled:opacity-40">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-zinc-400 px-2">Page {currentPage} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={currentPage === totalPages || loadingLogs} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-400 h-6 w-12 px-0 flex items-center justify-center disabled:opacity-40">
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
