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
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
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


@login_required
@require_http_methods(["GET","POST"])
def project_members(request,project_id):
    membership=get_object_or_404(
        Membership,
        project_id=project_id,
        user=request.user
    )
    if request.method=="GET":
        members=Membership.objects.filter(project_id=project_id).select_related("user").order_by('joined_at')
        return JsonResponse({
            "members":[{
                "id":member.user_id,
                "username":member.user.username,
                "email":member.user.email,
                "role":member.role
                } for member in members
            ]
        })
    if membership.role!=Membership.Role.OWNER:
        return JsonResponse(
            {"error":"Only Owner can add members"},status=403
        )

    try:
        data=json.loads(request.body)
    except (json.JSONDecodeError,TypeError):
        return JsonResponse({"error":"Invalid json"},status=400)

    username=data.get("username")
    role=data.get("role")

    if not isinstance(username,str) or not username.strip():
        return JsonResponse({"error":"Username is required"},status=400)
    if role not in (Membership.Role.EDITOR,Membership.Role.VIEWER):
        return JsonResponse({"error":"role should be editor or viewer"},status=400)

    User=get_user_model()
    user=User.objects.filter(username__iexact=username.strip()).first()

    if user is None:
        return JsonResponse({"error":"No registered user found with this username"},status=404)

    member,created=Membership.objects.get_or_create(
        project_id=project_id,
        user=user,
        defaults={'role':role}
    )
    if not created:
        return JsonResponse({
            "error":"User is already a project member"
        },status=409)
    return JsonResponse({
        "message":"Member added successfully",
        "member":{
            "id":user.id,
            "username":user.username,
            'email':user.email,
            'role':member.role
        }
    },status=201)


@login_required
@require_http_methods(["PATCH","DELETE"])
def project_member_details(request,project_id,user_id):
    owner_membership=get_object_or_404(
        Membership,
        project_id=project_id,
        user=request.user
    )
    if owner_membership.role!=Membership.Role.OWNER:
        return JsonResponse({"error":"Only owner can manage members"},status=403)
    target=get_object_or_404(
        Membership,
        project_id=project_id,
        user_id=user_id
    )
    if target.role==Membership.Role.OWNER:
        return JsonResponse({"error":"Project owners cannot be changed here"},status=400)

    if request.method=="DELETE":
        target.delete()
        return JsonResponse({"message":"Member removed successfully"})

    try:
        data=json.loads(request.body)
    except (json.JSONDecodeError,TypeError):
        return JsonResponse({"error":"Invalid JSON"},status=400)

    role=data.get("role")

    if role not in(Membership.Role.EDITOR,Membership.Role.VIEWER):
        return JsonResponse({"error":"Role must be editor or viewer"},status=400)

    target.role=role
    target.save(update_fields=["role"])
    return JsonResponse({
        "message":"Member role updated successfully",
        "id":target.user_id,
        "role":target.role
    })