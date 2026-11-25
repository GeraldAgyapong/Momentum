"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Check, Compass, Sparkles, BookOpen, Heart, Activity, Brain, ArrowRight } from "lucide-react";

interface StarterHabit {
  name: string;
  category: "learning" | "health" | "fitness" | "personal_development" | "productivity" | "finance";
  frequency: "daily" | "specific_days";
  target_value?: number;
  target_unit?: string;
  icon: string;
  color: string;
  weekdays?: number[];
  description: string;
}

const STARTER_HABITS: StarterHabit[] = [
  {
    name: "Morning Reflection & Mindfulness",
    category: "personal_development",
    frequency: "daily",
    target_value: 10,
    target_unit: "mins",
    icon: "brain",
    color: "#173B32",
    description: "Centering thought and quiet awareness before diving into the day.",
  },
  {
    name: "Read Non-Fiction or Books",
    category: "learning",
    frequency: "daily",
    target_value: 15,
    target_unit: "pages",
    icon: "book-open",
    color: "#C5A36B",
    description: "Consistent learning to expand understanding day by day.",
  },
  {
    name: "Hydrate with 2 Litres of Water",
    category: "health",
    frequency: "daily",
    target_value: 2000,
    target_unit: "ml",
    icon: "droplet",
    color: "#2D7E6C",
    description: "Replenishing body and mind for sustained clarity and energy.",
  },
  {
    name: "Physical Movement or Exercise",
    category: "fitness",
    frequency: "specific_days",
    weekdays: [0, 2, 4], // Mon, Wed, Fri
    target_value: 30,
    target_unit: "mins",
    icon: "activity",
    color: "#216456",
    description: "Strength, endurance, and physical vitality three days a week.",
  },
  {
    name: "Review Daily Priorities",
    category: "productivity",
    frequency: "daily",
    icon: "check-circle",
    color: "#173B32",
    description: "Defining the top 3 impactful tasks to accomplish today.",
  },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState(user?.profile?.full_name || "");
  const [timezone, setTimezone] = useState(
    user?.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  const [selectedHabitIndices, setSelectedHabitIndices] = useState<number[]>([0, 1]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelectHabit = (idx: number) => {
    if (selectedHabitIndices.includes(idx)) {
      setSelectedHabitIndices(selectedHabitIndices.filter((i) => i !== idx));
    } else {
      setSelectedHabitIndices([...selectedHabitIndices, idx]);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Update profile with name and timezone
      await updateProfile({
        full_name: fullName,
        timezone: timezone,
        onboarding_completed: true,
      });

      // 2. Create the selected starter habits
      const today = new Date().toISOString().split("T")[0];
      for (const idx of selectedHabitIndices) {
        const h = STARTER_HABITS[idx];
        await apiClient("/habits/", {
          method: "POST",
          body: JSON.stringify({
            name: h.name,
            description: h.description,
            category: h.category,
            frequency: h.frequency,
            target_value: h.target_value || null,
            target_unit: h.target_unit || "",
            start_date: today,
            icon: h.icon,
            color: h.color,
            weekdays: h.weekdays || [],
          }),
        });
      }

      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      // Still proceed to dashboard if error occurred
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-forest text-white shadow-soft">
            <Compass className="w-6 h-6" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Welcome to Momentum
          </h1>
          <p className="text-sm text-muted-foreground">
            Let&apos;s personalize your space for consistent, mindful growth.
          </p>
        </div>

        <Card className="border-border/80 shadow-soft">
          {step === 1 ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Step 1 of 2</Badge>
                  <span className="text-xs text-muted-foreground">Profile & Timezone</span>
                </div>
                <CardTitle className="text-lg mt-2">What should we call you?</CardTitle>
                <CardDescription>
                  Your timezone ensures your habits, streaks, and reflections are tracked accurately to your local calendar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Your full name"
                  id="fullName"
                  placeholder="e.g. Maya Angelou"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <Select
                  label="Preferred Timezone"
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </Select>

                <div className="flex justify-end pt-4">
                  <Button variant="primary" onClick={() => setStep(2)}>
                    Continue <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Step 2 of 2</Badge>
                  <span className="text-xs text-muted-foreground">Select Starter Habits</span>
                </div>
                <CardTitle className="text-lg mt-2">Choose habits to cultivate</CardTitle>
                <CardDescription>
                  Select one or more habits you would like to develop. You can modify or add more anytime.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {STARTER_HABITS.map((habit, idx) => {
                  const isSelected = selectedHabitIndices.includes(idx);
                  return (
                    <div
                      key={habit.name}
                      onClick={() => toggleSelectHabit(idx)}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-forest bg-sage/20 dark:bg-forest-950/40 shadow-sm"
                          : "border-border hover:border-border/80 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                          isSelected
                            ? "bg-forest border-forest text-white"
                            : "border-border bg-card"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-foreground truncate">{habit.name}</h4>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-border/40 text-muted-foreground capitalize">
                            {habit.frequency === "daily" ? "Daily" : "3 days / wk"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{habit.description}</p>
                      </div>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleFinish} disabled={isSubmitting}>
                      Skip for now
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleFinish} isLoading={isSubmitting}>
                      Finish Setup & Go to Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
