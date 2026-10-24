import json
from pathlib import PurePosixPath

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db import transaction
from django.http import JsonResponse,HttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from io import BytesIO
from zipfile import ZIP_DEFLATED,ZipFile
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
    value=value.strip()
    if(value.startswith('/') or "\\" in value or ":" in value or "\x00" in value or len(value)>500):
        return None
    parts=value.split('/')
    if any(part in ("",".","..") for part in parts):
        return None
    if len(parts[-1])>200:
        return None
    return "/".join(parts)

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
@require_http_methods(["GET", "PUT","PATCH","DELETE"])
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
    if request.method=="PATCH":
        if membership.role==Membership.Role.VIEWER:
            return JsonResponse({"error":"Viewer cannot edit the files."},status=403)
        data=parse_body(request)
        if data is None:
            return JsonResponse({'error':"Invalid JSON"},status=400)
        new_path=safe_path(data.get('path'))
        if not new_path:
            return JsonResponse({'error':'A valid relative file path required'},status=400)
        with transaction.atomic():
            item=ProjectCodeFile.objects.select_for_update().filter(
                pk=file_id,
                projects_id=project_id
            ).first()
            if item is None:
                return JsonResponse({'error':'File not found'},status=404)
            if ProjectCodeFile.objects.filter(
                projects_id=project_id,
                relative_path=new_path
            ).exclude(pk=item.pk).exists():
                return JsonResponse({"error":"File path already exists"},status=409)
            item.relative_path = new_path
            item.name = PurePosixPath(new_path).name
            item.version += 1
            item.updated_by = request.user
            item.save(
                update_fields=[
                    "relative_path",
                    "name",
                    "version",
                    "updated_by",
                    "updated_at",
                ]
            )

        return JsonResponse({"file": serialize_file(item)})
    if request.method=="DELETE":
        if membership.role==Membership.Role.VIEWER:
            return JsonResponse({"error":"Viewers cannot delete the files"},status=403)
        with transaction.atomic():
            item=ProjectCodeFile.objects.select_for_update().filter(
                pk=file_id,
                projects_id=project_id
            ).first()
            if item is None:
                return JsonResponse({"error":"File not found"},status=404)
            stored_name=item.file.name
            item.delete()
            if stored_name:
                default_storage.delete(stored_name)
            return JsonResponse({"deleted":True})
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

# @login_required
# @require_http_methods(['GET'])
# def export_poject_code_files(request,project_id):
#     get_object_or_404(Membership,project_id=project_id,user=request.user)
#     files=ProjectCodeFile.objects.filter(projects_id=project_id).order_by('relative_path')
#     archive_buffer=BytesIO()
#     try:
#         with ZipFile(archive_buffer,'w',ZIP_DEFLATED) as archive:
#             for item in files:
#                 path=safe_path(item.relative_path)
#                 if not path:
#                     return JsonResponse({'error':'A stored file has an invalid path'},status=500)
#                 with item.file.open('rb') as stream:
#                     archive.writestr(path,stream.read())
#     except (OSError,ValueError,EOFError):
#         import logging
#     logging.getLogger(__name__).exception(
#         "Project code ZIP export failed for project %s",
#         project_id,
#     )
#     return JsonResponse(
#         {"error": "Could not export file. Check the backend terminal for details."},
#         status=500,
#     )
#     response=HttpResponse(archive_buffer.getvalue(),content_type='application/zip')
#     response["Content-Disposition"] = (
#         f'attachment; filename="project-{project_id}.zip"'
#     )
#     return response

@login_required
@require_http_methods(["GET"])
def export_project_code_files(request, project_id):
    import logging
    from io import BytesIO
    from zipfile import ZIP_DEFLATED, ZipFile

    logger = logging.getLogger(__name__)

    get_object_or_404(
        Membership,
        project_id=project_id,
        user=request.user,
    )

    files = ProjectCodeFile.objects.filter(
        projects_id=project_id
    ).order_by("relative_path")

    archive_buffer = BytesIO()

    try:
        with ZipFile(archive_buffer, "w", ZIP_DEFLATED) as archive:
            for item in files:
                path = safe_path(item.relative_path)

                if not path:
                    logger.error(
                        "Invalid stored path for code file id=%s: %r",
                        item.id,
                        item.relative_path,
                    )
                    return JsonResponse(
                        {"error": "A stored file has an invalid path."},
                        status=500,
                    )

                try:
                    with item.file.open("rb") as stream:
                        archive.writestr(path, stream.read())
                except Exception:
                    logger.exception(
                        "Failed exporting code file id=%s path=%s",
                        item.id,
                        item.relative_path,
                    )
                    return JsonResponse(
                        {"error": "Could not export file."},
                        status=500,
                    )

        archive_buffer.seek(0)

        response = HttpResponse(
            archive_buffer.getvalue(),
            content_type="application/zip",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="project-{project_id}.zip"'
        )
        return response

    except Exception:
        logger.exception(
            "Failed building ZIP archive for project id=%s",
            project_id,
        )
        return JsonResponse(
            {"error": "Could not create project ZIP."},
            status=500,
        )