from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import datetime
from .models import DailyReflection
from .serializers import DailyReflectionSerializer
from apps.tracking.services import get_user_today


class DailyReflectionViewSet(viewsets.ModelViewSet):
    """CRUD viewset for daily mindful reflections."""

    serializer_class = DailyReflectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = DailyReflection.objects.filter(user=user)
        start_date = self.request.query_params.get("start_date")
        if start_date:
            qs = qs.filter(reflection_date__gte=start_date)
        end_date = self.request.query_params.get("end_date")
        if end_date:
            qs = qs.filter(reflection_date__lte=end_date)
        return qs

    @action(detail=False, methods=["get"], url_path="by-date")
    def by_date(self, request):
        """Retrieve reflection for a specific date, or return null if none exists."""
        user = request.user
        date_str = request.query_params.get("date")
        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            target_date = get_user_today(user)

        reflection = DailyReflection.objects.filter(user=user, reflection_date=target_date).first()
        if not reflection:
            return Response({"reflection": None, "date": target_date.isoformat()})

        serializer = self.get_serializer(reflection)
        return Response({"reflection": serializer.data, "date": target_date.isoformat()})
