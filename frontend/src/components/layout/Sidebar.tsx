"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  Compass,
  CheckCircle2,
  Calendar,
  BarChart3,
  BookOpen,
  Settings,
  LogOut,
  Moon,
  Sun,
  Flame,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: Compass },
  { label: "My Habits", href: "/habits", icon: CheckCircle2 },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Reflections", href: "/reflections", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, updateProfile } = useAuth();

  const toggleTheme = async () => {
    const isDark = document.documentElement.classList.contains("dark");
    const nextTheme = isDark ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("momentum_theme", nextTheme);
    if (user) {
      try {
        await updateProfile({ theme: nextTheme });
      } catch {
        // Local preference preserved
      }
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card/60 backdrop-blur-md min-h-screen p-5 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-sage shadow-card">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-heading text-xl font-bold tracking-tight text-forest dark:text-forest-300">
            Momentum
          </span>
          <p className="text-[11px] font-medium text-muted-foreground tracking-wide">
            Build habits. Build yourself.
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5">
        <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-forest text-white shadow-soft font-semibold"
                  : "text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-sage" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Secondary Controls & User Profile Footer */}
      <div className="pt-4 border-t border-border/60 space-y-3">
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            title="Toggle Theme"
          >
            <Sun className="w-4 h-4 hidden dark:inline text-gold" />
            <Moon className="w-4 h-4 dark:hidden text-forest" />
            <span className="text-xs">Theme</span>
          </button>

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5",
              pathname === "/settings" ? "text-forest dark:text-forest-300 font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-3 rounded-xl bg-background/80 border border-border/80 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-foreground truncate">
                {user.profile?.full_name || "Account"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
