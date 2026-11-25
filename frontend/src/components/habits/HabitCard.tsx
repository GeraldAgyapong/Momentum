"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Habit, HabitLog } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/utils";
import {
  Check,
  Flame,
  MoreVertical,
  Pause,
  Play,
  Archive,
  Edit2,
  Activity,
  BookOpen,
  Heart,
  Droplet,
  Dumbbell,
  Brain,
  Zap,
  CheckCircle2,
  Smile,
  Compass,
} from "lucide-react";

interface HabitCardProps {
  habit: Habit;
  isCompleted?: boolean;
  onToggle?: (habitId: string) => Promise<void>;
  onEdit?: (habit: Habit) => void;
  onPause?: (habitId: string) => Promise<void>;
  onResume?: (habitId: string) => Promise<void>;
  onArchive?: (habitId: string) => Promise<void>;
  showQuickToggle?: boolean;
  selectedDate?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  "check-circle": CheckCircle2,
  "book-open": BookOpen,
  activity: Activity,
  heart: Heart,
  droplet: Droplet,
  dumbbell: Dumbbell,
  brain: Brain,
  zap: Zap,
  smile: Smile,
  compass: Compass,
};

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HabitCard({
  habit,
  isCompleted: initialCompleted = false,
  onToggle,
  onEdit,
  onPause,
  onResume,
  onArchive,
  showQuickToggle = true,
}: HabitCardProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted);
  const [isToggling, setIsToggling] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Sync state if initialCompleted changes from parent query
  React.useEffect(() => {
    setIsCompleted(initialCompleted);
  }, [initialCompleted]);

  const IconComp = ICON_MAP[habit.icon] || CheckCircle2;
  const catColor = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.other;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggle || isToggling) return;
    setIsToggling(true);
    // Optimistic toggle
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    try {
      await onToggle(habit.id);
    } catch {
      // Revert if error
      setIsCompleted(!nextState);
    } finally {
      setIsToggling(false);
    }
  };

  const scheduleText =
    habit.frequency === "daily"
      ? "Daily"
      : habit.scheduled_weekdays && habit.scheduled_weekdays.length > 0
      ? habit.scheduled_weekdays.map((d) => WEEKDAY_NAMES[d]).join(", ")
      : "Custom schedule";

  return (
    <Card className="relative overflow-hidden group transition-all duration-200 hover:border-forest/40">
      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        {/* Quick Completion Button */}
        {showQuickToggle && habit.status === "active" && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200 mt-0.5 ${
              isCompleted
                ? "bg-forest border-forest text-white shadow-soft scale-105"
                : "bg-background border-border hover:border-forest/50 hover:bg-sage/20 text-muted-foreground"
            }`}
            title={isCompleted ? "Mark incomplete (undo)" : "Mark completed"}
          >
            {isCompleted ? (
              <Check className="w-5 h-5 stroke-[2.5px] animate-in zoom-in-75" />
            ) : (
              <IconComp className="w-5 h-5" style={{ color: habit.color }} />
            )}
          </button>
        )}

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/habits/${habit.id}`}
              className="font-heading font-semibold text-sm sm:text-base text-foreground hover:text-forest dark:hover:text-forest-300 transition-colors truncate"
            >
              {habit.name}
            </Link>

            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}
            >
              {CATEGORY_LABELS[habit.category] || habit.category}
            </span>

            {habit.status !== "active" && (
              <Badge variant="outline" className="text-[10px] capitalize">
                {habit.status}
              </Badge>
            )}
          </div>

          {habit.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{habit.description}</p>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            {/* Target indicator */}
            {habit.target_value && (
              <span className="font-medium text-foreground">
                Target: {habit.target_value} {habit.target_unit}
              </span>
            )}

            {/* Schedule */}
            <span>{scheduleText}</span>

            {/* Streak flame indicator */}
            <div className="flex items-center gap-1 text-gold font-semibold tabular-nums ml-auto sm:ml-0">
              <Flame className="w-3.5 h-3.5 fill-gold text-gold" />
              <span>{habit.current_streak} streak</span>
            </div>
          </div>
        </div>

        {/* Action Menu button */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-6 z-30 w-36 rounded-xl border border-border bg-card p-1 shadow-elevated text-xs">
                <Link
                  href={`/habits/${habit.id}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-foreground"
                  onClick={() => setShowMenu(false)}
                >
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  View Details
                </Link>
                {onEdit && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-foreground text-left"
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(habit);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    Edit
                  </button>
                )}
                {habit.status === "active" && onPause && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-foreground text-left"
                    onClick={() => {
                      setShowMenu(false);
                      onPause(habit.id);
                    }}
                  >
                    <Pause className="w-3.5 h-3.5 text-muted-foreground" />
                    Pause
                  </button>
                )}
                {habit.status === "paused" && onResume && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-foreground text-left"
                    onClick={() => {
                      setShowMenu(false);
                      onResume(habit.id);
                    }}
                  >
                    <Play className="w-3.5 h-3.5 text-muted-foreground" />
                    Resume
                  </button>
                )}
                {habit.status !== "archived" && onArchive && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 text-left"
                    onClick={() => {
                      setShowMenu(false);
                      onArchive(habit.id);
                    }}
                  >
                    <Archive className="w-3.5 h-3.5 text-rose-500" />
                    Archive
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
