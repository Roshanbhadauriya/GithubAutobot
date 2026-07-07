"use client";

import React from "react";

interface TopLoaderProps {
  loading: boolean;
}

/**
 * A minimal, GitHub/YouTube-style top-of-page loading bar.
 * Shows a thin animated gradient bar fixed at the top of the viewport.
 */
export default function TopLoader({ loading }: TopLoaderProps) {
  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none">
      <div className="h-full w-full bg-gradient-to-r from-transparent via-green-500 to-transparent animate-top-loader" />
    </div>
  );
}
