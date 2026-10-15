
import json

from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from projects.models import Projects, Membership
from .models import Task,TaskDependency

@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def project_tasks(request, project_id):
    membership = Membership.objects.filter(
        project_id=project_id,
        user=request.user
    ).first()

    if membership is None:
        return JsonResponse(
        {"error": "Project not found or access denied"},
        status=404
    )

    if request.method == "GET":
        tasks = Task.objects.filter(
            project_id=project_id
        ).select_related("assigned_to", "created_by")

        task_data = []

        for task in tasks:
            task_data.append({
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "assigned_to": (
                    task.assigned_to_id
                    if task.assigned_to else None
                ),
                "created_by": task.created_by_id,
                "due_date": (
                    task.due_date.isoformat()
                    if task.due_date else None
                ),
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            })

        return JsonResponse({"tasks": task_data})

    # Only owners and editors can create tasks.
    if membership.role == Membership.Role.VIEWER:
        return JsonResponse(
            {"error": "Viewers cannot create tasks"},
            status=403
        )

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    title = data.get("title")

    if not isinstance(title, str) or not title.strip():
        return JsonResponse(
            {"error": "Task title is required"},
            status=400
        )

    status_value = data.get("status", Task.Status.TODO)
    priority_value = data.get("priority", Task.Priority.MEDIUM)

    if status_value not in Task.Status.values:
        return JsonResponse({"error": "Invalid status"}, status=400)

    if priority_value not in Task.Priority.values:
        return JsonResponse({"error": "Invalid priority"}, status=400)

    assigned_to_id = data.get("assigned_to")
    assigned_user = None

    if assigned_to_id is not None:
        assigned_membership = Membership.objects.filter(
            project_id=project_id,
            user_id=assigned_to_id
        ).select_related("user").first()

        if assigned_membership is None:
            return JsonResponse(
                {"error": "Assignee must be a member of this project"},
                status=400
            )

        assigned_user = assigned_membership.user

    due_date = data.get("due_date")

    if due_date is not None:
        from datetime import date

        try:
            due_date = date.fromisoformat(due_date)
        except (ValueError, TypeError):
            return JsonResponse(
                {"error": "due_date must use YYYY-MM-DD format"},
                status=400
            )

    task = Task.objects.create(
        project_id=project_id,
        title=title.strip(),
        description=data.get("description", ""),
        status=status_value,
        priority=priority_value,
        assigned_to=assigned_user,
        created_by=request.user,
        due_date=due_date
    )

    return JsonResponse({
        "message": "Task created successfully",
        "id": task.id,
        "title": task.title,
        "status": task.status,
        "priority": task.priority
    }, status=201)


@csrf_exempt
@login_required
@require_http_methods(["PATCH", "DELETE"])
def task_detail(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    membership = Membership.objects.filter(
    project_id=task.project_id,
    user=request.user
    ).first()
    if membership is None:
        return JsonResponse(
        {"error": "Task not found or access denied"},
        status=404
    )
    if request.method == "PATCH":
        if membership.role == Membership.Role.VIEWER:
            return JsonResponse(
                {"error": "Viewers cannot edit tasks"},
                status=403
            )
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        if not isinstance(data, dict):
            return JsonResponse({"error": "Expected a JSON object"}, status=400)
        if "title" in data:
            if not isinstance(data["title"], str) or not data["title"].strip():
                return JsonResponse({"error": "Title cannot be empty"}, status=400)
            task.title = data["title"].strip()
        if "description" in data:
            task.description = data["description"]

        if "status" in data:
            if data["status"] not in Task.Status.values:
                return JsonResponse({"error": "Invalid status"}, status=400)
            task.status = data["status"]
        if "priority" in data:
            if data["priority"] not in Task.Priority.values:
                return JsonResponse({"error": "Invalid priority"}, status=400)
            task.priority = data["priority"]

        if "assigned_to" in data:
            user_id = data["assigned_to"]
            assigned_user = None
            if user_id is not None:
                assigned_membership = Membership.objects.filter(
                    project_id=task.project_id,
                    user_id=user_id
                ).first()
                if assigned_membership is None:
                    return JsonResponse(
                        {"error": "Assignee must be a project member"},
                        status=400
                    )
                assigned_user = assigned_membership.user
            task.assigned_to = assigned_user

        if "due_date" in data:
            from datetime import date
            if data["due_date"] is None:
                task.due_date = None
            else:
                try:
                    task.due_date = date.fromisoformat(data["due_date"])
                except (ValueError, TypeError):
                    return JsonResponse(
                        {"error": "Invalid due date. Use YYYY-MM-DD"},
                        status=400
                    )
        task.save()
        return JsonResponse({
            "message": "Task updated successfully",
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "assigned_to": task.assigned_to_id,
            "due_date": task.due_date.isoformat() if task.due_date else None
        })

    if membership.role == Membership.Role.VIEWER:
        return JsonResponse(
            {"error": "Viewers cannot delete tasks"},
            status=403
        )
    task.delete()
    return JsonResponse({"message": "Task deleted successfully"})



def get_task_membership(task, user):
    return Membership.objects.filter(
        project_id=task.project_id,
        user=user
    ).first()

@csrf_exempt
@login_required
@require_http_methods(["GET", "POST"])
def task_dependencies(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    membership = get_task_membership(task, request.user)
    if membership is None:
        return JsonResponse(
            {"error": "Task not found or access denied"},
            status=404
        )
    if request.method == "GET":
        dependencies = TaskDependency.objects.filter(
            task=task
        ).select_related("depends_on")

        data = []
        for dependency in dependencies:
            prerequisite = dependency.depends_on
            data.append({
                "dependency_id": dependency.id,
                "task_id": task.id,
                "depends_on": prerequisite.id,
                "title": prerequisite.title,
                "status": prerequisite.status,
                "is_blocking": prerequisite.status != Task.Status.DONE,
            })
        return JsonResponse({"dependencies": data})
    if membership.role == Membership.Role.VIEWER:
        return JsonResponse(
            {"error": "Viewers cannot add dependencies"},
            status=403
        )
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    if not isinstance(data, dict):
        return JsonResponse(
            {"error": "Expected a JSON object"},
            status=400
        )
    depends_on_id = data.get("depends_on")
    if depends_on_id is None:
        return JsonResponse(
            {"error": "depends_on is required"},
            status=400
        )
    prerequisite = Task.objects.filter(
        id=depends_on_id,
        project_id=task.project_id
    ).first()
    if prerequisite is None:
        return JsonResponse(
            {"error": "Prerequisite must be a task in the same project"},
            status=400
        )
    if prerequisite.id == task.id:
        return JsonResponse(
            {"error": "A task cannot depend on itself"},
            status=400
        )
    visited = set()
    stack = [prerequisite.id]
    while stack:
        current_id = stack.pop()
        if current_id == task.id:
            return JsonResponse(
                {"error": "This dependency would create a cycle"},
                status=400
            )
        if current_id in visited:
            continue
        visited.add(current_id)
        next_ids = TaskDependency.objects.filter(
            task_id=current_id
        ).values_list("depends_on_id", flat=True)
        stack.extend(next_ids)
    dependency, created = TaskDependency.objects.get_or_create(
        task=task,
        depends_on=prerequisite
    )
    if not created:
        return JsonResponse(
            {"error": "This dependency already exists"},
            status=400
        )
    return JsonResponse({
        "message": "Dependency added successfully",
        "dependency_id": dependency.id,
        "task_id": task.id,
        "depends_on": prerequisite.id
    }, status=201)

@csrf_exempt
@login_required
@require_http_methods(["DELETE"])
def task_dependency_detail(request, task_id, dependency_id):
    task = get_object_or_404(Task, id=task_id)

    membership = get_task_membership(task, request.user)
    if membership is None:
        return JsonResponse(
            {"error": "Task not found or access denied"},
            status=404
        )

    if membership.role == Membership.Role.VIEWER:
        return JsonResponse(
            {"error": "Viewers cannot remove dependencies"},
            status=403
        )

    dependency = get_object_or_404(
        TaskDependency,
        id=dependency_id,
        task=task
    )
    dependency.delete()

    return JsonResponse({
        "message": "Dependency removed successfully"
    })
