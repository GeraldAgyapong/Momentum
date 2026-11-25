"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AnalyticsOverview, HabitPerformance, CategoryDistribution, WeeklySummary } from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  TrendingUp,
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Calendar,
  AlertCircle,
  PieChart,
} from "lucide-react";

export default function InsightsPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  // 1. Fetch overview metrics
  const { data: overview, isLoading: overviewLoading } = useQuery<AnalyticsOverview>({
    queryKey: ["analytics-overview", period],
    queryFn: () => apiClient(`/analytics/overview/?days=${period}`),
  });

  // 2. Fetch per-habit performance
  const { data: habitsData, isLoading: habitsLoading } = useQuery<{ habits: HabitPerformance[] }>({
    queryKey: ["analytics-habits", period],
    queryFn: () => apiClient(`/analytics/habits/?days=${period}`),
  });

  // 3. Fetch category breakdown
  const { data: catData } = useQuery<{ categories: CategoryDistribution[] }>({
    queryKey: ["analytics-categories", period],
    queryFn: () => apiClient(`/analytics/categories/?days=${period}`),
  });

  // 4. Fetch deterministic weekly summary
  const { data: weeklySummary } = useQuery<WeeklySummary>({
    queryKey: ["analytics-weekly-summary"],
    queryFn: () => apiClient("/analytics/weekly-summary/"),
  });

  const habits = habitsData?.habits || [];
  const categories = catData?.categories || [];

  return (
    <AppLayout>
      <div className="space-y-6 pt-2 pb-12">
        {/* Header & Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Analytics & Insights
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Objective, deterministic evaluation of your consistency over time.
            </p>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1 shadow-soft self-start sm:self-auto">
            {([7, 30, 90] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p
                    ? "bg-forest text-white shadow-soft"
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                Last {p} Days
              </button>
            ))}
          </div>
        </div>

        {/* Deterministic Weekly Report Callout */}
        {weeklySummary && (
          <Card className="p-6 border-forest/30 bg-sage-50/50 dark:bg-forest-950/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-forest text-sage flex items-center justify-center shrink-0 shadow-soft">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Weekly Consistency Summary
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {weeklySummary.period_label}
                  </Badge>
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  {weeklySummary.summary_text}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* High-Level Overview Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5">
            <span className="text-xs font-medium text-muted-foreground">Overall Completion Rate</span>
            <p className="font-heading text-3xl font-bold text-foreground mt-1 tabular-nums">
              {overview?.overall_completion_rate || 0}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {overview?.total_completed || 0} of {overview?.total_scheduled || 0} scheduled occurrences
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-medium text-muted-foreground">Current Streak</span>
            <div className="flex items-center gap-2 mt-1">
              <Flame className="w-5 h-5 fill-gold text-gold" />
              <p className="font-heading text-3xl font-bold text-foreground tabular-nums">
                {overview?.current_streak || 0}
              </p>
              <span className="text-xs text-muted-foreground">days</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Longest: {overview?.longest_streak || 0} days
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-medium text-muted-foreground">Best Performing Habit</span>
            <p className="font-heading text-base font-bold text-foreground truncate mt-1">
              {weeklySummary?.best_habit?.name || "None yet"}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {weeklySummary?.best_habit ? `${weeklySummary.best_habit.completion_rate}% consistent` : "Log more days"}
            </p>
          </Card>

          <Card className="p-5">
            <span className="text-xs font-medium text-muted-foreground">Habit Needing Care</span>
            <p className="font-heading text-base font-bold text-foreground truncate mt-1">
              {weeklySummary?.lowest_habit?.name || "None"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {weeklySummary?.lowest_habit ? `${weeklySummary.lowest_habit.completion_rate}% completion` : "All habits consistent"}
            </p>
          </Card>
        </div>

        {/* Trend Visualization with Recharts */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                Daily Completion Trend
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Consistency rate per day over the selected {period}-day period.
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-forest" /> Completion %
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            {overview && overview.daily_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overview.daily_trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => val.slice(5)}
                    tick={{ fontSize: 11 }}
                    stroke="#858A82"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    unit="%"
                    stroke="#858A82"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#173B32",
                      color: "#FFFFFF",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      border: "none",
                    }}
                    formatter={(val: any) => [`${val}%`, "Completion Rate"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion_rate"
                    stroke="#173B32"
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: "#C5A36B" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No completion logs available for this period.
              </div>
            )}
          </div>
        </Card>

        {/* Individual Habit Breakdown & Category Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Per-Habit Performance Table / List */}
          <Card className="p-6 lg:col-span-7 space-y-4">
            <h3 className="font-heading text-base font-semibold text-foreground">
              Habit Consistency Breakdown
            </h3>
            {habits.length > 0 ? (
              <div className="space-y-4">
                {habits.map((h) => (
                  <div key={h.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{h.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({h.completed_count}/{h.scheduled_count} days)
                        </span>
                      </div>
                      <span className="font-semibold tabular-nums text-foreground">
                        {h.completion_rate}%
                      </span>
                    </div>
                    <ProgressBar value={h.completion_rate} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No active habits found.</p>
            )}
          </Card>

          {/* Category Distribution Breakdown */}
          <Card className="p-6 lg:col-span-5 space-y-4">
            <h3 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4 text-muted-foreground" /> Category Distribution
            </h3>
            {categories.length > 0 ? (
              <div className="space-y-3 pt-1">
                {categories.map((c) => (
                  <div
                    key={c.category}
                    className="p-3 rounded-xl border border-border/80 bg-background/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {CATEGORY_LABELS[c.category] || c.category}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {c.habits_count} habit{c.habits_count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-forest dark:text-forest-300 tabular-nums">
                        {c.completion_rate}%
                      </span>
                      <p className="text-[10px] text-muted-foreground">completion rate</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No habit categories recorded yet.</p>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
