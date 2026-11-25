from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Habit, HabitStatus
from .serializers import HabitSerializer


class HabitViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user habits."""

    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Strict user isolation: only return the logged-in user's habits
        qs = Habit.objects.filter(user=self.request.user).prefetch_related("schedules", "logs")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_destroy(self, instance):
        # Prefer archive over destructive deletion as stated in Section 17,
        # but allow hard deletion if specifically requested via ?hard=true
        if self.request.query_params.get("hard") == "true":
            instance.delete()
        else:
            instance.status = HabitStatus.ARCHIVED
            instance.save()

    @action(detail=True, methods=["post"])
    def pause(self, request, pk=None):
        """Pause habit tracking."""
        habit = self.get_object()
        habit.status = HabitStatus.PAUSED
        habit.save()
        return Response(self.get_serializer(habit).data)

    @action(detail=True, methods=["post"])
    def resume(self, request, pk=None):
        """Resume habit tracking."""
        habit = self.get_object()
        habit.status = HabitStatus.ACTIVE
        habit.save()
        return Response(self.get_serializer(habit).data)

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive habit."""
        habit = self.get_object()
        habit.status = HabitStatus.ARCHIVED
        habit.save()
        return Response(self.get_serializer(habit).data)
