import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "gold" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-forest-100 text-forest-800 dark:bg-forest-900/40 dark:text-forest-300 border-forest-200 dark:border-forest-800",
    secondary: "bg-sage-100 text-forest dark:bg-sage-900/30 dark:text-sage-200 border-sage-300 dark:border-sage-800",
    success: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    gold: "bg-gold-50 text-gold-900 dark:bg-gold-950/30 dark:text-gold-300 border-gold-200 dark:border-gold-800",
    outline: "bg-transparent text-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
