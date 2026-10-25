from django.urls import path    
from . import views
from .documents import project_documents
from . import code_files
urlpatterns=[
    path("project-invitations/accept/",views.accept_project_invitation,name="accept-project-invitation"),
    path("",views.ProjectCreateView.as_view(),name="project-create"),
    path("list/",views.project_list,name="project-list" ),
    path("<int:project_id>/members/",views.project_members,name='project_members'),
    path("<int:project_id>/invitations/",views.project_invitations,name='project_invitations'), 
    path("project-invitations/<str:token>/",views.project_invitation_details,name="project-invitation-details"),
    path("<int:project_id>/invitations/<int:invitation_id>/",views.revoke_project_invitation,name="revoke-project-invitation"),
    path('<int:project_id>/members/<int:user_id>/',views.project_member_details,name="project_members_details"),
    path("<int:project_id>/",views.project_detail,name="project-detail"),
    path("<int:project_id>/update/",views.update_project,name="update-project"),
    path('<int:project_id>/delete/',views.delete_project,name="delete-project"),
    path("<int:project_id>/documents/",project_documents,name="project_documents"),
    path("<int:project_id>/code-files/",code_files.project_code_files,name="project-code-files"),
    path("<int:project_id>/code-files/<int:file_id>/",code_files.project_code_file_detail,name="project-code-file-detail"),
    path("<int:project_id>/code-files/export.zip",code_files.export_project_code_files,name="project-code-files-export"),
    path("<int:project_id>/meetings/", views.project_meetings, name="project-meetings"),
    path("<int:project_id>/meetings/<int:meeting_id>/invite/", views.invite_meeting_members, name="invite-meeting-members"),

]