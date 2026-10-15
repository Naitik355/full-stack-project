from django.db import models
from django.conf import settings
# Create your models here.

class Task(models.Model):
    class Status(models.TextChoices):
        TODO="todo","To do"
        IN_PROGRESS="in_progress","In Progress"
        DONE="done","Done"

    class Priority(models.TextChoices):
        LOW="low","Low"
        MEDIUM="medium","Medium"
        HIGH="high","High"

    project=models.ForeignKey(
        "projects.Projects",
        on_delete=models.CASCADE
    )
    title=models.CharField(max_length=200)
    description=models.TextField(blank=True)
    status=models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO
    )
    priority=models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    assigned_to=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks"
    )
    created_by=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_tasks"
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TaskDependency(models.Model):
    task = models.ForeignKey(
        "Task",
        on_delete=models.CASCADE,
        related_name="dependency_links"
    )
    depends_on = models.ForeignKey(
        "Task",
        on_delete=models.CASCADE,
        related_name="dependent_links"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["task", "depends_on"],
                name="unique_task_dependency"
            ),
            models.CheckConstraint(
                condition=~models.Q(task=models.F("depends_on")),
                name="prevent_self_dependency"
            ),
        ]

    def __str__(self):
        return f"{self.task_id} depends on {self.depends_on_id}"
