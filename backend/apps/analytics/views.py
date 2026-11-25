from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .services import AnalyticsService


class AnalyticsOverviewView(APIView):
    """Returns top-level analytics metrics and daily trend line data."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        days_param = request.query_params.get("days", "30")
        try:
            days = int(days_param)
        except ValueError:
            days = 30

        data = AnalyticsService.get_overview_metrics(request.user, days=days)
        return Response(data)


class AnalyticsHabitsView(APIView):
    """Returns per-habit performance, completion rates, and streaks."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        days_param = request.query_params.get("days", "30")
        try:
            days = int(days_param)
        except ValueError:
            days = 30

        data = AnalyticsService.get_habit_performance(request.user, days=days)
        return Response({"habits": data})


class AnalyticsCategoriesView(APIView):
    """Returns category distribution and completion rates."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        days_param = request.query_params.get("days", "30")
        try:
            days = int(days_param)
        except ValueError:
            days = 30

        data = AnalyticsService.get_category_distribution(request.user, days=days)
        return Response({"categories": data})


class AnalyticsWeeklySummaryView(APIView):
    """Returns deterministic weekly summary calculated from genuine database records."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        data = AnalyticsService.get_weekly_summary(request.user)
        return Response(data)
