from django.db import models
import uuid
from django.conf import settings
# Create your models here.

class Board(models.Model):
    project=models.ForeignKey(
        "projects.Projects",
        on_delete=models.CASCADE,
        related_name="boards"
    )
    title=models.CharField(
        max_length=200,
        default="Untitled_Board"
    )
    room_id=models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False
    )
    created_by=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_boards"
    )
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title