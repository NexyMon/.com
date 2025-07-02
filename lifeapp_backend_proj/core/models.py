from django.db import models
from django.contrib.auth.models import User

class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]

    PRIORITY_CHOICES = [
        (1, 'Sehr Hoch (Sofort)'), # Könnte als "schwer" interpretiert werden
        (2, 'Hoch'),
        (3, 'Mittel'),
        (4, 'Niedrig'),
        (5, 'Sehr Niedrig (Später)'), # Könnte als "leicht" interpretiert werden
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=3) # Standardmäßig Mittel
    due_date = models.DateTimeField(blank=True, null=True) # Erlaubt Datum und Zeit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['priority', 'due_date', 'created_at'] # Standard-Sortierreihenfolge

class ActivityCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Activity Categories"

class Activity(models.Model):
    category = models.ForeignKey(ActivityCategory, related_name='activities', on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField()
    is_outdoor = models.BooleanField(default=False)
    min_duration_minutes = models.PositiveIntegerField(default=30, help_text="Minimum duration in minutes")
    max_duration_minutes = models.PositiveIntegerField(default=120, help_text="Maximum duration in minutes")
    # Weitere Felder könnten sein: location_type (z.B. 'home', 'nearby', 'specific_place'),
    # cost_level (free, low, medium, high), specific_requirements (z.B. equipment)
    notes = models.TextField(blank=True, null=True, help_text="Additional notes, tips, or links")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Activities"
        ordering = ['name']

class UserPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferences')
    preferred_categories = models.ManyToManyField(ActivityCategory, blank=True)
    # Weitere Präferenzen könnten sein:
    # preferred_min_duration = models.PositiveIntegerField(null=True, blank=True)
    # preferred_max_duration = models.PositiveIntegerField(null=True, blank=True)
    # preferred_is_outdoor = models.BooleanField(null=True, blank=True) # True für Outdoor, False für Indoor, None für egal
    # max_cost_level = models.CharField(max_length=10, null=True, blank=True) # z.B. 'free', 'low'
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.username}"

class Friendship(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_DECLINED = 'declined'
    STATUS_BLOCKED = 'blocked' # Optional, falls Blockieren implementiert wird

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_DECLINED, 'Declined'),
        (STATUS_BLOCKED, 'Blocked'),
    ]

    # Der User, der die Anfrage sendet oder die Freundschaft initiiert hat
    from_user = models.ForeignKey(User, related_name='friendship_requests_sent', on_delete=models.CASCADE)
    # Der User, der die Anfrage empfängt
    to_user = models.ForeignKey(User, related_name='friendship_requests_received', on_delete=models.CASCADE)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) # Wann der Status zuletzt geändert wurde

    class Meta:
        unique_together = ('from_user', 'to_user') # Verhindert doppelte Anfragen in eine Richtung
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.from_user.username} to {self.to_user.username} - {self.get_status_display()}"

    # Man könnte hier noch Methoden hinzufügen, um z.B. akzeptierte Freunde leichter abzufragen,
    # aber das kann auch in den Views/Managern erfolgen.
    # z.B. eine Methode im User-Modell (via Erweiterung oder User.friends.all() bei ManyToMany)
    # Hier ist es ein explizites Friendship-Objekt.
