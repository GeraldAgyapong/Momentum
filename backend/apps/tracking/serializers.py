from rest_framework import serializers
from .models import HabitLog, HabitLogStatus
from apps.habits.models import Habit
from apps.habits.serializers import HabitSerializer


class HabitLogSerializer(serializers.ModelSerializer):
    habit_name = serializers.CharField(source="habit.name", read_only=True)
    habit_color = serializers.CharField(source="habit.color", read_only=True)
    habit_icon = serializers.CharField(source="habit.icon", read_only=True)

    class Meta:
        model = HabitLog
        fields = [
            "id",
            "habit",
            "habit_name",
            "habit_color",
            "habit_icon",
            "local_date",
            "status",
            "value",
            "note",
            "completed_at",
            "created_at",
        ]
        read_only_fields = ["id", "completed_at", "created_at"]

    def validate(self, attrs):
        user = self.context["request"].user
        habit = attrs.get("habit")
        if habit and habit.user != user:
            raise serializers.ValidationError({"habit": "You do not have permission to log this habit."})
        return attrs


class DailyTrackingHabitItemSerializer(serializers.Serializer):
    habit = HabitSerializer()
    is_completed = serializers.BooleanField()
    log = HabitLogSerializer(allow_null=True)


class DailyTrackingResponseSerializer(serializers.Serializer):
    date = serializers.DateField()
    is_today = serializers.BooleanField()
    total_scheduled = serializers.IntegerField()
    total_completed = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    habits = DailyTrackingHabitItemSerializer(many=True)
