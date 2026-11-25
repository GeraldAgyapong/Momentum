export interface UserProfile {
  id: string;
  full_name: string;
  timezone: string;
  theme: "light" | "dark";
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  created_at: string;
}

export type HabitCategoryType =
  | "health"
  | "fitness"
  | "learning"
  | "productivity"
  | "personal_development"
  | "finance"
  | "relationships"
  | "other";

export type HabitFrequencyType = "daily" | "specific_days" | "custom";
export type HabitStatusType = "active" | "paused" | "archived";

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategoryType;
  frequency: HabitFrequencyType;
  target_value?: number | string | null;
  target_unit?: string;
  start_date: string;
  end_date?: string | null;
  status: HabitStatusType;
  icon: string;
  color: string;
  scheduled_weekdays: number[];
  current_streak: number;
  longest_streak: number;
  total_completed: number;
  is_completed_today: boolean;
  today_log_id?: string | null;
  is_scheduled_today: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit: string;
  habit_name: string;
  habit_color: string;
  habit_icon: string;
  local_date: string;
  status: "completed" | "skipped";
  value?: number | string | null;
  note?: string;
  completed_at: string;
  created_at: string;
}

export interface DailyTrackingItem {
  habit: Habit;
  is_completed: boolean;
  log: HabitLog | null;
}

export interface DailyTrackingData {
  date: string;
  is_today: boolean;
  total_scheduled: number;
  total_completed: number;
  completion_rate: number;
  habits: DailyTrackingItem[];
}

export interface DailyReflection {
  id: string;
  reflection_date: string;
  mood: number; // 1 to 5
  what_went_well: string;
  challenges: string;
  additional_notes: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsOverview {
  period_days: number;
  start_date: string;
  end_date: string;
  overall_completion_rate: number;
  total_completed: number;
  total_scheduled: number;
  current_streak: number;
  longest_streak: number;
  active_habits_count: number;
  daily_trend: {
    date: string;
    day_name: string;
    scheduled: number;
    completed: number;
    completion_rate: number;
  }[];
}

export interface HabitPerformance {
  id: string;
  name: string;
  category: HabitCategoryType;
  color: string;
  icon: string;
  status: HabitStatusType;
  scheduled_count: number;
  completed_count: number;
  completion_rate: number;
  current_streak: number;
  longest_streak: number;
  total_completed_all_time: number;
}

export interface CategoryDistribution {
  category: HabitCategoryType;
  habits_count: number;
  completion_rate: number;
  completed_count: number;
  scheduled_count: number;
}

export interface WeeklySummary {
  period_label: string;
  overall_completion_rate: number;
  total_completed: number;
  total_scheduled: number;
  summary_text: string;
  best_habit: HabitPerformance | null;
  lowest_habit: HabitPerformance | null;
  current_streak: number;
}
