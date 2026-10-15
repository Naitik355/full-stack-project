from django.urls import path
from . import views

urlpatterns=[
    path("projects/<int:project_id>/boards/",views.project_boards,name="project-boards"),
    path("boards/<int:board_id>/",views.board_detail,name="board-details")
]