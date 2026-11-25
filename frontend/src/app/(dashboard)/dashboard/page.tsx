"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { DailyTrackingData, AnalyticsOverview, HabitLog, Habit } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Flame,
  CheckCircle2,
  Calendar as CalendarIcon,
  BookOpen,
  BarChart3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Selected date defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  // 1. Fetch daily tracking data for selected date
  const { data: dailyData, isLoading: dailyLoading } = useQuery<DailyTrackingData>({
    queryKey: ["daily-tracking", selectedDate],
    queryFn: () => apiClient(`/tracking/daily/?date=${selectedDate}`),
  });

  // 2. Fetch overall overview analytics
  const { data: overviewData } = useQuery<AnalyticsOverview>({
    queryKey: ["analytics-overview", 7],
    queryFn: () => apiClient("/analytics/overview/?days=7"),
  });

  // 3. Fetch recent completion activity
  const { data: recentLogsData } = useQuery<{ logs: HabitLog[] }>({
    queryKey: ["tracking-recent-logs"],
    queryFn: () => apiClient("/tracking/history/?days=7"),
  });

  // Toggle habit mutation
  const toggleMutation = useMutation({
    mutationFn: (habitId: string) =>
      apiClient("/tracking/toggle/", {
        method: "POST",
        body: JSON.stringify({ habit_id: habitId, date: selectedDate }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      queryClient.invalidateQueries({ queryKey: ["tracking-recent-logs"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  // Create habit mutation
  const createHabitMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/habits/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
    },
  });

  // Date navigation helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.profile?.full_name?.split(" ")[0] || "Friend";

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  return (
    <AppLayout>
      <div className="space-y-6 pt-2 pb-10">
        {/* SECTION A: Welcome Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {greeting}, {firstName}
              </h1>
              <Sparkles className="w-5 h-5 text-gold animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Every day is a fresh opportunity to invest in your sustainable growth.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHabitModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4 text-forest dark:text-forest-300" />
              <span>New Habit</span>
            </Button>
            <Link href="/reflections">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span>Reflect</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* SECTION D & B: Metrics Grid (Progress + Streaks + Weekly) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Daily Completion Progress */}
          <Card className="p-5 flex flex-col justify-between border-forest/20 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isToday ? "Today's Routine" : "Selected Day"}
              </span>
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-forest-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-bold text-foreground tabular-nums">
                  {dailyData ? dailyData.total_completed : 0}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  / {dailyData ? dailyData.total_scheduled : 0} completed
                </span>
              </div>
              <ProgressBar
                value={dailyData ? dailyData.completion_rate : 0}
                className="mt-3"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {dailyData && dailyData.total_scheduled > 0
                ? `${dailyData.completion_rate}% achieved for this day`
                : "No habits scheduled"}
            </p>
          </Card>

          {/* Current Overall Streak */}
          <Card className="p-5 flex flex-col justify-between border-gold/20 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Streak
              </span>
              <Flame className="w-4 h-4 fill-gold text-gold" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-bold text-foreground tabular-nums">
                  {overviewData ? overviewData.current_streak : 0}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  scheduled days
                </span>
              </div>
              <p className="text-xs text-forest dark:text-forest-400 font-medium mt-1">
                Protected by non-punitive rest days
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Longest streak: {overviewData ? overviewData.longest_streak : 0} days
            </p>
          </Card>

          {/* Weekly Consistency */}
          <Card className="p-5 flex flex-col justify-between bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                7-Day Consistency
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-bold text-foreground tabular-nums">
                  {overviewData ? overviewData.overall_completion_rate : 0}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overviewData ? overviewData.total_completed : 0} total completions
              </p>
            </div>
            <Link
              href="/insights"
              className="text-[11px] font-semibold text-forest dark:text-forest-300 hover:underline flex items-center gap-1"
            >
              View detailed trends →
            </Link>
          </Card>

          {/* Active Habits */}
          <Card className="p-5 flex flex-col justify-between bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Habits
              </span>
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="my-3">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-3xl font-bold text-foreground tabular-nums">
                  {overviewData ? overviewData.active_habits_count : 0}
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  habits active
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Designed for your personal pace
              </p>
            </div>
            <Link
              href="/habits"
              className="text-[11px] font-semibold text-forest dark:text-forest-300 hover:underline flex items-center gap-1"
            >
              Manage all habits →
            </Link>
          </Card>
        </div>

        {/* SECTION C: Today's Scheduled Habits & Date Selector */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                {isToday ? "Today's Schedule" : `Schedule for ${formatDate(selectedDate)}`}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                One-tap to mark complete. Unscheduled days never count as failures.
              </p>
            </div>

            {/* Date Nav Controls */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-card border border-border rounded-xl p-1 shadow-soft">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleToday}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isToday
                    ? "bg-forest text-white"
                    : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                Today
              </button>

              <span className="text-xs font-semibold px-2 text-foreground tabular-nums">
                {formatDate(selectedDate, { month: "short", day: "numeric" })}
              </span>

              <button
                type="button"
                onClick={handleNextDay}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Habits for the Day */}
          {dailyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-card/60 animate-pulse border border-border/60" />
              ))}
            </div>
          ) : dailyData && dailyData.habits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {dailyData.habits.map((item) => (
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
            <Card className="p-8 text-center border-dashed border-border/80">
              <div className="w-12 h-12 rounded-2xl bg-sage-100 dark:bg-forest-950/40 text-forest dark:text-sage-200 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-foreground text-base">
                No habits scheduled for this day
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Enjoy your restorative day, or create a habit tailored to your goals.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsHabitModalOpen(true)}
                className="mt-4 gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create a Habit
              </Button>
            </Card>
          )}
        </div>

        {/* SECTION E: Recent Activity Feed */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-foreground">
              Recent Activity
            </h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Past 7 days
            </span>
          </div>

          {recentLogsData && recentLogsData.logs.length > 0 ? (
            <Card className="divide-y divide-border/60 overflow-hidden">
              {recentLogsData.logs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: log.habit_color || "#173B32" }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{log.habit_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Completed on {formatDate(log.local_date)}
                        {log.value && ` • ${log.value}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {new Date(log.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </Card>
          ) : (
            <Card className="p-6 text-center text-xs text-muted-foreground">
              Completions will appear here as you log habits.
            </Card>
          )}
        </div>
      </div>

      {/* Habit Creation Modal */}
      <HabitFormModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        onSubmit={async (data) => {
          await createHabitMutation.mutateAsync(data);
        }}
        isLoading={createHabitMutation.isPending}
      />
    </AppLayout>
  );
}
