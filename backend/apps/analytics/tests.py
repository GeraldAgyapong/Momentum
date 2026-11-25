import pytest
from datetime import date, timedelta
from django.urls import reverse
from rest_framework.test import APIClient
from apps.authentication.models import User
from apps.habits.models import Habit, HabitFrequency
from apps.tracking.models import HabitLog, HabitLogStatus
from apps.analytics.services import AnalyticsService


@pytest.mark.django_db
class TestAnalytics:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="analytics@momentum.io", password="Password123!")
        self.client.force_authenticate(user=self.user)

    def test_overview_and_weekly_summary(self):
        today = date.today()
        # Create 2 habits starting 6 days ago
        h1 = Habit.objects.create(
            user=self.user,
            name="Morning Run",
            category="fitness",
            frequency=HabitFrequency.DAILY,
            start_date=today - timedelta(days=6),
        )
        h2 = Habit.objects.create(
            user=self.user,
            name="Read Book",
            category="learning",
            frequency=HabitFrequency.DAILY,
            start_date=today - timedelta(days=6),
        )

        # Complete h1 on 5 of the 7 days
        for i in range(5):
            HabitLog.objects.create(
                habit=h1,
                local_date=today - timedelta(days=i),
                status=HabitLogStatus.COMPLETED,
            )

        # Complete h2 on 2 of the 7 days
        for i in range(2):
            HabitLog.objects.create(
                habit=h2,
                local_date=today - timedelta(days=i),
                status=HabitLogStatus.COMPLETED,
            )

        # Test Overview API
        overview_url = reverse("analytics-overview")
        res = self.client.get(f"{overview_url}?days=7")
        assert res.status_code == 200
        assert res.data["total_scheduled"] == 14  # 2 habits * 7 days
        assert res.data["total_completed"] == 7   # 5 + 2
        assert res.data["overall_completion_rate"] == 50.0

        # Test Weekly Summary API
        summary_url = reverse("analytics-weekly-summary")
        summary_res = self.client.get(summary_url)
        assert summary_res.status_code == 200
        assert summary_res.data["best_habit"]["name"] == "Morning Run"
        assert summary_res.data["lowest_habit"]["name"] == "Read Book"
        assert "50.0%" in summary_res.data["summary_text"]
