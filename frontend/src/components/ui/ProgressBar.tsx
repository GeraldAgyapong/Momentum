import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, barClassName, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-medium text-muted-foreground tabular-nums">
          <span>Progress</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-border/60 dark:bg-muted">
        <div
          className={cn(
            "h-full rounded-full bg-forest dark:bg-forest-400 transition-all duration-500 ease-out",
            barClassName
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
