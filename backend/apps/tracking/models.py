import uuid
from django.db import models
from django.utils import timezone
from apps.habits.models import Habit


class HabitLogStatus(models.TextChoices):
    COMPLETED = "completed", "Completed"
    SKIPPED = "skipped", "Skipped"


class HabitLog(models.Model):
    """Daily completion log for an individual habit."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name="logs",
        db_index=True,
    )
    local_date = models.DateField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=HabitLogStatus.choices,
        default=HabitLogStatus.COMPLETED,
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional recorded measurable value",
    )
    note = models.TextField(blank=True, default="")
    completed_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Habit Log"
        verbose_name_plural = "Habit Logs"
        ordering = ["-local_date", "-completed_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["habit", "local_date"],
                name="unique_habit_local_date_log",
            )
        ]
        indexes = [
            models.Index(fields=["habit", "local_date"]),
            models.Index(fields=["local_date", "status"]),
        ]

    def __str__(self):
        return f"{self.habit.name} - {self.local_date} ({self.status})"
