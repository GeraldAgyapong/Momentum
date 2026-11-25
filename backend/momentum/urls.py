from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # OpenAPI Schema & Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # API v1 routes
    path("api/v1/", include("apps.authentication.urls")),
    path("api/v1/", include("apps.habits.urls")),
    path("api/v1/", include("apps.tracking.urls")),
    path("api/v1/", include("apps.reflections.urls")),
    path("api/v1/", include("apps.analytics.urls")),
]
