from rest_framework import serializers
from .models import Projects

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model=Projects
        fields=['id','name','description','created_by','created_at']
        read_only_fields=["id","created_by","created_at"]