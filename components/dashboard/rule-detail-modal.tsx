"use client";

import React, { useState, useEffect } from "react";
import { X, Eye, Pencil } from "lucide-react";
import { Rule } from "@/types";
import { Button } from "@/components/ui/button";

interface RuleDetailModalProps {
  rule: Rule | null;
  mode: "view" | "edit";
  onClose: () => void;
  onSave?: (ruleData: Rule) => Promise<void>;
}

export default function RuleDetailModal({ rule, mode, onClose, onSave }: RuleDetailModalProps) {
  const [form, setForm] = useState({
    name: "",
    eventType: "issues",
    field: "title",
    matchType: "contains",
    matchValue: "",
    addLabels: "",
    postComment: "",
    sendSlack: false,
    slackWebhookUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name,
        eventType: rule.eventType,
        field: rule.field,
        matchType: rule.matchType,
        matchValue: rule.matchValue,
        addLabels: rule.addLabels || "",
        postComment: rule.postComment || "",
        sendSlack: rule.sendSlack,
        slackWebhookUrl: rule.slackWebhookUrl || "",
      });
    }
  }, [rule]);

  if (!rule) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave || !form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...rule,
        ...form,
        postComment: form.postComment.trim() || null,
        slackWebhookUrl: form.sendSlack && form.slackWebhookUrl.trim() ? form.slackWebhookUrl : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const isView = mode === "view";
  const conditionStr =
    form.matchType === "always"
      ? "Always matches"
      : `${form.field} ${form.matchType} "${form.matchValue}"`;

  const inputClass = isView
    ? "w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-300 text-xs cursor-default"
    : "w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-800 text-xs";

  const selectClass = isView
    ? "w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-300 text-xs pointer-events-none"
    : "w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none text-xs";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-[#0a0a0a] border border-[#1f1f1f] rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            {isView ? <Eye className="h-4 w-4 text-zinc-400" /> : <Pencil className="h-4 w-4 text-zinc-400" />}
            <h3 className="text-sm font-bold text-zinc-100">
              {isView ? "Rule Details" : "Edit Rule"}
            </h3>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-1 rounded-md hover:bg-[#1f1f1f] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Default badge */}
          {rule.isDefault && (
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-950/30 border border-blue-900/30 text-blue-400 text-[10px] font-semibold">
              🔒 Default Rule — Cannot be deleted
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rule Name */}
            <div className="space-y-1.5 col-span-2">
              <label className="text-zinc-400 font-medium text-[11px]">Rule Name</label>
              <input
                type="text"
                value={form.name}
                readOnly={isView}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Event Type */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium text-[11px]">Trigger Event</label>
              <select
                value={form.eventType}
                disabled={isView}
                onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                className={selectClass}
              >
                <option value="issues">Issue Event</option>
                <option value="pull_request">Pull Request Event</option>
                <option value="push">Push Event</option>
              </select>
            </div>

            {/* Field */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium text-[11px]">Field To Match</label>
              <select
                value={form.field}
                disabled={isView}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                className={selectClass}
              >
                <option value="title">Title</option>
                <option value="body">Description Body</option>
                <option value="author">Author Username</option>
                <option value="any">Any (Title, Body, or Author)</option>
              </select>
            </div>

            {/* Match Type */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium text-[11px]">Comparison Operator</label>
              <select
                value={form.matchType}
                disabled={isView}
                onChange={(e) => setForm({ ...form, matchType: e.target.value })}
                className={selectClass}
              >
                <option value="always">Always Match (*)</option>
                <option value="contains">Contains Keyword</option>
                <option value="equals">Exactly Equals</option>
                <option value="starts_with">Starts With Keyword</option>
              </select>
            </div>

            {/* Match Value */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-medium text-[11px]">Match Value</label>
              <input
                type="text"
                value={form.matchValue}
                readOnly={isView}
                disabled={form.matchType === "always"}
                onChange={(e) => setForm({ ...form, matchValue: e.target.value })}
                className={`${inputClass} disabled:opacity-40`}
              />
            </div>
          </div>

          {/* Actions Section */}
          <div className="border-t border-[#1f1f1f]/60 pt-4 space-y-4">
            <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
              {isView ? "Configured Actions" : "Actions Executed on Match"}
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium text-[11px]">Add Labels</label>
                <input
                  type="text"
                  value={form.addLabels}
                  readOnly={isView}
                  onChange={(e) => setForm({ ...form, addLabels: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium text-[11px]">Post Comment</label>
                <input
                  type="text"
                  value={form.postComment}
                  readOnly={isView}
                  onChange={(e) => setForm({ ...form, postComment: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-3 col-span-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="modalSendSlack"
                    checked={form.sendSlack}
                    disabled={isView}
                    onChange={(e) => setForm({ ...form, sendSlack: e.target.checked })}
                    className="h-3.5 w-3.5 rounded bg-[#111111]/40 border-[#1f1f1f] text-green-600 focus:ring-0 cursor-pointer disabled:cursor-default"
                  />
                  <label htmlFor="modalSendSlack" className="text-zinc-400 font-medium text-[11px]">
                    Ping Alert to Slack Webhook
                  </label>
                </div>

                {form.sendSlack && (
                  <input
                    type="url"
                    value={form.slackWebhookUrl}
                    readOnly={isView}
                    onChange={(e) => setForm({ ...form, slackWebhookUrl: e.target.value })}
                    placeholder="Slack Incoming Webhook URL"
                    className={inputClass}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Condition Summary */}
          {isView && (
            <div className="border-t border-[#1f1f1f]/60 pt-3">
              <p className="text-[10px] text-zinc-500">
                Condition: <code className="bg-zinc-900/60 px-1.5 py-0.5 border border-[#1f1f1f] rounded text-zinc-300 font-mono text-[9px]">{conditionStr}</code>
              </p>
            </div>
          )}

          {/* Footer */}
          {!isView && (
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1f1f1f]/60">
              <Button type="button" variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-200 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-500 text-white font-semibold text-xs">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
