from django.db import models
from django.conf import settings

# Create your models here.
class Projects(models.Model):
    name=models.CharField(max_length=200)
    description=models.TextField(blank=True)
    created_by=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_at=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Membership(models.Model):
    class Role(models.TextChoices):
        OWNER="owner","Owner"
        VIEWER="viewer","Viewer"
        EDITOR="editor","Editor"
    project=models.ForeignKey(
        Projects,
        on_delete=models.CASCADE
    )
    user=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    role=models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.EDITOR,
    )
    joined_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints=[models.UniqueConstraint(fields=["project","user"],name="Unique_project_membership")]

    def __str__(self):
        return f"{self.user}-{self.project} ({self.role})"