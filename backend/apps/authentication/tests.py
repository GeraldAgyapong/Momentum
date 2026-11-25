import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.authentication.models import User, UserProfile


@pytest.mark.django_db
class TestAuthentication:
    def setup_method(self):
        self.client = APIClient()

    def test_user_registration_success(self):
        url = reverse("auth-register")
        payload = {
            "email": "test@momentum.io",
            "password": "StrongPassword123!",
            "full_name": "Test User",
            "timezone": "America/New_York",
        }
        response = self.client.post(url, payload, format="json")
        assert response.status_code == 201
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == "test@momentum.io"
        assert response.data["user"]["profile"]["full_name"] == "Test User"
        assert response.data["user"]["profile"]["timezone"] == "America/New_York"

        # Verify DB
        user = User.objects.get(email="test@momentum.io")
        assert user.check_password("StrongPassword123!")
        assert user.profile.full_name == "Test User"

    def test_user_login_success(self):
        user = User.objects.create_user(email="login@momentum.io", password="LoginPassword123!")
        url = reverse("auth-login")
        payload = {"email": "login@momentum.io", "password": "LoginPassword123!"}
        response = self.client.post(url, payload, format="json")
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_user_login_invalid_password(self):
        User.objects.create_user(email="login@momentum.io", password="LoginPassword123!")
        url = reverse("auth-login")
        payload = {"email": "login@momentum.io", "password": "WrongPassword!"}
        response = self.client.post(url, payload, format="json")
        assert response.status_code == 400

    def test_profile_update(self):
        user = User.objects.create_user(email="profile@momentum.io", password="Password123!")
        self.client.force_authenticate(user=user)
        url = reverse("profile-detail")

        # GET profile
        get_res = self.client.get(url)
        assert get_res.status_code == 200

        # PATCH profile
        patch_res = self.client.patch(
            url,
            {"full_name": "Updated Name", "onboarding_completed": True, "theme": "dark"},
            format="json",
        )
        assert patch_res.status_code == 200
        assert patch_res.data["full_name"] == "Updated Name"
        assert patch_res.data["onboarding_completed"] is True
        assert patch_res.data["theme"] == "dark"
