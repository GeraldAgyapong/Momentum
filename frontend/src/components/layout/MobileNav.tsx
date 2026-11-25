"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, CheckCircle2, Calendar, BarChart3, BookOpen, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: Compass },
  { label: "Habits", href: "/habits", icon: CheckCircle2 },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Insights", href: "/insights", icon: BarChart3 },
  { label: "Reflect", href: "/reflections", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-t border-border px-3 py-2 flex items-center justify-around safe-area-bottom">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center p-1 rounded-lg text-[10px] font-medium transition-colors",
              isActive ? "text-forest dark:text-forest-400 font-semibold" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-5 h-5 mb-0.5", isActive && "stroke-[2.5px]")} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
