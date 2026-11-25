from rest_framework import serializers
from .models import DailyReflection


from apps.tracking.services import get_user_today


class DailyReflectionSerializer(serializers.ModelSerializer):
    reflection_date = serializers.DateField(required=False)

    class Meta:
        model = DailyReflection
        fields = [
            "id",
            "reflection_date",
            "mood",
            "what_went_well",
            "challenges",
            "additional_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_mood(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Mood must be between 1 and 5.")
        return value

    def create(self, validated_data):
        user = self.context["request"].user
        reflection_date = validated_data.get("reflection_date")
        if not reflection_date:
            reflection_date = get_user_today(user)
            validated_data["reflection_date"] = reflection_date

        # Update or create to ensure single reflection per user per local date
        reflection, _ = DailyReflection.objects.update_or_create(
            user=user,
            reflection_date=reflection_date,
            defaults=validated_data,
        )
        return reflection
