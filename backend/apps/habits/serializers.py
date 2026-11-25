from rest_framework import serializers
from .models import Habit, HabitSchedule, HabitCategory, HabitFrequency, HabitStatus
from apps.tracking.models import HabitLog, HabitLogStatus
from apps.tracking.services import StreakService, get_user_today


class HabitScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitSchedule
        fields = ["id", "weekday"]


class HabitSerializer(serializers.ModelSerializer):
    weekdays = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        required=False,
        write_only=True,
    )
    scheduled_weekdays = serializers.SerializerMethodField(read_only=True)
    current_streak = serializers.SerializerMethodField(read_only=True)
    longest_streak = serializers.SerializerMethodField(read_only=True)
    total_completed = serializers.SerializerMethodField(read_only=True)
    is_completed_today = serializers.SerializerMethodField(read_only=True)
    today_log_id = serializers.SerializerMethodField(read_only=True)
    is_scheduled_today = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Habit
        fields = [
            "id",
            "name",
            "description",
            "category",
            "frequency",
            "target_value",
            "target_unit",
            "start_date",
            "end_date",
            "status",
            "icon",
            "color",
            "weekdays",
            "scheduled_weekdays",
            "current_streak",
            "longest_streak",
            "total_completed",
            "is_completed_today",
            "today_log_id",
            "is_scheduled_today",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "scheduled_weekdays",
            "current_streak",
            "longest_streak",
            "total_completed",
            "is_completed_today",
            "today_log_id",
            "is_scheduled_today",
        ]

    def get_scheduled_weekdays(self, obj):
        return list(obj.schedules.values_list("weekday", flat=True))

    def _get_streaks(self, obj):
        # Cache streak calculation per instance serialization
        if not hasattr(obj, "_cached_streaks"):
            user = self.context.get("request").user if self.context.get("request") else obj.user
            today = get_user_today(user)
            obj._cached_streaks = StreakService.get_habit_streak_data(obj, reference_date=today)
        return obj._cached_streaks

    def get_current_streak(self, obj):
        return self._get_streaks(obj)["current_streak"]

    def get_longest_streak(self, obj):
        return self._get_streaks(obj)["longest_streak"]

    def get_total_completed(self, obj):
        return self._get_streaks(obj)["total_completed"]

    def _get_today_log(self, obj):
        if not hasattr(obj, "_cached_today_log"):
            user = self.context.get("request").user if self.context.get("request") else obj.user
            today = get_user_today(user)
            obj._cached_today_log = HabitLog.objects.filter(
                habit=obj,
                local_date=today,
                status=HabitLogStatus.COMPLETED,
            ).first()
        return obj._cached_today_log

    def get_is_completed_today(self, obj):
        return self._get_today_log(obj) is not None

    def get_today_log_id(self, obj):
        log = self._get_today_log(obj)
        return str(log.id) if log else None

    def get_is_scheduled_today(self, obj):
        user = self.context.get("request").user if self.context.get("request") else obj.user
        today = get_user_today(user)
        return obj.is_scheduled_on(today)

    def create(self, validated_data):
        weekdays = validated_data.pop("weekdays", None)
        user = self.context["request"].user
        habit = Habit.objects.create(user=user, **validated_data)

        if weekdays and habit.frequency in (HabitFrequency.SPECIFIC_DAYS, HabitFrequency.CUSTOM):
            for day in set(weekdays):
                HabitSchedule.objects.create(habit=habit, weekday=day)

        return habit

    def update(self, instance, validated_data):
        weekdays = validated_data.pop("weekdays", None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        if weekdays is not None:
            instance.schedules.all().delete()
            if instance.frequency in (HabitFrequency.SPECIFIC_DAYS, HabitFrequency.CUSTOM):
                for day in set(weekdays):
                    HabitSchedule.objects.create(habit=instance, weekday=day)

        return instance
