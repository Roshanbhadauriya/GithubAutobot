"use client";

import React from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "info",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  // Icon styles based on variant
  const iconConfig = {
    danger: { icon: ShieldAlert, color: "text-red-500 bg-red-950/20 border border-red-900/30" },
    warning: { icon: AlertTriangle, color: "text-yellow-500 bg-yellow-950/20 border border-yellow-900/30" },
    info: { icon: Info, color: "text-blue-500 bg-blue-950/20 border border-blue-900/30" },
  };

  const currentConfig = iconConfig[variant];
  const IconComponent = currentConfig.icon;

  // Confirm button styles
  const btnConfig = {
    danger: "bg-red-600 hover:bg-red-500 text-white",
    warning: "bg-yellow-600 hover:bg-yellow-500 text-white",
    info: "bg-zinc-100 hover:bg-zinc-200 text-zinc-900",
  };

  const confirmBtnClass = btnConfig[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity animate-fade-in"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-5 shadow-2xl space-y-4 select-none font-sans animate-zoom-in">
        <div className="flex gap-3.5 items-start">
          {/* Status Icon */}
          <div className={`p-2 rounded-lg flex-shrink-0 ${currentConfig.color}`}>
            <IconComponent className="h-5 w-5" />
          </div>

          {/* Texts */}
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#1f1f1f] text-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-[#161b22]/50 border border-transparent font-medium"
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className={`font-semibold ${confirmBtnClass}`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
