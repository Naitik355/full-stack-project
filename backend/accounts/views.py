from django.shortcuts import render
from django.contrib.auth.models import User
import json
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth import authenticate,login as auth_login,logout as auth_logout
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required


# Create your views here.

@csrf_exempt
@require_POST
def signup(request):
    try:
        data=json.loads(request.body)
        username=data['username']
        email=data['email']
        password=data['password']

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error":"Username already exists"},status=400)
        user=User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        return JsonResponse({
            "messages":"Account created successfully",
            "username":user.username
        },status=201)
    except(KeyError,json.JSONDecodeError):
        return JsonResponse({
            "error":"Please provide username,email and password"
        },status=400)


@csrf_exempt
@require_POST
def login(request):
    try:
        data=json.loads(request.body)
        username=data['username']
        password=data['password']
    except(KeyError,json.JSONDecodeError):
        return JsonResponse({"error":"Username and password are required"},status=400)

    user=authenticate(
        request,
        username=username,
        password=password
    )
    if user is not None:
        auth_login(request,user)
        return JsonResponse({"message":"Login Successful","username":user.username})
    return JsonResponse({"error":"Invalid username or password"},status=401)

@login_required
@require_POST
def logout(request):
    auth_logout(request)
    return JsonResponse({
        "message": "Logout successful"
    })

@login_required
def current_user(request):
    user = request.user

    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email
    })
