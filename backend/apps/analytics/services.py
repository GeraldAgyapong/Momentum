from datetime import date, timedelta
from typing import Dict, Any, List, Optional
from apps.habits.models import Habit, HabitStatus, HabitCategory
from apps.tracking.models import HabitLog, HabitLogStatus
from apps.tracking.services import StreakService, get_user_today


class AnalyticsService:
    """Computes deterministic habit analytics, completion rates, and weekly summaries."""

    @classmethod
    def get_overview_metrics(cls, user, days: int = 30) -> Dict[str, Any]:
        """Calculates aggregated performance metrics over a specified lookback window."""
        today = get_user_today(user)
        start_date = today - timedelta(days=days - 1)

        habits = list(
            Habit.objects.filter(user=user)
            .exclude(status=HabitStatus.ARCHIVED)
            .prefetch_related("schedules")
        )

        completed_logs = set(
            HabitLog.objects.filter(
                habit__user=user,
                status=HabitLogStatus.COMPLETED,
                local_date__gte=start_date,
                local_date__lte=today,
            ).values_list("habit_id", "local_date")
        )

        total_scheduled = 0
        total_completed = 0
        daily_trend = []

        curr = start_date
        while curr <= today:
            scheduled_count = 0
            day_completed_count = 0

            for h in habits:
                if h.is_scheduled_on(curr):
                    scheduled_count += 1
                    if (h.id, curr) in completed_logs:
                        day_completed_count += 1

            total_scheduled += scheduled_count
            total_completed += day_completed_count

            rate = round((day_completed_count / scheduled_count * 100), 1) if scheduled_count > 0 else 0
            daily_trend.append({
                "date": curr.isoformat(),
                "day_name": curr.strftime("%a"),
                "scheduled": scheduled_count,
                "completed": day_completed_count,
                "completion_rate": rate,
            })
            curr += timedelta(days=1)

        overall_rate = round((total_completed / total_scheduled * 100), 1) if total_scheduled > 0 else 0
        overall_streak = StreakService.get_overall_streak_data(user, reference_date=today)

        return {
            "period_days": days,
            "start_date": start_date.isoformat(),
            "end_date": today.isoformat(),
            "overall_completion_rate": overall_rate,
            "total_completed": total_completed,
            "total_scheduled": total_scheduled,
            "current_streak": overall_streak["current_streak"],
            "longest_streak": overall_streak["longest_streak"],
            "active_habits_count": len([h for h in habits if h.status == HabitStatus.ACTIVE]),
            "daily_trend": daily_trend,
        }

    @classmethod
    def get_habit_performance(cls, user, days: int = 30) -> List[Dict[str, Any]]:
        """Calculates performance breakdown for each individual habit."""
        today = get_user_today(user)
        start_date = today - timedelta(days=days - 1)

        habits = list(
            Habit.objects.filter(user=user)
            .exclude(status=HabitStatus.ARCHIVED)
            .prefetch_related("schedules")
        )

        habit_results = []
        for habit in habits:
            # Scheduled occurrences in the period
            scheduled_count = 0
            curr = max(habit.start_date, start_date)
            while curr <= today:
                if habit.is_scheduled_on(curr):
                    scheduled_count += 1
                curr += timedelta(days=1)

            completed_count = HabitLog.objects.filter(
                habit=habit,
                status=HabitLogStatus.COMPLETED,
                local_date__gte=start_date,
                local_date__lte=today,
            ).count()

            rate = round((completed_count / scheduled_count * 100), 1) if scheduled_count > 0 else 0
            streak_data = StreakService.get_habit_streak_data(habit, reference_date=today)

            habit_results.append({
                "id": str(habit.id),
                "name": habit.name,
                "category": habit.category,
                "color": habit.color,
                "icon": habit.icon,
                "status": habit.status,
                "scheduled_count": scheduled_count,
                "completed_count": completed_count,
                "completion_rate": rate,
                "current_streak": streak_data["current_streak"],
                "longest_streak": streak_data["longest_streak"],
                "total_completed_all_time": streak_data["total_completed"],
            })

        return habit_results

    @classmethod
    def get_category_distribution(cls, user, days: int = 30) -> List[Dict[str, Any]]:
        """Computes habit distribution and completion rate grouped by category."""
        habit_performances = cls.get_habit_performance(user, days=days)
        categories = {}

        for item in habit_performances:
            cat = item["category"]
            if cat not in categories:
                categories[cat] = {
                    "category": cat,
                    "habits_count": 0,
                    "scheduled_count": 0,
                    "completed_count": 0,
                }
            categories[cat]["habits_count"] += 1
            categories[cat]["scheduled_count"] += item["scheduled_count"]
            categories[cat]["completed_count"] += item["completed_count"]

        results = []
        for cat, data in categories.items():
            sched = data["scheduled_count"]
            comp = data["completed_count"]
            rate = round((comp / sched * 100), 1) if sched > 0 else 0
            results.append({
                "category": cat,
                "habits_count": data["habits_count"],
                "completion_rate": rate,
                "completed_count": comp,
                "scheduled_count": sched,
            })

        return sorted(results, key=lambda x: x["habits_count"], reverse=True)

    @classmethod
    def get_weekly_summary(cls, user) -> Dict[str, Any]:
        """
        Generates a deterministic weekly report from genuine database records.
        Covers the last 7 completed days.
        """
        today = get_user_today(user)
        start_date = today - timedelta(days=6)

        overview = cls.get_overview_metrics(user, days=7)
        habit_stats = cls.get_habit_performance(user, days=7)

        # Filter habits with at least 1 scheduled day this week
        active_week_habits = [h for h in habit_stats if h["scheduled_count"] > 0]
        active_week_habits_sorted = sorted(active_week_habits, key=lambda x: x["completion_rate"], reverse=True)

        best_habit = active_week_habits_sorted[0] if active_week_habits_sorted else None
        lowest_habit = active_week_habits_sorted[-1] if len(active_week_habits_sorted) > 1 else None

        # Build natural language deterministic summary
        rate = overview["overall_completion_rate"]
        total_comp = overview["total_completed"]
        total_sched = overview["total_scheduled"]

        if total_sched == 0:
            summary_text = "You don't have any habits scheduled for this past week. Create a habit to begin tracking your consistency."
        else:
            summary_text = f"You completed {rate}% of your scheduled habits this week ({total_comp} of {total_sched} occurrences)."
            if best_habit and best_habit["completion_rate"] > 0:
                summary_text += f" '{best_habit['name']}' was your most consistent habit ({best_habit['completion_rate']}%)."
            if lowest_habit and lowest_habit["id"] != (best_habit["id"] if best_habit else None) and lowest_habit["completion_rate"] < (best_habit["completion_rate"] if best_habit else 100):
                summary_text += f" '{lowest_habit['name']}' had the lowest completion rate ({lowest_habit['completion_rate']}%)."

        return {
            "period_label": f"{start_date.strftime('%b %d')} - {today.strftime('%b %d, %Y')}",
            "overall_completion_rate": rate,
            "total_completed": total_comp,
            "total_scheduled": total_sched,
            "summary_text": summary_text,
            "best_habit": best_habit,
            "lowest_habit": lowest_habit,
            "current_streak": overview["current_streak"],
        }
