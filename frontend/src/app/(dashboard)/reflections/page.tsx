"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DailyReflection } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Heart,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MOODS = [
  { score: 1, label: "Rough", icon: Frown, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200" },
  { score: 2, label: "Difficult", icon: Meh, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200" },
  { score: 3, label: "Neutral", icon: Smile, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200" },
  { score: 4, label: "Good", icon: Sparkles, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200" },
  { score: 5, label: "Thriving", icon: Heart, color: "text-gold bg-gold-50 dark:bg-gold-950/40 border-gold-200" },
];

export default function ReflectionsPage() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [mood, setMood] = useState<number>(4);
  const [whatWentWell, setWhatWentWell] = useState("");
  const [challenges, setChallenges] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // 1. Fetch reflection for the selected date
  const { data: dateReflectionData, isLoading } = useQuery<{ reflection: DailyReflection | null; date: string }>({
    queryKey: ["reflection-by-date", selectedDate],
    queryFn: () => apiClient(`/reflections/by-date/?date=${selectedDate}`),
  });

  // 2. Fetch historical reflections
  const { data: historyData } = useQuery<{ results: DailyReflection[] }>({
    queryKey: ["reflections-history"],
    queryFn: () => apiClient("/reflections/?days=30"),
  });

  // Sync form inputs when date data loads
  useEffect(() => {
    if (dateReflectionData?.reflection) {
      const r = dateReflectionData.reflection;
      setMood(r.mood);
      setWhatWentWell(r.what_went_well || "");
      setChallenges(r.challenges || "");
      setAdditionalNotes(r.additional_notes || "");
    } else {
      setMood(4);
      setWhatWentWell("");
      setChallenges("");
      setAdditionalNotes("");
    }
    setIsSaved(false);
  }, [dateReflectionData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      apiClient("/reflections/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reflection-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["reflections-history"] });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    },
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync({
      reflection_date: selectedDate,
      mood,
      what_went_well: whatWentWell.trim(),
      challenges: challenges.trim(),
      additional_notes: additionalNotes.trim(),
    });
  };

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

  const history = historyData?.results || [];

  return (
    <AppLayout>
      <div className="space-y-6 pt-2 pb-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Daily Reflections
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              A private, calm space to notice what works, learn from friction, and ground your habits.
            </p>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-card border border-border rounded-xl p-1 shadow-soft">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedDate === todayStr ? "bg-forest text-white" : "text-foreground"
              }`}
            >
              Today
            </button>
            <span className="text-xs font-semibold px-2 text-foreground tabular-nums">
              {formatDate(selectedDate)}
            </span>
            <button
              onClick={handleNextDay}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reflection Editor Card */}
        <Card className="p-6 space-y-6 border-forest/30 bg-card">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Mood Scale (1-5) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                How would you score your mood and mindset today?
              </label>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {MOODS.map(({ score, label, icon: IconComp, color }) => {
                  const isSelected = mood === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setMood(score)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? `border-forest ring-2 ring-forest ${color} shadow-sm`
                          : "border-border/80 bg-background/50 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
                      }`}
                    >
                      <IconComp className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-semibold">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* What Went Well */}
            <Textarea
              label="What went well today? What brought you a sense of accomplishment?"
              id="whatWentWell"
              placeholder="e.g. Completed my morning reading without checking my phone. Felt energized after exercise."
              value={whatWentWell}
              onChange={(e) => setWhatWentWell(e.target.value)}
              rows={3}
            />

            {/* Challenges / Friction */}
            <Textarea
              label="What challenged you today? What caused friction or distraction?"
              id="challenges"
              placeholder="e.g. Afternoon fatigue made it tempting to skip my routine. Tomorrow I'll prepare a lighter lunch."
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              rows={3}
            />

            {/* Additional Notes */}
            <Textarea
              label="Additional notes or insights (Optional)"
              id="additionalNotes"
              placeholder="Any other thoughts, gratitudes, or reminders for tomorrow..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-xs text-muted-foreground">
                {dateReflectionData?.reflection ? "Editing stored reflection" : "New entry for this date"}
              </span>

              <div className="flex items-center gap-2">
                {isSaved && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" /> Saved securely
                  </span>
                )}
                <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
                  Save Reflection
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Historical Reflections Log */}
        <div className="space-y-4 pt-4">
          <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-forest" />
            Previous Reflections
          </h2>

          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((r) => {
                const moodObj = MOODS.find((m) => m.score === r.mood) || MOODS[2];
                const MoodIcon = moodObj.icon;
                return (
                  <Card
                    key={r.id}
                    onClick={() => setSelectedDate(r.reflection_date)}
                    className="p-4 cursor-pointer hover:border-forest/40 transition-colors"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {formatDate(r.reflection_date, { weekday: "short", month: "short", day: "numeric" })}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${moodObj.color}`}>
                          <MoodIcon className="w-3 h-3" />
                          {moodObj.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">Click to inspect / edit</span>
                    </div>

                    <div className="space-y-1.5 pt-2 text-xs">
                      {r.what_went_well && (
                        <p className="text-foreground">
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">Well: </span>
                          {r.what_went_well}
                        </p>
                      )}
                      {r.challenges && (
                        <p className="text-muted-foreground">
                          <span className="font-medium text-amber-700 dark:text-amber-400">Friction: </span>
                          {r.challenges}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center text-xs text-muted-foreground">
              Your historical reflections will be catalogued here over time.
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
