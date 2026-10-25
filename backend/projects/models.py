from django.db import models
import uuid
from pathlib import Path
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

class ProjectDocuments(models.Model):
    project=models.ForeignKey(
        Projects,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    title=models.CharField(max_length=200)
    pad_id=models.CharField(max_length=200,unique=True)
    created_by=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_project_documents"
    )
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        ordering=["-created_at"]
    
    def __str__(self):
        return self.title

def project_code_file_path(instance, filename):
    safe_name = Path(filename).name
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    return f"project_code/{instance.projects_id}/{unique_name}"


class ProjectCodeFile(models.Model):
    projects = models.ForeignKey(
        Projects,
        on_delete=models.CASCADE,
        related_name="code_files",
    )
    name = models.CharField(max_length=200)
    relative_path = models.CharField(max_length=500)
    file = models.FileField(upload_to=project_code_file_path)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_project_code_by",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="updated_project_code_by",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    version = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ["relative_path"]
        constraints = [
            models.UniqueConstraint(
                fields=["projects", "relative_path"],
                name="unique_project_code_file_path",
            )
        ]

    def __str__(self):
        return f"{self.projects_id}: {self.relative_path}"


class ProjectMeeting(models.Model):
    project = models.ForeignKey(
        Projects,
        on_delete=models.CASCADE,
        related_name="meetings",
    )
    title = models.CharField(max_length=200)
    room_name = models.CharField(max_length=200, unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_project_meetings",
    )
    invited_members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="project_meeting_invitations",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.project.name}"



class ProjectInvitation(models.Model):
    class Role(models.TextChoices):
        VIEWER = "viewer", "Viewer"
        EDITOR = "editor", "Editor"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        REVOKED = "revoked", "Revoked"
        EXPIRED = "expired", "Expired"

    project = models.ForeignKey(
        Projects,
        on_delete=models.CASCADE,
        related_name="invitations",
    )
    email = models.EmailField()
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.EDITOR,
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_project_invitations",
    )
    token_hash = models.CharField(max_length=64, unique=True)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["project", "email", "status"]),
        ]

    def __str__(self):
        return f"{self.email} invited to {self.project.name}"
