import pytest
from datetime import date
from django.urls import reverse
from rest_framework.test import APIClient
from apps.authentication.models import User
from apps.reflections.models import DailyReflection


@pytest.mark.django_db
class TestReflections:
    def setup_method(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email="reflector@momentum.io", password="Password123!")
        self.client.force_authenticate(user=self.user)

    def test_create_and_update_daily_reflection(self):
        url = reverse("reflection-list")
        payload = {
            "reflection_date": str(date.today()),
            "mood": 4,
            "what_went_well": "Stayed focused throughout the morning.",
            "challenges": "Distracted after lunch.",
            "additional_notes": "Getting 8 hours of sleep helped.",
        }

        # Create
        res1 = self.client.post(url, payload, format="json")
        assert res1.status_code == 201
        assert res1.data["mood"] == 4
        assert DailyReflection.objects.filter(user=self.user).count() == 1

        # Post again for the same date -> updates the existing reflection cleanly
        payload["mood"] = 5
        payload["what_went_well"] = "Finished all tasks and stayed calm."
        res2 = self.client.post(url, payload, format="json")
        assert res2.status_code == 201
        assert res2.data["mood"] == 5
        assert DailyReflection.objects.filter(user=self.user).count() == 1
        assert DailyReflection.objects.get(user=self.user).mood == 5

    def test_retrieve_by_date(self):
        DailyReflection.objects.create(
            user=self.user,
            reflection_date=date.today(),
            mood=4,
            what_went_well="Good morning walk",
        )
        url = f"{reverse('reflection-by-date')}?date={date.today()}"
        res = self.client.get(url)
        assert res.status_code == 200
        assert res.data["reflection"] is not None
        assert res.data["reflection"]["mood"] == 4
