
import json
import os
import uuid
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods

from .models import Membership, Projects,ProjectDocuments


def etherpad_api(method, **params):
    """Call Etherpad's API without exposing its API key to the frontend."""
    base_url = settings.ETHERPAD_API_URL.rstrip("/")
    api_key = settings.ETHERPAD_API_KEY

    response = requests.post(
        f"{base_url}/api/1/{method}",
        data={"apikey": api_key, **params},
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()

    if payload.get("code") != 0:
        raise RuntimeError(payload.get("message", "Etherpad API request failed"))

    return payload.get("data", {})


def serialize_document(document, request):
    base_url = settings.ETHERPAD_API_URL.rstrip("/")
    return {
        "id": document.id,
        "title": document.title,
        "pad_id": document.pad_id,
        "embed_url": (
            f"{base_url}/p/{document.pad_id}"
            f"?showChat=false&showLineNumbers=true"
        ),
        "created_at": document.created_at.isoformat(),
    }


@login_required
@require_http_methods(["GET", "POST"])
def project_documents(request, project_id):
    membership = get_object_or_404(
        Membership.objects.select_related("project"),
        project_id=project_id,
        user=request.user,
    )
    project = membership.project

    if request.method == "GET":
        documents = ProjectDocuments.objects.filter(
            project=project
        ).order_by("-created_at")

        return JsonResponse({
            "documents": [
                serialize_document(document, request)
                for document in documents
            ]
        })

    if membership.role == Membership.Role.VIEWER:
        return JsonResponse(
            {"error": "Viewers cannot create documents."},
            status=403,
        )

    try:
        body = json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON."}, status=400)

    title = body.get("title")
    if not isinstance(title, str) or not title.strip():
        return JsonResponse({"error": "A title is required."}, status=400)

    title = title.strip()
    if len(title) > 200:
        return JsonResponse(
            {"error": "Title must be 200 characters or fewer."},
            status=400,
        )

    # A random ID makes pad names difficult to guess, but is not
    # a substitute for enforcing authentication at the Etherpad layer.
    pad_id = f"project_{project_id}_{uuid.uuid4().hex}"

    try:
        etherpad_api(
            "createPad",
            padID=pad_id,
            text=f"{title}\n\n",
        )

        document = ProjectDocuments.objects.create(
            project=project,
            title=title,
            pad_id=pad_id,
            created_by=request.user,
        )
    except requests.RequestException:
        return JsonResponse(
            {"error": "Could not connect to Etherpad. Check its URL and availability."},
            status=502,
        )
    except RuntimeError as exc:
        return JsonResponse({"error": str(exc)}, status=502)

    return JsonResponse(
        {"document": serialize_document(document, request)},
        status=201,
    )
