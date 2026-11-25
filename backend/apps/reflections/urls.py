from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailyReflectionViewSet

router = DefaultRouter()
router.register(r"reflections", DailyReflectionViewSet, basename="reflection")

urlpatterns = [
    path("", include(router.urls)),
]
