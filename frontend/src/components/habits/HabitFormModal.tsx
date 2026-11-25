"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Habit, HabitCategoryType, HabitFrequencyType } from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";
import {
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

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: Habit | null;
  isLoading?: boolean;
}

const ICONS = [
  { name: "check-circle", icon: CheckCircle2 },
  { name: "book-open", icon: BookOpen },
  { name: "activity", icon: Activity },
  { name: "heart", icon: Heart },
  { name: "droplet", icon: Droplet },
  { name: "dumbbell", icon: Dumbbell },
  { name: "brain", icon: Brain },
  { name: "zap", icon: Zap },
  { name: "smile", icon: Smile },
  { name: "compass", icon: Compass },
];

const COLORS = [
  "#173B32", // Forest
  "#216456", // Forest medium
  "#2D7E6C", // Forest light
  "#C5A36B", // Muted Gold
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#252824", // Charcoal
];

const WEEKDAYS = [
  { day: 0, label: "Mon" },
  { day: 1, label: "Tue" },
  { day: 2, label: "Wed" },
  { day: 3, label: "Thu" },
  { day: 4, label: "Fri" },
  { day: 5, label: "Sat" },
  { day: 6, label: "Sun" },
];

export function HabitFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: HabitFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HabitCategoryType>("personal_development");
  const [frequency, setFrequency] = useState<HabitFrequencyType>("daily");
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [targetValue, setTargetValue] = useState<string>("");
  const [targetUnit, setTargetUnit] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>("");
  const [icon, setIcon] = useState<string>("check-circle");
  const [color, setColor] = useState<string>("#173B32");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || "");
      setCategory(initialData.category);
      setFrequency(initialData.frequency);
      setWeekdays(initialData.scheduled_weekdays || []);
      setTargetValue(initialData.target_value ? String(initialData.target_value) : "");
      setTargetUnit(initialData.target_unit || "");
      setStartDate(initialData.start_date || new Date().toISOString().split("T")[0]);
      setEndDate(initialData.end_date || "");
      setIcon(initialData.icon || "check-circle");
      setColor(initialData.color || "#173B32");
    } else {
      setName("");
      setDescription("");
      setCategory("personal_development");
      setFrequency("daily");
      setWeekdays([0, 1, 2, 3, 4]);
      setTargetValue("");
      setTargetUnit("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setIcon("check-circle");
      setColor("#173B32");
    }
    setError(null);
  }, [initialData, isOpen]);

  const toggleWeekday = (day: number) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter((d) => d !== day));
    } else {
      setWeekdays([...weekdays, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Habit name is required.");
      return;
    }

    if (frequency !== "daily" && weekdays.length === 0) {
      setError("Please select at least one day for this habit schedule.");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        category,
        frequency,
        weekdays: frequency === "daily" ? [] : weekdays,
        target_value: targetValue ? parseFloat(targetValue) : null,
        target_unit: targetUnit.trim(),
        start_date: startDate,
        end_date: endDate || null,
        icon,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save habit. Please check inputs.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Habit" : "Create New Habit"}
      description="Design a habit that is realistic, meaningful, and sustainable."
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        <Input
          label="Habit Name *"
          id="habitName"
          placeholder="e.g. Read 20 pages, Morning Jog, Meditate"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Textarea
          label="Description (Optional)"
          id="habitDesc"
          placeholder="Why does this habit matter to you? What is your routine?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Category"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as HabitCategoryType)}
          >
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>

          <Select
            label="Frequency"
            id="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as HabitFrequencyType)}
          >
            <option value="daily">Every day</option>
            <option value="specific_days">Specific days of the week</option>
            <option value="custom">Custom weekly schedule</option>
          </Select>
        </div>

        {/* Weekday Selection if specific days */}
        {frequency !== "daily" && (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">Scheduled Weekdays *</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {WEEKDAYS.map(({ day, label }) => {
                const isSelected = weekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    className={`h-9 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? "bg-forest text-white border-forest shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Measurable Target (Optional) */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Target Value (Optional)"
            id="targetValue"
            type="number"
            step="any"
            placeholder="e.g. 20"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
          />
          <Input
            label="Target Unit (Optional)"
            id="targetUnit"
            placeholder="e.g. pages, mins, ml, reps"
            value={targetUnit}
            onChange={(e) => setTargetUnit(e.target.value)}
          />
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Date"
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date (Optional)"
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Icon & Color Selection */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">Accent Color</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-offset-2 ring-forest" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-foreground">Icon</label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {ICONS.map(({ name: iconName, icon: IconComp }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                    icon === iconName
                      ? "bg-forest text-white border-forest"
                      : "bg-background text-muted-foreground border-border hover:bg-black/5"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData ? "Save Changes" : "Create Habit"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
