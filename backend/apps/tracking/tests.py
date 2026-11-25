import pytest
from datetime import date, timedelta
from django.urls import reverse
from rest_framework.test import APIClient
from apps.authentication.models import User
from apps.habits.models import Habit, HabitFrequency, HabitSchedule
from apps.tracking.models import HabitLog, HabitLogStatus
from apps.tracking.services import StreakService


@pytest.mark.django_db
class TestTrackingAndStreaks:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="tracker@momentum.io", password="Password123!")
        self.client.force_authenticate(user=self.user)

    def test_toggle_completion_and_undo(self):
        habit = Habit.objects.create(
            user=self.user,
            name="Hydration",
            category="health",
            frequency=HabitFrequency.DAILY,
            start_date=date.today() - timedelta(days=5),
        )

        url = reverse("tracking-toggle")
        today_str = str(date.today())

        # 1. Mark completed
        res1 = self.client.post(url, {"habit_id": str(habit.id), "date": today_str}, format="json")
        assert res1.status_code == 200
        assert res1.data["is_completed"] is True
        assert res1.data["action"] == "completed"
        assert HabitLog.objects.filter(habit=habit, local_date=date.today()).exists()

        # 2. Toggle again -> Undo completion
        res2 = self.client.post(url, {"habit_id": str(habit.id), "date": today_str}, format="json")
        assert res2.status_code == 200
        assert res2.data["is_completed"] is False
        assert res2.data["action"] == "undone"
        assert not HabitLog.objects.filter(habit=habit, local_date=date.today()).exists()

    def test_streak_calculation_scheduled_days(self):
        """
        Verify streak respects scheduled days:
        Habit scheduled only Mon, Wed, Fri.
        Completed Mon, Wed, Fri.
        Current streak should be 3, despite Tue & Thu not having completions.
        """
        ref_date = date(2026, 11, 20)  # Friday
        # Mon Nov 16, Wed Nov 18, Fri Nov 20
        habit = Habit.objects.create(
            user=self.user,
            name="Gym Workout",
            category="fitness",
            frequency=HabitFrequency.SPECIFIC_DAYS,
            start_date=date(2026, 11, 16),
        )
        HabitSchedule.objects.create(habit=habit, weekday=0)  # Monday
        HabitSchedule.objects.create(habit=habit, weekday=2)  # Wednesday
        HabitSchedule.objects.create(habit=habit, weekday=4)  # Friday

        # Log Monday, Wednesday, Friday
        HabitLog.objects.create(habit=habit, local_date=date(2026, 11, 16), status=HabitLogStatus.COMPLETED)
        HabitLog.objects.create(habit=habit, local_date=date(2026, 11, 18), status=HabitLogStatus.COMPLETED)
        HabitLog.objects.create(habit=habit, local_date=date(2026, 11, 20), status=HabitLogStatus.COMPLETED)

        streak = StreakService.get_habit_streak_data(habit, reference_date=ref_date)
        assert streak["current_streak"] == 3
        assert streak["longest_streak"] == 3
        assert streak["total_completed"] == 3

    def test_streak_today_incomplete_does_not_break_streak(self):
        """
        Verify that if today is a scheduled day but not yet completed,
        the active streak from previous days remains intact.
        """
        today = date.today()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)

        habit = Habit.objects.create(
            user=self.user,
            name="Daily Journal",
            category="personal_development",
            frequency=HabitFrequency.DAILY,
            start_date=two_days_ago,
        )

        # Completed 2 days ago and yesterday, today is NOT yet completed
        HabitLog.objects.create(habit=habit, local_date=two_days_ago, status=HabitLogStatus.COMPLETED)
        HabitLog.objects.create(habit=habit, local_date=yesterday, status=HabitLogStatus.COMPLETED)

        streak = StreakService.get_habit_streak_data(habit, reference_date=today)
        # Should still be 2 (awaiting today's completion)
        assert streak["current_streak"] == 2

        # Now complete today
        HabitLog.objects.create(habit=habit, local_date=today, status=HabitLogStatus.COMPLETED)
        streak_after = StreakService.get_habit_streak_data(habit, reference_date=today)
        assert streak_after["current_streak"] == 3
