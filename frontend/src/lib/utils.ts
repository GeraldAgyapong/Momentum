import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  return d.toLocaleDateString("en-US", options || {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export const CATEGORY_LABELS: Record<string, string> = {
  health: "Health",
  fitness: "Fitness",
  learning: "Learning",
  productivity: "Productivity",
  personal_development: "Personal Growth",
  finance: "Finance",
  relationships: "Relationships",
  other: "Other",
};

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  health: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-800 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  fitness: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-800 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  learning: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  productivity: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-800 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  personal_development: { bg: "bg-sage-100 dark:bg-sage-900/40", text: "text-forest-800 dark:text-sage-200", border: "border-sage-300 dark:border-sage-800" },
  finance: { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-800 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  relationships: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-800 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800" },
  other: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-300", border: "border-gray-200 dark:border-gray-700" },
};
