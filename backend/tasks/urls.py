from django.urls import path
from . import views

urlpatterns=[
    path("projects/<int:project_id>/tasks/",views.project_tasks,name="project_task"),
    path("tasks/<int:task_id>/", views.task_detail, name="task-detail"),
    path("tasks/<int:task_id>/dependencies/",views.task_dependencies,name="task_dependencies"),
    path("tasks/<int:task_id>/dependencies/<int:dependency_id>/",views.task_dependency_detail,name="task_dependency_detail")
]   