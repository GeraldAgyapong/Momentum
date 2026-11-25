from django.urls import path
from .views import (
    AnalyticsOverviewView,
    AnalyticsHabitsView,
    AnalyticsCategoriesView,
    AnalyticsWeeklySummaryView,
)

urlpatterns = [
    path("analytics/overview/", AnalyticsOverviewView.as_view(), name="analytics-overview"),
    path("analytics/habits/", AnalyticsHabitsView.as_view(), name="analytics-habits"),
    path("analytics/categories/", AnalyticsCategoriesView.as_view(), name="analytics-categories"),
    path("analytics/weekly-summary/", AnalyticsWeeklySummaryView.as_view(), name="analytics-weekly-summary"),
]
