"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { Habit, HabitLog } from "@/types";
import { formatDate, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/utils";
import {
  Flame,
  CheckCircle2,
  Calendar,
  ArrowLeft,
  Edit2,
  Pause,
  Play,
  Archive,
  Award,
  Clock,
  Sparkles,
} from "lucide-react";

export default function HabitDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 1. Fetch Habit details
  const { data: habit, isLoading: habitLoading } = useQuery<Habit>({
    queryKey: ["habit", id],
    queryFn: () => apiClient(`/habits/${id}/`),
  });

  // 2. Fetch Habit history logs
  const { data: historyData, isLoading: historyLoading } = useQuery<{ logs: HabitLog[] }>({
    queryKey: ["habit-history", id],
    queryFn: () => apiClient(`/tracking/history/?habit_id=${id}&days=90`),
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient(`/habits/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habit", id] });
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
    },
  });

  // Status mutations
  const pauseMutation = useMutation({
    mutationFn: () => apiClient(`/habits/${id}/pause/`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habit", id] }),
  });

  const resumeMutation = useMutation({
    mutationFn: () => apiClient(`/habits/${id}/resume/`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["habit", id] }),
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiClient(`/habits/${id}/archive/`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      router.push("/habits");
    },
  });

  if (habitLoading) {
    return (
      <AppLayout>
        <div className="space-y-6 pt-4 animate-pulse">
          <div className="h-8 w-48 bg-card rounded-lg" />
          <div className="h-40 bg-card rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!habit) {
    return (
      <AppLayout>
        <div className="text-center py-16 space-y-3">
          <h2 className="text-xl font-bold">Habit not found</h2>
          <Button variant="outline" onClick={() => router.push("/habits")}>
            Back to Habits
          </Button>
        </div>
      </AppLayout>
    );
  }

  const logs = historyData?.logs || [];
  const catColor = CATEGORY_COLORS[habit.category] || CATEGORY_COLORS.other;

  // Compute 90-day completion calendar matrix
  const today = new Date();
  const pastDays: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    pastDays.push(d.toISOString().split("T")[0]);
  }
  const completedDateSet = new Set(logs.map((l) => l.local_date));

  return (
    <AppLayout>
      <div className="space-y-6 pt-2 pb-12">
        {/* Back navigation & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push("/habits")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors self-start"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Habits
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit Habit
            </Button>

            {habit.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => pauseMutation.mutate()}
                isLoading={pauseMutation.isPending}
                className="gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </Button>
            ) : habit.status === "paused" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => resumeMutation.mutate()}
                isLoading={resumeMutation.isPending}
                className="gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> Resume
              </Button>
            ) : null}

            {habit.status !== "archived" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => archiveMutation.mutate()}
                isLoading={archiveMutation.isPending}
                className="gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Archive className="w-3.5 h-3.5" /> Archive
              </Button>
            )}
          </div>
        </div>

        {/* Hero Habit Details Card */}
        <Card className="p-6 space-y-4 border-forest/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-soft shrink-0"
                style={{ backgroundColor: habit.color || "#173B32" }}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading text-2xl font-bold text-foreground">{habit.name}</h1>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${catColor.bg} ${catColor.text} ${catColor.border}`}
                  >
                    {CATEGORY_LABELS[habit.category] || habit.category}
                  </span>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {habit.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Started {formatDate(habit.start_date)} •{" "}
                  {habit.frequency === "daily" ? "Every day" : "Scheduled weekdays"}
                </p>
              </div>
            </div>
          </div>

          {habit.description && (
            <p className="text-sm text-foreground/80 leading-relaxed max-w-2xl pt-1">
              {habit.description}
            </p>
          )}

          {habit.target_value && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span>
                Target: {habit.target_value} {habit.target_unit}
              </span>
            </div>
          )}
        </Card>

        {/* Consistency & Streak Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold-50 dark:bg-gold-950/40 text-gold-700 dark:text-gold-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Current Streak</span>
              <p className="font-heading text-2xl font-bold text-foreground tabular-nums">
                {habit.current_streak} <span className="text-xs font-normal text-muted-foreground">days</span>
              </p>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-forest-50 dark:bg-forest-950/40 text-forest dark:text-forest-400 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Longest Streak</span>
              <p className="font-heading text-2xl font-bold text-foreground tabular-nums">
                {habit.longest_streak} <span className="text-xs font-normal text-muted-foreground">days</span>
              </p>
            </div>
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sage-100 dark:bg-sage-950/40 text-forest-800 dark:text-sage-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">All-Time Completions</span>
              <p className="font-heading text-2xl font-bold text-foreground tabular-nums">
                {habit.total_completed} <span className="text-xs font-normal text-muted-foreground">times</span>
              </p>
            </div>
          </Card>
        </div>

        {/* 90-Day Completion Heatmap Calendar */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                90-Day Consistency Heatmap
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reflecting genuine scheduled completions over the past 3 months.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm bg-border/40" />
              <span>Incomplete / Rest</span>
              <div className="w-3 h-3 rounded-sm bg-forest" />
              <span>Completed</span>
            </div>
          </div>

          {/* Grid representation */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {pastDays.map((dStr) => {
              const isComp = completedDateSet.has(dStr);
              return (
                <div
                  key={dStr}
                  title={`${dStr}: ${isComp ? "Completed" : "Not logged"}`}
                  className={`w-4 h-4 rounded-sm transition-all duration-150 cursor-pointer ${
                    isComp
                      ? "bg-forest hover:scale-125"
                      : "bg-border/60 hover:bg-border dark:bg-muted"
                  }`}
                />
              );
            })}
          </div>
        </Card>

        {/* Recent Completion Logs */}
        <Card className="p-6 space-y-4">
          <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Completion Records
          </h3>
          {logs.length > 0 ? (
            <div className="divide-y divide-border/60">
              {logs.slice(0, 10).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest dark:text-forest-400" />
                    <span className="font-medium text-foreground">{formatDate(log.local_date)}</span>
                    {log.value && (
                      <span className="text-muted-foreground">({log.value} {habit.target_unit})</span>
                    )}
                    {log.note && <span className="text-muted-foreground italic">- &quot;{log.note}&quot;</span>}
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(log.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No completions recorded in the past 90 days.</p>
          )}
        </Card>
      </div>

      {/* Edit Modal */}
      <HabitFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={habit}
        onSubmit={async (data) => {
          await editMutation.mutateAsync(data);
        }}
        isLoading={editMutation.isPending}
      />
    </AppLayout>
  );
}
