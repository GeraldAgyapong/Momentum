from datetime import date, timedelta
from typing import Dict, Any, List
import zoneinfo
from django.utils import timezone
from apps.habits.models import Habit, HabitFrequency, HabitStatus
from apps.tracking.models import HabitLog, HabitLogStatus


def get_user_today(user) -> date:
    """Get the current date in the user's configured timezone."""
    tz_name = "UTC"
    if hasattr(user, "profile") and user.profile.timezone:
        tz_name = user.profile.timezone

    try:
        user_tz = zoneinfo.ZoneInfo(tz_name)
    except Exception:
        user_tz = zoneinfo.ZoneInfo("UTC")

    return timezone.now().astimezone(user_tz).date()


class StreakService:
    """Calculates streaks and consistency metrics based on scheduled habit occurrences."""

    @staticmethod
    def get_habit_streak_data(habit: Habit, reference_date: date = None) -> Dict[str, int]:
        """
        Calculate current streak, longest streak, and total completions for a single habit.
        Streaks are counted by scheduled occurrences, not calendar days.
        """
        if reference_date is None:
            reference_date = get_user_today(habit.user)

        start_date = habit.start_date
        if start_date > reference_date:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_completed": 0,
            }

        # Pre-fetch all completed dates for this habit
        completed_dates = set(
            HabitLog.objects.filter(
                habit=habit,
                status=HabitLogStatus.COMPLETED,
            ).values_list("local_date", flat=True)
        )

        # Get all scheduled weekdays for this habit
        scheduled_weekdays = set()
        if habit.frequency in (HabitFrequency.SPECIFIC_DAYS, HabitFrequency.CUSTOM):
            scheduled_weekdays = set(habit.schedules.values_list("weekday", flat=True))

        def is_scheduled(d: date) -> bool:
            if habit.frequency == HabitFrequency.DAILY:
                return True
            return d.weekday() in scheduled_weekdays

        # 1. Total completed occurrences
        total_completed = len(completed_dates)

        # 2. Collect scheduled dates chronologically from start_date up to reference_date
        scheduled_dates: List[date] = []
        curr = start_date
        while curr <= reference_date:
            if is_scheduled(curr):
                scheduled_dates.append(curr)
            curr += timedelta(days=1)

        if not scheduled_dates:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "total_completed": total_completed,
            }

        # 3. Calculate longest streak
        longest_streak = 0
        running_streak = 0
        for d in scheduled_dates:
            if d in completed_dates:
                running_streak += 1
                if running_streak > longest_streak:
                    longest_streak = running_streak
            else:
                # If today is scheduled and not completed, do not reset running_streak yet for max,
                # but for past dates it breaks the streak.
                if d != reference_date:
                    running_streak = 0

        # 4. Calculate current streak
        # Walk backwards through scheduled dates
        current_streak = 0
        has_today = scheduled_dates[-1] == reference_date

        if has_today:
            if reference_date in completed_dates:
                current_streak += 1
                # Walk back before today
                for d in reversed(scheduled_dates[:-1]):
                    if d in completed_dates:
                        current_streak += 1
                    else:
                        break
            else:
                # Today is scheduled but not completed yet.
                # Per requirements: Do not declare today's habit missed before day ends.
                # Streak is determined by the streak leading up to yesterday.
                for d in reversed(scheduled_dates[:-1]):
                    if d in completed_dates:
                        current_streak += 1
                    else:
                        break
        else:
            # Today was not scheduled. Walk back from the most recent scheduled date.
            for d in reversed(scheduled_dates):
                if d in completed_dates:
                    current_streak += 1
                else:
                    break

        return {
            "current_streak": current_streak,
            "longest_streak": max(longest_streak, current_streak),
            "total_completed": total_completed,
        }

    @staticmethod
    def get_overall_streak_data(user, reference_date: date = None) -> Dict[str, Any]:
        """
        Calculate overall streak for the user across all active habits.
        A day is successful if user completes 100% of their scheduled active habits on that day.
        """
        if reference_date is None:
            reference_date = get_user_today(user)

        active_habits = list(
            Habit.objects.filter(
                user=user,
                status=HabitStatus.ACTIVE,
            ).prefetch_related("schedules")
        )

        if not active_habits:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "active_habits_count": 0,
            }

        # Check the last 180 days for overall consistency
        start_check = reference_date - timedelta(days=180)
        user_completed_logs = set(
            HabitLog.objects.filter(
                habit__in=active_habits,
                status=HabitLogStatus.COMPLETED,
                local_date__gte=start_check,
                local_date__lte=reference_date,
            ).values_list("habit_id", "local_date")
        )

        day_results = {}  # date -> bool (was day fully completed?)
        curr = start_check
        while curr <= reference_date:
            scheduled_for_curr = [h for h in active_habits if h.is_scheduled_on(curr)]
            if scheduled_for_curr:
                all_done = all((h.id, curr) in user_completed_logs for h in scheduled_for_curr)
                day_results[curr] = all_done
            curr += timedelta(days=1)

        # Scheduled active days sorted chronologically
        scheduled_active_days = sorted(day_results.keys())

        if not scheduled_active_days:
            return {
                "current_streak": 0,
                "longest_streak": 0,
                "active_habits_count": len(active_habits),
            }

        # Longest overall streak
        longest_streak = 0
        curr_streak = 0
        for d in scheduled_active_days:
            if day_results[d]:
                curr_streak += 1
                if curr_streak > longest_streak:
                    longest_streak = curr_streak
            else:
                if d != reference_date:
                    curr_streak = 0

        # Current overall streak
        current_streak = 0
        if scheduled_active_days[-1] == reference_date:
            if day_results[reference_date]:
                current_streak += 1
                for d in reversed(scheduled_active_days[:-1]):
                    if day_results[d]:
                        current_streak += 1
                    else:
                        break
            else:
                # Today not yet complete, preserve streak from yesterday if yesterday was complete
                for d in reversed(scheduled_active_days[:-1]):
                    if day_results[d]:
                        current_streak += 1
                    else:
                        break
        else:
            for d in reversed(scheduled_active_days):
                if day_results[d]:
                    current_streak += 1
                else:
                    break

        return {
            "current_streak": current_streak,
            "longest_streak": max(longest_streak, current_streak),
            "active_habits_count": len(active_habits),
        }
