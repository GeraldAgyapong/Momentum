import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.authentication.models import User
from apps.habits.models import Habit, HabitStatus, HabitFrequency


@pytest.mark.django_db
class TestHabits:
    def setup_method(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(email="u1@momentum.io", password="Password123!")
        self.user2 = User.objects.create_user(email="u2@momentum.io", password="Password123!")
        self.client.force_authenticate(user=self.user1)

    def test_create_habit_with_weekdays(self):
        url = reverse("habit-list")
        payload = {
            "name": "Read 20 pages",
            "description": "Daily non-fiction reading",
            "category": "learning",
            "frequency": "specific_days",
            "target_value": 20,
            "target_unit": "pages",
            "start_date": str(date.today()),
            "weekdays": [0, 2, 4],  # Mon, Wed, Fri
            "color": "#173B32",
            "icon": "book-open",
        }
        res = self.client.post(url, payload, format="json")
        assert res.status_code == 201
        assert res.data["name"] == "Read 20 pages"
        assert sorted(res.data["scheduled_weekdays"]) == [0, 2, 4]

        habit = Habit.objects.get(id=res.data["id"])
        assert habit.user == self.user1
        assert habit.schedules.count() == 3

    def test_habit_user_isolation(self):
        # User 1 creates a habit
        h1 = Habit.objects.create(
            user=self.user1,
            name="User 1 Habit",
            category="health",
            frequency=HabitFrequency.DAILY,
            start_date=date.today(),
        )

        # User 2 logs in and tries to retrieve User 1's habit
        client2 = APIClient()
        client2.force_authenticate(user=self.user2)

        res = client2.get(reverse("habit-detail", kwargs={"pk": h1.id}))
        assert res.status_code == 404

        # List should also be empty for User 2
        list_res = client2.get(reverse("habit-list"))
        assert list_res.status_code == 200
        assert len(list_res.data["results"]) == 0

    def test_pause_and_resume_habit(self):
        h = Habit.objects.create(
            user=self.user1,
            name="Meditation",
            category="personal_development",
            frequency=HabitFrequency.DAILY,
            start_date=date.today(),
        )
        pause_url = reverse("habit-pause", kwargs={"pk": h.id})
        res = self.client.post(pause_url)
        assert res.status_code == 200
        assert res.data["status"] == "paused"

        resume_url = reverse("habit-resume", kwargs={"pk": h.id})
        res2 = self.client.post(resume_url)
        assert res2.status_code == 200
        assert res2.data["status"] == "active"
