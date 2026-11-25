from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DailyTrackingView,
    HabitLogViewSet,
    ToggleCompletionView,
    HistoryTrackingView,
)

router = DefaultRouter()
router.register(r"logs", HabitLogViewSet, basename="habit-log")

urlpatterns = [
    path("tracking/daily/", DailyTrackingView.as_view(), name="tracking-daily"),
    path("tracking/toggle/", ToggleCompletionView.as_view(), name="tracking-toggle"),
    path("tracking/history/", HistoryTrackingView.as_view(), name="tracking-history"),
    path("tracking/", include(router.urls)),
]
