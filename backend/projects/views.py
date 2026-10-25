from django.shortcuts import render
from django.db import transaction
from rest_framework import generics,permissions
from .models import Projects,Membership,ProjectMeeting,ProjectInvitation
from .serializers import ProjectSerializer
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from datetime import timedelta
from django.conf import settings
import hashlib
import secrets
from django.core import signing
from django.core.mail import send_mail
from django.utils import timezone
import json
from django.core.serializers.json import DjangoJSONEncoder
import uuid
from django.contrib.auth import get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
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

    identifier = data.get("email") or data.get("username")
    role = str(data.get("role", "")).lower()

    if not isinstance(identifier,str) or not identifier.strip():
        return JsonResponse({"error":"A username or email address is required"},status=400)
    if role not in (Membership.Role.EDITOR,Membership.Role.VIEWER):
        return JsonResponse({"error":"role should be editor or viewer"},status=400)

    identifier=identifier.strip()
    User=get_user_model()
    if "@" not in identifier:
        user=User.objects.filter(username__iexact=identifier).first()

        if user is None:
            return JsonResponse({"error":"No registered user found with this username"},status=404)

        if Membership.objects.filter(project_id=project_id,user=user).exists():
            return JsonResponse({"error": "User is already a project member."},status=409)

        member=Membership.objects.create(
            project_id=project_id,
            user=user,
            defaults={'role':role}
        )

        return JsonResponse({
            "message": "Member added successfully.",
            "member": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": member.role,
            },
        }, status=201)  
    email=identifier.lower()
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse({'error':"Enter a valid email address"},status=400)

    user=User.objects.filter(email__iexact=email).first()
    if user is not None:
        if Membership.objects.filter(project_id=project_id,user=user).exists():
            return JsonResponse({"error":"User is already a project member"},status=409)
        
        member=Membership.objects.create(
            project_id=project_id,
            user=user,
            defaults={'role':role}
        )

        return JsonResponse({
            "message":"Member added successfully",
            "member":{
                "id":user.id,
                "username":user.username,
                'email':user.email,
                'role':member.role
            }
        },status=201)

    existing_invitation=ProjectInvitation.objects.filter(project_id=project_id,email=email,status=ProjectInvitation.Status.PENDING,expires_at__gt=timezone.now()).first()

    if existing_invitation:
        return JsonResponse({"error":"An active invitation already exists for this email"},status=409)

    raw_token=secrets.token_urlsafe(32)
    token_hash=hashlib.sha256(raw_token.encode()).hexdigest()

    invitation=ProjectInvitation.objects.create(
        project_id=project_id,
        email=email,
        role=role,
        invited_by=request.user,
        token_hash=token_hash,
        expires_at=timezone.now()+timedelta(hours=72)
    )
    accept_url=(
        f'{settings.FRONTEND_URL.rstrip('/')}'
        f'/accept-project-invitation?token={raw_token}'
    )
    send_mail(
        subject=f"Invitation to join {invitation.project.name}",
        message=(
            f"{request.user.username} invited you to join "
            f"{invitation.project.name} as a {role}.\n\n"
            f"To accept the invitation, open:\n{accept_url}\n\n"
            "You must register or sign in using the invited email address. "
            "This invitation expires in 72 hours."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False 
    )
    return JsonResponse({"message":"Invitation sent to User."},status=201)

@login_required
@require_http_methods(["GET"])
def project_invitations(request,project_id):
    membership=get_object_or_404(Membership,project_id=project_id,user=request.user)
    
    if membership.role!=Membership.Role.OWNER:
        return JsonResponse({"error":"Only owner can view invitations"},status=403)

    invitations=ProjectInvitation.objects.filter(project_id=project_id,status=ProjectInvitation.Status.PENDING).values('id','email','role','status','created_at','expires_at')
    return JsonResponse({'invitations':list(invitations)},encoder=DjangoJSONEncoder)

@require_http_methods(["GET"])
def project_invitation_details(request, token):
    token_hash = hashlib.sha256(token.encode()).hexdigest()

    invitation = ProjectInvitation.objects.filter(
        token_hash=token_hash,
        status=ProjectInvitation.Status.PENDING,
        expires_at__gt=timezone.now(),
    ).select_related("project").first()

    if invitation is None:
        return JsonResponse(
            {"error": "This invitation is invalid, expired, or no longer pending."},
            status=404,
        )

    return JsonResponse({
        "email": invitation.email,
        "project_name": invitation.project.name,
        "role": invitation.role,
    })

@login_required
@require_http_methods(["DELETE"])
def revoke_project_invitation(request, project_id, invitation_id):
    membership = get_object_or_404(Membership,project_id=project_id,user=request.user,)

    if membership.role != Membership.Role.OWNER:
        return JsonResponse({"error": "Only the project owner can revoke invitations."},status=403,)

    invitation = get_object_or_404(
        ProjectInvitation,
        id=invitation_id,
        project_id=project_id,
    )

    if invitation.status != ProjectInvitation.Status.PENDING:
        return JsonResponse({"error": "Only pending invitations can be revoked."},status=400,)

    invitation.delete()

    return JsonResponse({"message": "Invitation deleted."})

@login_required
@require_http_methods(["POST"])
@transaction.atomic
def accept_project_invitation(request):
    try:
        data=json.loads(request.body)
    except (json.JSONDecodeError,TypeError):
        return JsonResponse({"error":"Invalid JSON"},status=400)
    token=data.get('token')

    if not isinstance(token,str) or not token:
        return JsonResponse({"error":"Invitation token is required"},status=400)

    token_hash=hashlib.sha256(token.encode()).hexdigest()
    invitation=ProjectInvitation.objects.select_for_update().filter(token_hash=token_hash).first()
    if invitation is None:
        return JsonResponse({"error":"Invalid invitation token"},status=404)
    if invitation.status!=ProjectInvitation.Status.PENDING:
        return JsonResponse({"error":"The invitation is no longer pending."},status=400)
    if invitation.expires_at<=timezone.now():
        invitation.status=ProjectInvitation.Status.EXPIRED
        invitation.save(update_fields=['status'])
        return JsonResponse({"error":"This is invitation is expired."},status=400)
    user_email=(request.user.email or "").strip().lower()
    if not user_email or user_email!=invitation.email.lower():
        return JsonResponse({"error":"Sign in with the email address that was invited"},status=403)

    membership,created=Membership.objects.get_or_create(
        project=invitation.project,
        user=request.user,
        defaults={"role":invitation.role}
    )
    invitation.status=ProjectInvitation.Status.ACCEPTED
    invitation.accepted_at=timezone.now()
    invitation.save(update_fields=['status','accepted_at'])

    return JsonResponse({
        "message": (
            "Invitation accepted successfully."
            if created
            else "You are already a member of this project."
        ),
        "project_id": invitation.project_id,
        "role": membership.role,
    }, status=200)

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


@login_required
@require_http_methods(["GET", "POST"])
def project_meetings(request, project_id):
    get_object_or_404(Membership, project_id=project_id, user=request.user)

    if request.method == "GET":
        meetings = ProjectMeeting.objects.filter(
            project_id=project_id,
            invited_members=request.user,
        )
        return JsonResponse({
            "meetings": [
                {
                    "id": m.id,
                    "title": m.title,
                    "roomName": m.room_name,
                }
                for m in meetings
            ]
        })

    data = json.loads(request.body)
    meeting = ProjectMeeting.objects.create(
        project_id=project_id,
        title=data["title"],
        room_name=f"project-{project_id}-{uuid.uuid4().hex[:12]}",
        created_by=request.user,
    )
    meeting.invited_members.add(request.user)

    return JsonResponse({
        "id": meeting.id,
        "title": meeting.title,
        "roomName": meeting.room_name,
    }, status=201)


@login_required
@require_http_methods(["POST"])
def invite_meeting_members(request, project_id, meeting_id):
    get_object_or_404(Membership, project_id=project_id, user=request.user)
    meeting = get_object_or_404(
        ProjectMeeting, id=meeting_id, project_id=project_id,
        created_by=request.user,
    )

    data = json.loads(request.body)
    member_ids = data.get("member_ids", [])

    valid_ids = Membership.objects.filter(
        project_id=project_id, user_id__in=member_ids
    ).values_list("user_id", flat=True)

    meeting.invited_members.add(*valid_ids)
    return JsonResponse({"message": "Members invited"})
