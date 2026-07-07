"use client";

import React, { useState } from "react";
import { RefreshCw, GitBranch, Search, AlertTriangle, ChevronLeft, ChevronRight, FolderGit2, SearchX } from "lucide-react";
import { Repository } from "@/types";
import { useDebounce } from "@/hooks/use-debounce";
import { Shimmer } from "shimmer-from-structure";
import { getProjectGradient } from "@/utils/share/gradient";
import { formatDate } from "@/utils/share/format-date";
import { Switch } from "@/components/ui/switch";
import { Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReposTabProps {
  repos: Repository[];
  loadingRepos: boolean;
  fetchRepos: () => void;
  toggleRepoConnection: (repo: Repository) => void;
  error?: string | null;
}

export default function ReposTab({
  repos,
  loadingRepos,
  fetchRepos,
  toggleRepoConnection,
  error = null,
}: ReposTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredRepos = repos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      repo.fullName.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Pagination bounds
  const totalPages = Math.max(Math.ceil(filteredRepos.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRepos.length);
  const paginatedRepos = filteredRepos.slice(startIndex, endIndex);

  // Inline Error State
  if (error) {
    return (
      <div className="border border-red-900/30 bg-red-950/5 rounded-xl p-8 text-center space-y-3 font-sans">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
        <div className="space-y-1">
          <h5 className="font-bold text-zinc-200 text-xs">Failed to load projects</h5>
          <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-normal">{error}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchRepos}
          className="border-red-900/40 hover:bg-red-950/20 text-red-400 text-[10px] h-7 px-3.5"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Retry loading projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans select-none text-xs">
      {/* Search & Actions Header */}
      <div className="flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to page 1 on search
            }}
            className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-800 transition-colors"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-400"
          onClick={fetchRepos}
          disabled={loadingRepos}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingRepos ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Grid Content */}
      {loadingRepos ? (
        <Shimmer
          loading={true}
          shimmerColor="rgba(255, 255, 255, 0.06)"
          backgroundColor="rgba(255, 255, 255, 0.03)"
          duration={1.8}
          fallbackBorderRadius={12}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-5 flex flex-col justify-between h-[220px]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#111111] border border-[#1f1f1f]" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-28 bg-zinc-800 rounded" />
                      <div className="h-2.5 w-20 bg-zinc-800/50 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-9 rounded-full bg-zinc-800" />
                </div>
                <div className="h-3 w-32 bg-zinc-800/40 rounded mt-4" />
                <div className="space-y-1.5 mt-3">
                  <div className="h-2.5 w-full bg-zinc-800/30 rounded" />
                  <div className="h-2.5 w-3/4 bg-zinc-800/30 rounded" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1f1f1f]/60">
                  <div className="h-2.5 w-24 bg-zinc-800/30 rounded" />
                  <div className="h-2.5 w-14 bg-zinc-800/30 rounded" />
                </div>
              </div>
            ))}
          </div>
        </Shimmer>
      ) : paginatedRepos.length === 0 ? (
        <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-12 text-center">
          {searchQuery ? (
            <div className="space-y-3">
              <div className="mx-auto h-12 w-12 rounded-xl bg-zinc-900/50 border border-[#1f1f1f] flex items-center justify-center">
                <SearchX className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-zinc-300 text-sm">No matching projects</h5>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  No repositories match &ldquo;<span className="text-zinc-400 font-medium">{searchQuery}</span>&rdquo;. Try a different search term.
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
                <FolderGit2 className="h-5 w-5 text-zinc-600" />
              </div>
              <div className="space-y-1">
                <h5 className="font-semibold text-zinc-300 text-sm">No repositories found</h5>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  We couldn&apos;t find any GitHub repositories on your account. Make sure you have at least one repo and try refreshing.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchRepos}
                className="border-[#1f1f1f] bg-[#111] hover:bg-[#161b22] text-zinc-400 text-[10px] h-7 px-3 mt-1"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                Refresh repositories
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedRepos.map((repo) => {
              const projectGradient = getProjectGradient(repo.name);
              const displayUrl = `${repo.name}.vercel.app`;
              const repoDesc = repo.description || "Active repository connected to GitHub automation workflows.";
              const lastPushStr = repo.pushedAt ? formatDate(repo.pushedAt) : formatDate(repo.updatedAt);
              const initialChar = repo.name.slice(0, 1).toUpperCase();

              return (
                <div
                  key={repo.githubId}
                  className="group border border-[#1f1f1f] bg-[#0a0a0a] hover:border-zinc-800 hover:bg-[#111111]/30 rounded-xl p-5 flex flex-col justify-between transition-all duration-200"
                >
                  {/* Card Top Section */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-zinc-300 bg-[#111111] border border-[#1f1f1f] text-xs font-mono shadow-sm flex-shrink-0"
                      >
                        {initialChar}
                      </div>
                      
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm text-zinc-100 truncate group-hover:text-white transition-colors">
                          {repo.name}
                        </h3>
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium truncate block mt-0.5"
                        >
                          {displayUrl}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex h-2 w-2">
                        {repo.isConnected ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </>
                        ) : (
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-700"></span>
                        )}
                      </div>
                      <div title={repo.isConnected ? "Disconnect webhook" : "Connect webhook"}>
                        <Switch
                          checked={repo.isConnected}
                          onCheckedChange={() => toggleRepoConnection(repo)}
                        />
                      </div>
                    </div>
                  </div>

                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#111111] hover:bg-[#161b22] text-zinc-400 hover:text-zinc-200 border border-[#1f1f1f] px-2.5 py-1 rounded-full text-[10px] font-mono transition-colors w-fit mt-4"
                  >
                    <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.35 3.12.88.01.47.01.92.01 1.07 0 .21-.15.46-.55.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8z" />
                    </svg>
                    <span className="truncate max-w-[140px]">{repo.fullName}</span>
                  </a>

                  <p className="text-[12px] text-zinc-400 line-clamp-2 mt-3.5 min-h-[36px] leading-relaxed font-sans">
                    {repoDesc}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-4 pt-3.5 border-t border-[#1f1f1f]/60">
                    <span>Pushed {lastPushStr}</span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {repo.defaultBranch || "main"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {filteredRepos.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl text-[10px] text-zinc-500 font-mono mt-4">
              <div>
                <span>
                  Showing <span className="font-semibold text-zinc-300">{startIndex + 1}</span>–
                  <span className="font-semibold text-zinc-300">{endIndex}</span> of{" "}
                  <span className="font-semibold text-zinc-300">{filteredRepos.length}</span> projects
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1 || loadingRepos}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-400 h-6 w-12 px-0 flex items-center justify-center disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-zinc-400 px-2 font-mono">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages || loadingRepos}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-400 h-6 w-12 px-0 flex items-center justify-center disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
