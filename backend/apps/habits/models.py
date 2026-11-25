import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class HabitCategory(models.TextChoices):
    HEALTH = "health", "Health"
    FITNESS = "fitness", "Fitness"
    LEARNING = "learning", "Learning"
    PRODUCTIVITY = "productivity", "Productivity"
    PERSONAL_DEVELOPMENT = "personal_development", "Personal Development"
    FINANCE = "finance", "Finance"
    RELATIONSHIPS = "relationships", "Relationships"
    OTHER = "other", "Other"


class HabitFrequency(models.TextChoices):
    DAILY = "daily", "Every day"
    SPECIFIC_DAYS = "specific_days", "Specific days of the week"
    CUSTOM = "custom", "Custom weekly schedule"


class HabitStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    PAUSED = "paused", "Paused"
    ARCHIVED = "archived", "Archived"


class Habit(models.Model):
    """Core habit model defining user goals and schedules."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habits",
        db_index=True,
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    category = models.CharField(
        max_length=50,
        choices=HabitCategory.choices,
        default=HabitCategory.PERSONAL_DEVELOPMENT,
        db_index=True,
    )
    frequency = models.CharField(
        max_length=20,
        choices=HabitFrequency.choices,
        default=HabitFrequency.DAILY,
    )
    target_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional measurable numerical goal (e.g. 10 for pages)",
    )
    target_unit = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Optional unit for the target (e.g. pages, minutes, km)",
    )
    start_date = models.DateField(default=timezone.now, db_index=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=HabitStatus.choices,
        default=HabitStatus.ACTIVE,
        db_index=True,
    )
    icon = models.CharField(max_length=50, default="check-circle")
    color = models.CharField(max_length=20, default="#173B32")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Habit"
        verbose_name_plural = "Habits"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["user", "start_date"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.user.email})"

    def is_scheduled_on(self, date_obj) -> bool:
        """Check if habit is scheduled to run on a specific date."""
        if self.start_date and date_obj < self.start_date:
            return False
        if self.end_date and date_obj > self.end_date:
            return False
        if self.frequency == HabitFrequency.DAILY:
            return True
        weekday = date_obj.weekday()  # 0=Monday, 6=Sunday
        return self.schedules.filter(weekday=weekday).exists()


class HabitSchedule(models.Model):
    """Specific weekdays on which a habit is scheduled."""

    WEEKDAY_CHOICES = [
        (0, "Monday"),
        (1, "Tuesday"),
        (2, "Wednesday"),
        (3, "Thursday"),
        (4, "Friday"),
        (5, "Saturday"),
        (6, "Sunday"),
    ]

    id = models.BigAutoField(primary_key=True)
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name="schedules",
        db_index=True,
    )
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)

    class Meta:
        verbose_name = "Habit Schedule"
        verbose_name_plural = "Habit Schedules"
        constraints = [
            models.UniqueConstraint(
                fields=["habit", "weekday"],
                name="unique_habit_weekday_schedule",
            )
        ]

    def __str__(self):
        return f"{self.habit.name} - {self.get_weekday_display()}"
