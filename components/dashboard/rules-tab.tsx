"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Sliders, AlertTriangle, Search, Eye, Pencil, ChevronLeft, ChevronRight, Shield, SearchX } from "lucide-react";
import { Rule } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import CreateRuleForm from "./create-rule-form";
import { useDebounce } from "@/hooks/use-debounce";
import { Shimmer } from "shimmer-from-structure";

const PRESETS = [
  {
    name: "Slack Alert on All Issues",
    eventType: "issues",
    field: "any",
    matchType: "always",
    matchValue: "*",
    addLabels: "",
    postComment: null,
    sendSlack: true,
    slackWebhookUrl: "",
  },
  {
    name: "Welcome Comment on new PRs",
    eventType: "pull_request",
    field: "any",
    matchType: "always",
    matchValue: "*",
    addLabels: "welcome",
    postComment: "Thanks for opening this PR! Our team will review it shortly.",
    sendSlack: false,
    slackWebhookUrl: null,
  },
  {
    name: "Label Bug Reports",
    eventType: "issues",
    field: "title",
    matchType: "contains",
    matchValue: "bug",
    addLabels: "bug, high-priority",
    postComment: "This issue has been identified as a bug and labeled accordingly.",
    sendSlack: true,
    slackWebhookUrl: "",
  },
];

interface RulesTabProps {
  rules: Rule[];
  loadingRules: boolean;
  onCreateRule: (ruleData: Partial<Rule>) => Promise<void>;
  onToggleRule: (rule: Rule) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
  onEditRule: (rule: Rule) => void;
  onViewRule: (rule: Rule) => void;
  error?: string | null;
  fetchRules: () => void;
}

export default function RulesTab({
  rules,
  loadingRules,
  onCreateRule,
  onToggleRule,
  onDeleteRule,
  onEditRule,
  onViewRule,
  error = null,
  fetchRules,
}: RulesTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedPreset(preset);
    setIsCreating(true);
  };

  const handleFormSubmit = async (ruleData: Partial<Rule>) => {
    await onCreateRule(ruleData);
    setIsCreating(false);
    setSelectedPreset(null);
  };

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      rule.eventType.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (rule.matchValue && rule.matchValue.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  const totalPages = Math.max(Math.ceil(filteredRules.length / itemsPerPage), 1);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRules.length);
  const paginatedRules = filteredRules.slice(startIndex, endIndex);

  // Inline Error View
  if (error) {
    return (
      <div className="border border-red-900/30 bg-red-950/5 rounded-xl p-8 text-center space-y-3 font-sans">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
        <div className="space-y-1">
          <h5 className="font-bold text-zinc-200 text-xs">Failed to load automation rules</h5>
          <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-normal">{error}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchRules}
          className="border-red-900/40 hover:bg-red-950/20 text-red-400 text-[10px] h-7 px-3.5"
        >
          Retry loading rules
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none text-xs">
      {/* Templates Row */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-zinc-300">Quick Start Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="border border-[#1f1f1f] bg-[#0a0a0a] hover:border-zinc-800 p-4 rounded-xl cursor-pointer hover:bg-[#111111]/30 transition-all duration-200 flex flex-col justify-between h-28"
            >
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono uppercase font-bold tracking-wider">
                  Preset
                </span>
                <h5 className="font-bold text-zinc-200 truncate leading-snug">{preset.name}</h5>
              </div>
              <span className="text-[10px] text-green-500 font-semibold flex items-center gap-1">
                <Plus className="h-3 w-3" /> Import Template
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Header / Trigger */}
      <div className="flex justify-between items-center border-b border-[#1f1f1f] pb-3">
        <h4 className="text-xs font-semibold text-zinc-300">
          {isCreating ? "Build Automation Workflow" : "Active Automation Rules"}
        </h4>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-500 text-white font-semibold h-7 px-3 text-[11px]"
          title={isCreating ? "Cancel creating rule" : "Create a new custom automation rule"}
          onClick={() => {
            setIsCreating(!isCreating);
            setSelectedPreset(null);
          }}
        >
          {isCreating ? "Cancel" : "Create Custom Rule"}
        </Button>
      </div>

      {/* Create Rule Form Panel */}
      {isCreating ? (
        <CreateRuleForm
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsCreating(false);
            setSelectedPreset(null);
          }}
          initialPreset={selectedPreset}
        />
      ) : (
        /* Rules List Panel */
        <div className="space-y-4">
          {/* Rules Search Input */}
          {rules.length > 0 && (
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-zinc-800 transition-colors"
              />
            </div>
          )}

          {loadingRules ? (
            <Shimmer
              loading={true}
              shimmerColor="rgba(255, 255, 255, 0.06)"
              backgroundColor="rgba(255, 255, 255, 0.03)"
              duration={1.8}
              fallbackBorderRadius={12}
            >
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-4 flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3.5 w-36 bg-zinc-800/40 rounded" />
                        <div className="h-4 w-16 bg-zinc-800/30 rounded" />
                      </div>
                      <div className="h-2.5 w-48 bg-zinc-800/20 rounded" />
                      <div className="flex gap-2 pt-1">
                        <div className="h-2.5 w-16 bg-zinc-800/20 rounded" />
                        <div className="h-2.5 w-20 bg-zinc-800/20 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <div className="h-7 w-7 rounded-md bg-zinc-800/30" />
                      <div className="h-7 w-7 rounded-md bg-zinc-800/30" />
                      <div className="h-5 w-9 rounded-full bg-zinc-800/30" />
                    </div>
                  </div>
                ))}
              </div>
            </Shimmer>
          ) : paginatedRules.length === 0 ? (
            <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-12 text-center">
              {searchQuery ? (
                <div className="space-y-3">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-zinc-900/50 border border-[#1f1f1f] flex items-center justify-center">
                    <SearchX className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-semibold text-zinc-300 text-sm">No matching rules</h5>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                      No rules match &ldquo;<span className="text-zinc-400 font-medium">{searchQuery}</span>&rdquo;. Try a different search term.
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
                    <Sliders className="h-5 w-5 text-zinc-600" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-semibold text-zinc-300 text-sm">No automation rules yet</h5>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                      Get started by importing a template above, or create a custom rule to automate your GitHub workflow.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2.5">
                {paginatedRules.map((rule) => {
                  const conditionStr =
                    rule.matchType === "always"
                      ? "Always matches"
                      : `${rule.field} ${rule.matchType} "${rule.matchValue}"`;

                  return (
                    <div
                      key={rule.id}
                      className="border border-[#1f1f1f] bg-[#0a0a0a] hover:border-zinc-800 rounded-xl p-4 flex items-center justify-between transition-all duration-150"
                    >
                      {/* Left: Metadata & Condition details */}
                      <div className="space-y-1.5 min-w-0 flex-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-semibold text-[13px] text-zinc-200 truncate">
                            {rule.name}
                          </h5>
                          <span className="px-2 py-0.5 rounded-[4px] text-[9px] bg-[#111] text-zinc-400 font-mono border border-[#1f1f1f] uppercase tracking-wider font-semibold">
                            {rule.eventType}
                          </span>
                          {rule.isDefault && (
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[9px] bg-blue-950/20 text-blue-400 font-semibold border border-blue-900/20 flex items-center gap-1">
                              <Shield className="h-2.5 w-2.5" /> Default
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                          <span className="font-mono">Condition:</span>
                          <code className="bg-[#111]/60 px-1.5 py-0.5 border border-[#1f1f1f] rounded text-zinc-300 font-mono text-[9px]">
                            {conditionStr}
                          </code>
                        </div>
                      </div>

                      {/* Right: Actions and Controls */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Indicators for configured tasks */}
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 border-r border-[#1f1f1f] pr-4 h-6">
                          {rule.addLabels && <span className="text-zinc-400">🏷️ Label</span>}
                          {rule.postComment && <span className="text-zinc-400">💬 Comment</span>}
                          {rule.sendSlack && <span className="text-zinc-400">🔔 Slack</span>}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onViewRule(rule)}
                            title="View rule details"
                            className="p-1.5 rounded-md hover:bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-[#1f1f1f] transition-all"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => onEditRule(rule)}
                            title="Edit rule configuration"
                            className="p-1.5 rounded-md hover:bg-zinc-900/50 text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-[#1f1f1f] transition-all"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {!rule.isDefault && (
                            <button
                              onClick={() => onDeleteRule(rule.id)}
                              title="Delete this rule"
                              className="p-1.5 rounded-md hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-900/30 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Switch */}
                        <div className="flex items-center gap-1.5 border-l border-[#1f1f1f] pl-4 h-6">
                          <span className={`text-[10px] font-mono ${rule.isActive ? "text-green-500" : "text-zinc-500"}`}>
                            {rule.isActive ? "ON" : "OFF"}
                          </span>
                          <div title={rule.isActive ? "Disable this rule" : "Enable this rule"}>
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={() => onToggleRule(rule)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl text-[10px] text-zinc-500 font-mono">
                <div>
                  {filteredRules.length > 0 ? (
                    <span>Showing <span className="font-semibold text-zinc-300">{startIndex + 1}</span>–<span className="font-semibold text-zinc-300">{endIndex}</span> of <span className="font-semibold text-zinc-300">{filteredRules.length}</span> rules</span>
                  ) : (
                    <span>Showing 0 of 0 rules</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    title="Previous page"
                    className="border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-400 h-6 w-12 px-0 flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-zinc-400 px-2">Page {currentPage} of {totalPages}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    title="Next page"
                    className="border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111] text-zinc-400 h-6 w-12 px-0 flex items-center justify-center disabled:opacity-40"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
