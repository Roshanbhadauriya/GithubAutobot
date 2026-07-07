import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
        // Variants
        variant === "default" &&
          "border-transparent bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
        variant === "secondary" &&
          "border-transparent bg-zinc-800 text-zinc-300 hover:bg-zinc-700",
        variant === "destructive" &&
          "border-transparent bg-red-900/30 text-red-400 border border-red-900/50",
        variant === "success" &&
          "border-transparent bg-green-900/30 text-green-400 border border-green-900/50",
        variant === "warning" &&
          "border-transparent bg-yellow-900/30 text-yellow-400 border border-yellow-900/50",
        variant === "info" &&
          "border-transparent bg-blue-900/30 text-blue-400 border border-blue-900/50",
        variant === "outline" && "text-zinc-300 border-zinc-700",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
