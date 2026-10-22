from django.urls import path    
from . import views
from .documents import project_documents
from . import code_files
urlpatterns=[
    path("",views.ProjectCreateView.as_view(),name="project-create"),
    path("list/",views.project_list,name="project-list" ),
    path("<int:project_id>/members/",views.project_members,name='project_members'),
    path('<int:project_id>/members/<int:user_id>/',views.project_member_details,name="project_members_details"),
    path("<int:project_id>/",views.project_detail,name="project-detail"),
    path("<int:project_id>/update/",views.update_project,name="update-project"),
    path('<int:project_id>/delete/',views.delete_project,name="delete-project"),
    path("<int:project_id>/documents/",project_documents,name="project_documents"),
    path("<int:project_id>/code-files/",code_files.project_code_files,name="project-code-files"),
    path("<int:project_id>/code-files/<int:file_id>/",code_files.project_code_file_detail,name="project-code-file-detail",),
]