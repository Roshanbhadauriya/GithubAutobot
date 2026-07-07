"use client";

import React, { useState, useEffect } from "react";
import { Rule } from "@/types";
import { Button } from "@/components/ui/button";

interface CreateRuleFormProps {
  onSubmit: (ruleData: Partial<Rule>) => Promise<void> | void;
  onCancel: () => void;
  initialPreset: any | null;
}

export default function CreateRuleForm({
  onSubmit,
  onCancel,
  initialPreset,
}: CreateRuleFormProps) {
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

  // Watch for presets clicked in parent
  useEffect(() => {
    if (initialPreset) {
      setForm({
        name: initialPreset.name || "",
        eventType: initialPreset.eventType || "issues",
        field: initialPreset.field || "title",
        matchType: initialPreset.matchType || "contains",
        matchValue: initialPreset.matchValue || "",
        addLabels: initialPreset.addLabels || "",
        postComment: initialPreset.postComment || "",
        sendSlack: !!initialPreset.sendSlack,
        slackWebhookUrl: initialPreset.slackWebhookUrl || "",
      });
    }
  }, [initialPreset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    await onSubmit({
      ...form,
      postComment: form.postComment.trim() ? form.postComment : "",
      slackWebhookUrl: form.sendSlack && form.slackWebhookUrl.trim() ? form.slackWebhookUrl : "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-xl p-5 space-y-4 animate-zoom-in font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule Name */}
        <div className="space-y-1.5 col-span-2">
          <label className="text-zinc-400 font-medium">Rule Name</label>
          <input
            type="text"
            placeholder="e.g. Welcome Comment on new PRs"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-800 text-xs"
          />
        </div>

        {/* Event Type */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Trigger Event</label>
          <select
            value={form.eventType}
            onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none text-xs"
          >
            <option value="issues">Issue Event</option>
            <option value="pull_request">Pull Request Event</option>
            <option value="push">Push Event</option>
          </select>
        </div>

        {/* Field Match */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Field To Match</label>
          <select
            value={form.field}
            onChange={(e) => setForm({ ...form, field: e.target.value })}
            className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none text-xs"
          >
            <option value="title">Title</option>
            <option value="body">Description Body</option>
            <option value="author">Author Username</option>
            <option value="any">Any (Title, Body, or Author)</option>
          </select>
        </div>

        {/* Match Type */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Comparison Operator</label>
          <select
            value={form.matchType}
            onChange={(e) => setForm({ ...form, matchType: e.target.value })}
            className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-300 focus:outline-none text-xs"
          >
            <option value="always">Always Match (*)</option>
            <option value="contains">Contains Keyword</option>
            <option value="equals">Exactly Equals</option>
            <option value="starts_with">Starts With Keyword</option>
          </select>
        </div>

        {/* Match Value */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 font-medium">Match Value</label>
          <input
            type="text"
            placeholder="Match string (e.g. bug, main)"
            value={form.matchValue}
            onChange={(e) => setForm({ ...form, matchValue: e.target.value })}
            disabled={form.matchType === "always"}
            className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-zinc-800 disabled:opacity-40 text-xs"
          />
        </div>
      </div>

      <div className="border-t border-[#1f1f1f]/60 pt-4 space-y-4">
        <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Actions Executed on Match</h5>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Add Repository Labels</label>
            <input
              type="text"
              placeholder="Comma separated (e.g. bug, welcome)"
              value={form.addLabels}
              onChange={(e) => setForm({ ...form, addLabels: e.target.value })}
              className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 font-medium">Post Welcome Comment</label>
            <input
              type="text"
              placeholder="Body comment to write on Issue/PR"
              value={form.postComment}
              onChange={(e) => setForm({ ...form, postComment: e.target.value })}
              className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none text-xs"
            />
          </div>

          <div className="space-y-3 col-span-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendSlack"
                checked={form.sendSlack}
                onChange={(e) => setForm({ ...form, sendSlack: e.target.checked })}
                className="h-3.5 w-3.5 rounded bg-[#111111]/40 border-[#1f1f1f] text-green-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="sendSlack" className="text-zinc-400 font-medium cursor-pointer text-xs">
                Ping Alert to Slack Webhook
              </label>
            </div>
            
            {form.sendSlack && (
              <input
                type="url"
                placeholder="Slack Incoming Webhook URL (https://hooks.slack.com/...)"
                value={form.slackWebhookUrl}
                onChange={(e) => setForm({ ...form, slackWebhookUrl: e.target.value })}
                required
                className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md px-3 py-1.5 text-zinc-200 focus:outline-none text-xs"
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-[#1f1f1f]/60">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-zinc-200 text-xs">
          Cancel
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-semibold text-xs">
          Save Automation Rule
        </Button>
      </div>
    </form>
  );
}
