"use client";

import React from "react";
import { LayoutDashboard, ScrollText, Sliders, LogOut, Search, User } from "lucide-react";

interface SidebarProps {
  activeView: "dashboard" | "logs" | "rules";
  onViewChange: (view: "dashboard" | "logs" | "rules") => void;
  username: string;
  avatarUrl?: string;
  onLogout: () => void;
}

export default function Sidebar({
  activeView,
  onViewChange,
  username,
  avatarUrl,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-black border-r border-[#1f1f1f] flex flex-col justify-between h-screen sticky top-0 font-sans select-none flex-shrink-0">
      {/* Top Section */}
      <div className="flex flex-col p-4 space-y-4">
        {/* Product Workspace Header */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#111111]/50 transition-colors cursor-pointer border border-[#1f1f1f] bg-[#070707]">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Vercel-style Triangle Logo */}
            <svg viewBox="0 0 75 65" className="h-4 w-4 fill-zinc-100 flex-shrink-0">
              <path d="M37.5 0 L75 65 L0 65 Z" />
            </svg>
            <span className="font-bold text-[11px] text-zinc-200 truncate max-w-[130px]">
              AutoBot Workspace
            </span>
          </div>
          {/* Dropdown Chevron */}
          <svg viewBox="0 0 24 24" width="10" height="10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 mr-0.5">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        {/* Search Mock */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search..."
            disabled
            className="w-full bg-[#111111]/40 border border-[#1f1f1f] rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-600 focus:outline-none cursor-not-allowed"
          />
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col space-y-1 pt-2">
          <button
            onClick={() => onViewChange("dashboard")}
            title="View overview dashboard with charts and repositories"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeView === "dashboard"
                ? "bg-[#111111] text-zinc-100 font-semibold border border-[#1f1f1f]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#111111]/30 border border-transparent"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          
          <button
            onClick={() => onViewChange("logs")}
            title="View webhook event logs and executed actions"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeView === "logs"
                ? "bg-[#111111] text-zinc-100 font-semibold border border-[#1f1f1f]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#111111]/30 border border-transparent"
            }`}
          >
            <ScrollText className="h-4 w-4" />
            Logs & Actions
          </button>
          
          <button
            onClick={() => onViewChange("rules")}
            title="Manage automation rules and workflows"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              activeView === "rules"
                ? "bg-[#111111] text-zinc-100 font-semibold border border-[#1f1f1f]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-[#111111]/30 border border-transparent"
            }`}
          >
            <Sliders className="h-4 w-4" />
            Automation Rules
          </button>
        </nav>
      </div>

      {/* Bottom Profile Section */}
      <div className="p-4 border-t border-[#1f1f1f] bg-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="h-7 w-7 rounded-full border border-[#1f1f1f]"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center border border-[#1f1f1f]">
                <User className="h-4 w-4 text-zinc-500" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-semibold text-zinc-200 truncate leading-tight">
                {username}
              </span>
              <span className="text-[9px] text-zinc-500 truncate">
                GitHub Account
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 rounded-md hover:bg-red-950/20 text-zinc-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-900/30"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
