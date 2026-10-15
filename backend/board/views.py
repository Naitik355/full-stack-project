from django.shortcuts import render
from django.shortcuts import render
from django.db import transaction
from rest_framework import generics,permissions
from .models import Board
from django.http import JsonResponse
from projects.models import Projects,Membership
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import json
# Create your views here.

def get_membership(project, user):
    return Membership.objects.filter(
        project=project,
        user=user
    ).first()

@csrf_exempt
@login_required
@require_http_methods(['GET','POST'])
def project_boards(request,project_id):
    project=get_object_or_404(Projects,id=project_id)
    membership=get_membership(project,request.user)
    if not membership:
        return JsonResponse({"error":"You are not the member of this project."},status=403)

    if request.method=='GET':
        boards = Board.objects.filter(project=project).order_by("-created_at")
        return JsonResponse({
            "boards": [
                {
                    "id": board.id,
                    "title": board.title,
                    "room_id": str(board.room_id),
                    "created_by": board.created_by_id,
                    "created_at": board.created_at.isoformat(),
                }
                for board in boards
            ]
        })

    if membership.role == Membership.Role.VIEWER:
        return JsonResponse(
            {"error": "Viewers cannot create boards."},
            status=403,
        )

    try:
        data = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    title = data.get("title", "Untitled Board")
    if not isinstance(title, str) or not title.strip():
        return JsonResponse(
            {"error": "Title must be a non-empty string."},
            status=400,
        )

    title = title.strip()
    if len(title) > 200:
        return JsonResponse(
            {"error": "Title must be 200 characters or fewer."},
            status=400,
        )

    board = Board.objects.create(
        project=project,
        title=title,
        created_by=request.user,
    )

    return JsonResponse(
        {
            "id": board.id,
            "title": board.title,
            "room_id": str(board.room_id),
        },
        status=201,
    )

@csrf_exempt
@login_required
@require_http_methods(["GET", "PATCH", "DELETE"])
def board_detail(request, board_id):
    board = get_object_or_404(
        Board.objects.select_related("project"),
        id=board_id,
    )

    membership = get_membership(board.project, request.user)
    if not membership:
        return JsonResponse(
            {"error": "You are not a member of this project."},
            status=403,
        )

    if request.method == "GET":
        return JsonResponse({
            "id": board.id,
            "project_id": board.project_id,
            "title": board.title,
            "room_id": str(board.room_id),
            "created_by": board.created_by_id,
            "created_at": board.created_at.isoformat(),
            "updated_at": board.updated_at.isoformat(),
        })

    if membership.role == Membership.Role.VIEWER:
        return JsonResponse(
            {"error": "Viewers cannot modify boards."},
            status=403,
        )

    if request.method == "PATCH":
        try:
            data = json.loads(request.body or "{}")
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON."}, status=400)

        if "title" not in data:
            return JsonResponse(
                {"error": "Provide a title to update."},
                status=400,
            )

        title = data["title"]
        if not isinstance(title, str) or not title.strip():
            return JsonResponse(
                {"error": "Title must be a non-empty string."},
                status=400,
            )

        title = title.strip()
        if len(title) > 200:
            return JsonResponse(
                {"error": "Title must be 200 characters or fewer."},
                status=400,
            )

        board.title = title
        board.save(update_fields=["title", "updated_at"])

        return JsonResponse({
            "id": board.id,
            "title": board.title,
            "room_id": str(board.room_id),
        })

    board.delete()
    return JsonResponse({"message": "Board deleted successfully."})
