from django.shortcuts import render
from django.db import transaction
from rest_framework import generics,permissions
from .models import Projects,Membership
from .serializers import ProjectSerializer
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
import json
from django.views.decorators.csrf import csrf_exempt
# Create your views here.

class ProjectCreateView(generics.CreateAPIView):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    @csrf_exempt
    @transaction.atomic
    def perform_create(self, serializer):
        project = serializer.save(created_by=self.request.user)

        Membership.objects.create(
            project=project,
            user=self.request.user,
            role=Membership.Role.OWNER,
        )


@login_required
def project_list(request):
    memberships = Membership.objects.filter(
        user=request.user
    ).select_related("project")

    projects = []

    for membership in memberships:
        project = membership.project

        projects.append({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "role": membership.role,
        })

    return JsonResponse({"projects": projects})

@login_required
def project_detail(request, project_id):
    membership = get_object_or_404(
        Membership,
        project_id=project_id,
        user=request.user
    )

    project = membership.project

    return JsonResponse({
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "role": membership.role,
        "created_at": project.created_at,
    }, safe=True)

@login_required
@require_http_methods(["PUT", "PATCH"])
def update_project(request, project_id):
    membership = get_object_or_404(
        Membership,
        project_id=project_id,
        user=request.user
    )

    if membership.role == "viewer":
        return JsonResponse(
            {"error": "You do not have permission to edit this project"},
            status=403
        )

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    project = membership.project

    if "name" in data:
        project.name = data["name"]

    if "description" in data:
        project.description = data["description"]

    project.save()

    return JsonResponse({
        "id": project.id,
        "name": project.name,
        "description": project.description
    })

@login_required
@require_http_methods(["DELETE"])
def delete_project(request,project_id):
    memebership=get_object_or_404(
        Membership,
        project_id=project_id,
        user=request.user,
        role='owner'
    )
    project=memebership.project
    project.delete()
    return JsonResponse({"message":"Project deleted successfuly"})