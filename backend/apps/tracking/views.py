from datetime import datetime, date, timedelta
from rest_framework import generics, viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.habits.models import Habit, HabitStatus
from apps.habits.serializers import HabitSerializer
from .models import HabitLog, HabitLogStatus
from .serializers import HabitLogSerializer
from .services import StreakService, get_user_today


class DailyTrackingView(APIView):
    """
    Returns habits scheduled for a specific date (defaults to today in user's timezone)
    along with daily completion progress indicators.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        user_today = get_user_today(user)

        date_str = request.query_params.get("date")
        if date_str:
            try:
                selected_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            selected_date = user_today

        # Active habits only for tracking (paused/archived excluded from today's list as per Section 7)
        habits = Habit.objects.filter(
            user=user,
            status=HabitStatus.ACTIVE,
        ).prefetch_related("schedules")

        scheduled_habits = [h for h in habits if h.is_scheduled_on(selected_date)]

        # Fetch completion logs for these habits on this date
        logs = {
            log.habit_id: log
            for log in HabitLog.objects.filter(
                habit__in=scheduled_habits,
                local_date=selected_date,
            )
        }

        items = []
        total_completed = 0
        for h in scheduled_habits:
            log = logs.get(h.id)
            is_comp = (log is not None and log.status == HabitLogStatus.COMPLETED)
            if is_comp:
                total_completed += 1

            habit_data = HabitSerializer(h, context={"request": request}).data
            items.append({
                "habit": habit_data,
                "is_completed": is_comp,
                "log": HabitLogSerializer(log).data if log else None,
            })

        total_scheduled = len(scheduled_habits)
        rate = round((total_completed / total_scheduled * 100), 1) if total_scheduled > 0 else 0

        return Response({
            "date": selected_date.isoformat(),
            "is_today": selected_date == user_today,
            "total_scheduled": total_scheduled,
            "total_completed": total_completed,
            "completion_rate": rate,
            "habits": items,
        })


class HabitLogViewSet(viewsets.ModelViewSet):
    """CRUD operations for habit completion logs."""

    serializer_class = HabitLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = HabitLog.objects.filter(habit__user=user).select_related("habit")
        habit_id = self.request.query_params.get("habit_id")
        if habit_id:
            qs = qs.filter(habit_id=habit_id)
        start_date = self.request.query_params.get("start_date")
        if start_date:
            qs = qs.filter(local_date__gte=start_date)
        end_date = self.request.query_params.get("end_date")
        if end_date:
            qs = qs.filter(local_date__lte=end_date)
        return qs

    def perform_create(self, serializer):
        habit = serializer.validated_data["habit"]
        if habit.user != self.request.user:
            raise permissions.exceptions.PermissionDenied("You do not own this habit.")
        local_date = serializer.validated_data["local_date"]
        # Update or create to guarantee one record per habit & local_date
        with transaction.atomic():
            log, _ = HabitLog.objects.update_or_create(
                habit=habit,
                local_date=local_date,
                defaults={
                    "status": serializer.validated_data.get("status", HabitLogStatus.COMPLETED),
                    "value": serializer.validated_data.get("value"),
                    "note": serializer.validated_data.get("note", ""),
                },
            )
            serializer.instance = log


class ToggleCompletionView(APIView):
    """
    Convenient one-tap endpoint to mark completed or undo completion immediately.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        habit_id = request.data.get("habit_id")
        if not habit_id:
            return Response({"detail": "habit_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        habit = get_object_or_404(Habit, id=habit_id, user=user)

        date_str = request.data.get("date")
        if date_str:
            try:
                local_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            local_date = get_user_today(user)

        value = request.data.get("value")
        note = request.data.get("note", "")

        with transaction.atomic():
            existing = HabitLog.objects.filter(habit=habit, local_date=local_date).first()
            if existing:
                # Undo completion
                existing.delete()
                is_completed = False
                log_data = None
                action = "undone"
            else:
                # Mark completed
                log = HabitLog.objects.create(
                    habit=habit,
                    local_date=local_date,
                    status=HabitLogStatus.COMPLETED,
                    value=value if value is not None else habit.target_value,
                    note=note,
                )
                is_completed = True
                log_data = HabitLogSerializer(log).data
                action = "completed"

        # Calculate updated streak info for immediate frontend reactive updates
        streak_data = StreakService.get_habit_streak_data(habit, reference_date=local_date)

        return Response({
            "action": action,
            "is_completed": is_completed,
            "log": log_data,
            "streak_data": streak_data,
            "message": "Habit completed!" if is_completed else "Completion undone.",
        })


class HistoryTrackingView(APIView):
    """
    Returns completion logs for historical calendar heatmaps and activity feeds.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        today = get_user_today(user)

        days_param = request.query_params.get("days", "90")
        try:
            days = int(days_param)
        except ValueError:
            days = 90

        start_date = today - timedelta(days=days)
        habit_id = request.query_params.get("habit_id")

        qs = HabitLog.objects.filter(
            habit__user=user,
            status=HabitLogStatus.COMPLETED,
            local_date__gte=start_date,
            local_date__lte=today,
        ).select_related("habit").order_by("-local_date")

        if habit_id:
            qs = qs.filter(habit_id=habit_id)

        serializer = HabitLogSerializer(qs, many=True)
        return Response({
            "start_date": start_date.isoformat(),
            "end_date": today.isoformat(),
            "logs": serializer.data,
        })
