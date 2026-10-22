import json
from pathlib import PurePosixPath

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required

from .models import Membership, ProjectCodeFile


MAX_FILE_SIZE = 1_000_000  # 1 MB for the MVP


def parse_body(request):
    try:
        data = json.loads(request.body or b"{}")
        return data if isinstance(data, dict) else None
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def serialize_file(item):
    return {
        "id": item.id,
        "name": item.name,
        "path": item.relative_path,
        "version": item.version,
        "updated_at": item.updated_at.isoformat(),
    }


def safe_path(value):
    if not isinstance(value, str) or not value.strip():
        return None

    path = PurePosixPath(value.strip())

    if (
        path.is_absolute()
        or "\\" in value
        or any(part in ("", ".", "..") for part in path.parts)
        or ":" in value
        or len(value) > 500
    ):
        return None

    return path.as_posix()


def read_content(item):
    with item.file.open("rb") as stream:
        return stream.read().decode("utf-8")


@login_required
@require_http_methods(["GET", "POST"])
def project_code_files(request, project_id):
    membership = get_object_or_404(
        Membership,
        project_id=project_id,
        user=request.user,
    )

    if request.method == "GET":
        files = ProjectCodeFile.objects.filter(
            projects_id=project_id
        ).order_by("relative_path")

        return JsonResponse({
            "files": [serialize_file(item) for item in files]
        })

    if membership.role == Membership.Role.VIEWER:
        return JsonResponse({"error": "Viewers cannot create files."}, status=403)

    data = parse_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    path = safe_path(data.get("path"))
    content = data.get("content", "")

    if not path or not isinstance(content, str):
        return JsonResponse(
            {"error": "A valid path and string content are required."},
            status=400,
        )

    if len(content.encode("utf-8")) > MAX_FILE_SIZE:
        return JsonResponse({"error": "File exceeds 1 MB."}, status=413)

    if ProjectCodeFile.objects.filter(
        projects_id=project_id, relative_path=path
    ).exists():
        return JsonResponse({"error": "File path already exists."}, status=409)

    item = ProjectCodeFile(
        projects_id=project_id,
        name=PurePosixPath(path).name,
        relative_path=path,
        created_by=request.user,
        updated_by=request.user,
    )

    item.file.save(
        PurePosixPath(path).name,
        ContentFile(content.encode("utf-8")),
        save=False,
    )
    item.save()

    return JsonResponse(
        {"file": serialize_file(item), "content": content},
        status=201,
    )


@login_required
@require_http_methods(["GET", "PUT"])
def project_code_file_detail(request, project_id, file_id):
    membership = get_object_or_404(
        Membership,
        project_id=project_id,
        user=request.user,
    )

    item = get_object_or_404(
        ProjectCodeFile,
        id=file_id,
        projects_id=project_id,
    )

    if request.method == "GET":
        try:
            content = read_content(item)
        except (OSError, UnicodeDecodeError):
            return JsonResponse(
                {"error": "File could not be read as UTF-8 text."},
                status=500,
            )

        return JsonResponse({
            "file": serialize_file(item),
            "content": content,
        })

    if membership.role == Membership.Role.VIEWER:
        return JsonResponse({"error": "Viewers cannot save files."}, status=403)

    data = parse_body(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    content = data.get("content")
    version = data.get("version")

    if not isinstance(content, str) or type(version) is not int:
        return JsonResponse(
            {"error": "String content and integer version are required."},
            status=400,
        )

    if len(content.encode("utf-8")) > MAX_FILE_SIZE:
        return JsonResponse({"error": "File exceeds 1 MB."}, status=413)

    with transaction.atomic():
        item = ProjectCodeFile.objects.select_for_update().get(pk=item.pk)

        if item.version != version:
            return JsonResponse({
                "error": "File changed since it was opened. Reload before saving.",
                "current_version": item.version,
            }, status=409)

        old_name = item.file.name

        item.file.save(
            PurePosixPath(item.relative_path).name,
            ContentFile(content.encode("utf-8")),
            save=False,
        )
        item.version += 1
        item.updated_by = request.user
        item.save()

        if old_name and old_name != item.file.name:
            default_storage.delete(old_name)

    return JsonResponse({
        "file": serialize_file(item),
        "content": content,
    })
