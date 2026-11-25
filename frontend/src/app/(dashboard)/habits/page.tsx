"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HabitCard } from "@/components/habits/HabitCard";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { Habit, HabitStatusType } from "@/types";
import { Plus, Filter, CheckCircle2, Pause, Archive } from "lucide-react";

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<HabitStatusType | "all">("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // Fetch habits
  const { data: habitsData, isLoading } = useQuery<{ results: Habit[]; count: number }>({
    queryKey: ["habits", statusFilter],
    queryFn: () => {
      const param = statusFilter === "all" ? "" : `?status=${statusFilter}`;
      return apiClient(`/habits/${param}`);
    },
  });

  // Create or Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (editingHabit) {
        return apiClient(`/habits/${editingHabit.id}/`, {
          method: "PATCH",
          body: JSON.stringify(data),
        });
      }
      return apiClient("/habits/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
      setEditingHabit(null);
    },
  });

  // Pause mutation
  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/habits/${id}/pause/`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
    },
  });

  // Resume mutation
  const resumeMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/habits/${id}/resume/`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/habits/${id}/archive/`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      queryClient.invalidateQueries({ queryKey: ["daily-tracking"] });
    },
  });

  const habits = habitsData?.results || [];

  return (
    <AppLayout>
      <div className="space-y-6 pt-2 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              My Habits
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Curate, adapt, and organize your routines for long-term consistency.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setEditingHabit(null);
              setIsModalOpen(true);
            }}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Create Habit
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {(
            [
              { key: "active", label: "Active Habits", icon: CheckCircle2 },
              { key: "paused", label: "Paused", icon: Pause },
              { key: "archived", label: "Archived", icon: Archive },
              { key: "all", label: "All Habits", icon: null },
            ] as const
          ).map(({ key, label, icon: IconComp }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                statusFilter === key
                  ? "bg-forest text-white shadow-soft"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {IconComp && <IconComp className="w-3.5 h-3.5" />}
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Habits Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-card/60 animate-pulse border border-border/60" />
            ))}
          </div>
        ) : habits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                isCompleted={habit.is_completed_today}
                onEdit={(h) => {
                  setEditingHabit(h);
                  setIsModalOpen(true);
                }}
                onPause={async (id) => {
                  await pauseMutation.mutateAsync(id);
                }}
                onResume={async (id) => {
                  await resumeMutation.mutateAsync(id);
                }}
                onArchive={async (id) => {
                  await archiveMutation.mutateAsync(id);
                }}
                showQuickToggle={false}
              />
            ))}
          </div>
        ) : (
          <Card className="p-10 text-center border-dashed border-border/80">
            <div className="w-12 h-12 rounded-2xl bg-sage-100 dark:bg-forest-950/40 text-forest dark:text-sage-200 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-foreground text-base">
              No {statusFilter !== "all" ? statusFilter : ""} habits found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {statusFilter === "active"
                ? "Start by creating your first daily or weekly habit."
                : `You currently have no ${statusFilter} habits.`}
            </p>
            {statusFilter === "active" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingHabit(null);
                  setIsModalOpen(true);
                }}
                className="mt-4 gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create a Habit
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Habit Create / Edit Modal */}
      <HabitFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        initialData={editingHabit}
        onSubmit={async (data) => {
          await saveMutation.mutateAsync(data);
        }}
        isLoading={saveMutation.isPending}
      />
    </AppLayout>
  );
}
