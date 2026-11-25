import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class DailyReflection(models.Model):
    """Daily mood and mindful reflection recorded by user."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reflections",
        db_index=True,
    )
    reflection_date = models.DateField(db_index=True)
    mood = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Mood score from 1 (lowest) to 5 (highest)",
    )
    what_went_well = models.TextField(blank=True, default="")
    challenges = models.TextField(blank=True, default="")
    additional_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Daily Reflection"
        verbose_name_plural = "Daily Reflections"
        ordering = ["-reflection_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "reflection_date"],
                name="unique_user_reflection_date",
            )
        ]
        indexes = [
            models.Index(fields=["user", "reflection_date"]),
        ]

    def __str__(self):
        return f"Reflection for {self.user.email} on {self.reflection_date} (Mood: {self.mood})"
