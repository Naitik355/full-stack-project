from django.urls import path    
from . import views

urlpatterns=[
    path("",views.ProjectCreateView.as_view(),name="project-create"),
    path("list/",views.project_list,name="project-list" ),
    path("<int:project_id>/",views.project_detail,name="project-detail"),
    path("<int:project_id>/update/",views.update_project,name="update-project"),
    path('<int:project_id>/delete/',views.delete_project,name="delete-project"),
]