"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import ReposTab from "@/components/dashboard/repos-tab";
import LogsTab from "@/components/dashboard/logs-tab";
import LogDetails from "@/components/dashboard/log-details";
import RulesTab from "@/components/dashboard/rules-tab";
import RuleDetailModal from "@/components/dashboard/rule-detail-modal";
import WebhookChart from "@/components/dashboard/webhook-chart";
import ConfirmationModal from "@/components/dashboard/confirmation-modal";
import TopLoader from "@/components/dashboard/top-loader";
import { Repository, Rule, WebhookLog } from "@/types";

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<"dashboard" | "logs" | "rules">("dashboard");
  const [user, setUser] = useState<{ username: string; avatarUrl?: string } | null>(null);
  
  // Data State
  const [repos, setRepos] = useState<Repository[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  // Loading States
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Error States
  const [reposError, setReposError] = useState<string | null>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [logsError, setLogsError] = useState<string | null>(null);

  // Modal States
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [pendingDisconnectRepo, setPendingDisconnectRepo] = useState<Repository | null>(null);
  const [deletingRule, setDeletingRule] = useState(false);
  const [disconnectingRepo, setDisconnectingRepo] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Rule View/Edit Modal States
  const [viewingRule, setViewingRule] = useState<Rule | null>(null);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

  // Toast notice
  const [notice, setNotice] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Derived global loading state
  const isAnythingLoading = loadingRepos || loadingRules || loadingLogs || deletingRule || disconnectingRepo || retryingLogId !== null;

  const showNotice = (message: string, type: "success" | "error" = "success") => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 3500);
  };

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser({ username: data.username, avatarUrl: data.avatarUrl });
      } else {
        window.location.href = "/";
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
      window.location.href = "/";
    }
  };

  const fetchRepos = async (isBackground = false) => {
    try {
      if (!isBackground) setLoadingRepos(true);
      setReposError(null);
      const res = await fetch("/api/repos");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load projects from endpoint.");
      if (data.repositories) setRepos(data.repositories);
    } catch (e: any) {
      if (!isBackground) setReposError(e.message || "Failed to load repositories.");
    } finally {
      if (!isBackground) setLoadingRepos(false);
    }
  };

  const fetchRules = async (isBackground = false) => {
    try {
      if (!isBackground) setLoadingRules(true);
      setRulesError(null);
      const res = await fetch("/api/rules");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load active rules from database.");
      if (data.rules) setRules(data.rules);
    } catch (e: any) {
      if (!isBackground) setRulesError(e.message || "Failed to load automation rules.");
    } finally {
      if (!isBackground) setLoadingRules(false);
    }
  };

  const fetchLogs = async (isBackground = false) => {
    try {
      if (!isBackground) setLoadingLogs(true);
      setLogsError(null);
      const res = await fetch("/api/logs");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load deployment logs.");
      if (data.logs) setLogs(data.logs);
    } catch (e: any) {
      if (!isBackground) setLogsError(e.message || "Failed to load activity logs.");
    } finally {
      if (!isBackground) setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchRepos();
    fetchRules();
    fetchLogs();

    // Poll the server every 5 seconds for new events/logs in real-time
    const interval = setInterval(() => {
      fetchRepos(true);
      fetchRules(true);
      fetchLogs(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Repository connection toggling logic
  const toggleRepoConnection = async (repo: Repository) => {
    const isConnecting = !repo.isConnected;
    if (!isConnecting) {
      setPendingDisconnectRepo(repo);
      return;
    }
    await executeRepoToggle(repo, true);
  };

  const executeRepoToggle = async (repo: Repository, isConnecting: boolean) => {
    setRepos((prev) =>
      prev.map((r) => (r.githubId === repo.githubId ? { ...r, isConnected: isConnecting } : r))
    );

    try {
      const endpoint = isConnecting ? "/api/repos/connect" : "/api/repos/disconnect";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubId: repo.githubId,
          name: repo.name,
          fullName: repo.fullName,
          ownerName: repo.ownerName,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to update connection");

      showNotice(
        isConnecting ? `Connected ${repo.name} successfully.` : `Disconnected ${repo.name} successfully.`,
        "success"
      );
      fetchLogs();
    } catch (error: any) {
      setRepos((prev) =>
        prev.map((r) => (r.githubId === repo.githubId ? { ...r, isConnected: !isConnecting } : r))
      );
      showNotice(error.message || "Failed to toggle connection", "error");
    }
  };

  const handleConfirmDisconnectRepo = async () => {
    if (!pendingDisconnectRepo) return;
    try {
      setDisconnectingRepo(true);
      await executeRepoToggle(pendingDisconnectRepo, false);
    } finally {
      setDisconnectingRepo(false);
      setPendingDisconnectRepo(null);
    }
  };

  // Rules Actions
  const handleCreateRule = async (ruleData: Partial<Rule>) => {
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to save rule");

      showNotice(`Successfully created rule "${ruleData.name}".`, "success");
      fetchRules();
    } catch (error: any) {
      showNotice(error.message || "Failed to create rule", "error");
    }
  };

  const toggleRuleActive = async (rule: Rule) => {
    const isActivating = !rule.isActive;
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isActive: isActivating } : r))
    );

    try {
      const res = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, isActive: isActivating }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to update status");
    } catch (error: any) {
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: !isActivating } : r))
      );
      showNotice(error.message || "Failed to toggle status", "error");
    }
  };

  const handleUpdateRule = async (ruleData: Rule) => {
    try {
      const res = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to update rule");

      showNotice(`Updated rule "${ruleData.name}" successfully.`, "success");
      setEditingRule(null);
      fetchRules();
    } catch (error: any) {
      showNotice(error.message || "Failed to update rule", "error");
    }
  };

  const handleConfirmDeleteRule = async () => {
    if (!deleteRuleId) return;
    try {
      setDeletingRule(true);
      const res = await fetch(`/api/rules?id=${deleteRuleId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to delete rule");

      showNotice("Deleted rule successfully.", "success");
      fetchRules();
    } catch (error: any) {
      showNotice(error.message || "Failed to delete rule", "error");
    } finally {
      setDeletingRule(false);
      setDeleteRuleId(null);
    }
  };

  // Logs Retry Actions
  const handleRetryLog = async (logId: string) => {
    try {
      setRetryingLogId(logId);
      const res = await fetch("/api/logs/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to retry");

      showNotice("Retry request submitted successfully.", "success");
      await fetchLogs();

      const freshRes = await fetch("/api/logs");
      const freshData = await freshRes.json();
      const freshLog = freshData.logs?.find((l: WebhookLog) => l.id === logId);
      if (freshLog) setSelectedLog(freshLog);
    } catch (error: any) {
      showNotice(error.message || "Retry failed", "error");
    } finally {
      setRetryingLogId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-zinc-100 font-sans antialiased">
      <TopLoader loading={isAnythingLoading} />
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          setSelectedLog(null);
        }}
        username={user?.username || "loading"}
        avatarUrl={user?.avatarUrl}
        onLogout={() => setShowLogoutConfirm(true)}
      />

      <main className="flex-1 overflow-y-auto h-screen p-6 md:p-8 select-none bg-black">
        {activeView === "dashboard" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-4">
              <h2 className="text-sm font-bold tracking-tight text-zinc-200">Overview Dashboard</h2>
            </div>
            
            <WebhookChart logs={logs} />
            
            <div className="w-full">
              <ReposTab
                repos={repos}
                loadingRepos={loadingRepos}
                fetchRepos={fetchRepos}
                toggleRepoConnection={toggleRepoConnection}
                error={reposError}
              />
            </div>
          </div>
        )}

        {activeView === "logs" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-4">
              <h2 className="text-sm font-bold tracking-tight text-zinc-200">Logs & Actions</h2>
            </div>
            <LogsTab
              logs={logs}
              loadingLogs={loadingLogs}
              fetchLogs={fetchLogs}
              onSelectLog={setSelectedLog}
              error={logsError}
            />
          </div>
        )}

        {activeView === "rules" && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-4">
              <h2 className="text-sm font-bold tracking-tight text-zinc-200">Automation Rule Builder</h2>
            </div>
            <RulesTab
              rules={rules}
              loadingRules={loadingRules}
              onCreateRule={handleCreateRule}
              onToggleRule={toggleRuleActive}
              onDeleteRule={async (id) => { setDeleteRuleId(id); }}
              onEditRule={(rule) => setEditingRule(rule)}
              onViewRule={(rule) => setViewingRule(rule)}
              error={rulesError}
              fetchRules={fetchRules}
            />
          </div>
        )}
      </main>

      <LogDetails
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
        onRetry={handleRetryLog}
        retrying={retryingLogId !== null}
      />

      {/* Rule View Modal */}
      <RuleDetailModal
        rule={viewingRule}
        mode="view"
        onClose={() => setViewingRule(null)}
      />

      {/* Rule Edit Modal */}
      <RuleDetailModal
        rule={editingRule}
        mode="edit"
        onClose={() => setEditingRule(null)}
        onSave={handleUpdateRule}
      />

      {/* Disconnect Repo Modal */}
      <ConfirmationModal
        isOpen={pendingDisconnectRepo !== null}
        title="Disconnect Repository webhook"
        description={`Are you sure you want to disconnect ${pendingDisconnectRepo?.name}? This will remove the GitHub webhook listener and stop all auto-actions.`}
        confirmLabel="Disconnect"
        variant="danger"
        isLoading={disconnectingRepo}
        onConfirm={handleConfirmDisconnectRepo}
        onCancel={() => setPendingDisconnectRepo(null)}
      />

      {/* Delete Rule Modal */}
      <ConfirmationModal
        isOpen={deleteRuleId !== null}
        title="Delete Automation Rule"
        description="Are you sure you want to delete this automation rule? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deletingRule}
        onConfirm={handleConfirmDeleteRule}
        onCancel={() => setDeleteRuleId(null)}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        title="Confirm Sign Out"
        description="Are you sure you want to sign out of your AutoBot session? You will need to re-authenticate with GitHub to access the dashboard."
        confirmLabel="Sign Out"
        variant="danger"
        onConfirm={() => {
          window.location.href = "/api/auth/logout";
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`border rounded-lg shadow-xl px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
              notice.type === "success"
                ? "bg-green-950/40 text-green-400 border-green-900/50"
                : "bg-red-950/40 text-red-400 border-red-900/50"
            }`}
          >
            <span>{notice.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
