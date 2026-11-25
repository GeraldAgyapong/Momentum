"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HabitCard } from "@/components/habits/HabitCard";
import { DailyTrackingData, HabitLog } from "@/types";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(
    today.toISOString().split("T")[0]
  );

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(now.toISOString().split("T")[0]);
  };

  // Fetch tracking data for the selected day
  const { data: dayData, isLoading: dayLoading } = useQuery<DailyTrackingData>({
    queryKey: ["daily-tracking", selectedDate],
    queryFn: () => apiClient(`/tracking/daily/?date=${selectedDate}`),
  });

  // Fetch month completion logs for the heatmap dots
  const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split("T")[0];
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0];

  const { data: monthLogs } = useQuery<{ logs: HabitLog[] }>({
    queryKey: ["month-logs", startOfMonth, endOfMonth],
    queryFn: () => apiClient(`/tracking/history/?start_date=${startOfMonth}&end_date=${endOfMonth}&days=35`),
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: (habitId: string) =>
      apiClient("/tracking/toggle/", {
        method: "POST",
        body: JSON.stringify({ habit_id: habitId, date: selectedDate }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["month-logs"] });
    },
  });

  // Compute calendar grid cells
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  // Convert to Mon=0 ... Sun=6
  const startingCol = (firstDayOfWeek + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Completed log counts grouped by date
  const logsByDate: Record<string, number> = {};
  if (monthLogs?.logs) {
    monthLogs.logs.forEach((l) => {
      logsByDate[l.local_date] = (logsByDate[l.local_date] || 0) + 1;
    });
  }

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString("default", {
    month: "long",
  });

  const todayStr = today.toISOString().split("T")[0];

  return (
    <AppLayout>
      <div className="space-y-6 pt-2 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Habit Calendar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Explore your consistency patterns and inspect previous days.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={jumpToToday}>
              Today
            </Button>
            <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-soft">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-3 min-w-[120px] text-center">
                {monthName} {currentYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid (7 cols) */}
          <Card className="p-6 lg:col-span-7 space-y-4">
            <div className="grid grid-cols-7 gap-1 text-center font-heading text-xs font-semibold text-muted-foreground pb-2 border-b border-border/60">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading cells */}
              {Array.from({ length: startingCol }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 sm:h-20 rounded-xl bg-muted/20" />
              ))}

              {/* Month Day Cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(
                  dayNum
                ).padStart(2, "0")}`;
                const isSelected = selectedDate === dStr;
                const isCurrentToday = dStr === todayStr;
                const completedCount = logsByDate[dStr] || 0;

                return (
                  <div
                    key={dStr}
                    onClick={() => setSelectedDate(dStr)}
                    className={`h-14 sm:h-20 p-2 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "border-forest bg-forest-50/50 dark:bg-forest-950/40 shadow-sm ring-1 ring-forest"
                        : isCurrentToday
                        ? "border-forest/50 bg-card hover:bg-black/5 dark:hover:bg-white/5"
                        : "border-border/60 bg-card hover:border-forest/40 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold tabular-nums ${
                          isCurrentToday
                            ? "w-5 h-5 rounded-full bg-forest text-white flex items-center justify-center text-[10px]"
                            : isSelected
                            ? "text-forest dark:text-forest-300 font-bold"
                            : "text-foreground"
                        }`}
                      >
                        {dayNum}
                      </span>
                    </div>

                    {completedCount > 0 && (
                      <div className="flex items-center gap-1 mt-auto">
                        <div className="w-2 h-2 rounded-full bg-forest shrink-0" />
                        <span className="text-[10px] font-semibold text-forest dark:text-forest-400 tabular-nums hidden sm:inline">
                          {completedCount} done
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Selected Day Inspector Pane (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 space-y-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Day Inspector
                </span>
                <h2 className="font-heading text-xl font-bold text-foreground mt-1">
                  {formatDate(selectedDate, { weekday: "long", month: "long", day: "numeric" })}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dayData
                    ? `${dayData.total_completed} of ${dayData.total_scheduled} scheduled habits completed (${dayData.completion_rate}%)`
                    : "Loading..."}
                </p>
              </div>

              {dayLoading ? (
                <div className="space-y-3">
                  <div className="h-20 rounded-xl bg-card/60 animate-pulse border border-border" />
                  <div className="h-20 rounded-xl bg-card/60 animate-pulse border border-border" />
                </div>
              ) : dayData && dayData.habits.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {dayData.habits.map((item) => (
                    <HabitCard
                      key={item.habit.id}
                      habit={item.habit}
                      isCompleted={item.is_completed}
                      onToggle={async (id) => {
                        await toggleMutation.mutateAsync(id);
                      }}
                      showQuickToggle={true}
                      selectedDate={selectedDate}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  No habits were scheduled for this date.
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
