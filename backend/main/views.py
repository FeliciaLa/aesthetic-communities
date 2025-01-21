from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import Community, GalleryImage, ResourceCategory, Resource
from .serializers import (
    CommunitySerializer, 
    UserSerializer, 
    GalleryImageSerializer,
    ResourceCategorySerializer,
    ResourceSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            serializer = UserSerializer(user)
            return Response({
                'token': token.key,
                'user': serializer.data
            })
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )

class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)

class CommunityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        communities = Community.objects.all()
        serializer = CommunitySerializer(communities, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CommunitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommunityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        community = get_object_or_404(Community, pk=pk)
        serializer = CommunitySerializer(community)
        return Response(serializer.data)

class GalleryImageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, community_id):
        try:
            community = get_object_or_404(Community, id=community_id)
            images = GalleryImage.objects.filter(community=community)
            serializer = GalleryImageSerializer(images, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in get: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, community_id):
        try:
            print("Request data:", request.data)  # Debug log
            print("User:", request.user)  # Debug log
            
            community = get_object_or_404(Community, id=community_id)
            
            # Create a new GalleryImage instance
            gallery_image = GalleryImage(
                community=community,
                uploaded_by=request.user,
                image=request.data.get('image')
            )
            gallery_image.save()
            
            serializer = GalleryImageSerializer(gallery_image)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error in post: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ResourceCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        community_id = request.query_params.get('community_id')
        if not community_id:
            return Response(
                {'error': 'community_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        categories = ResourceCategory.objects.filter(community_id=community_id)
        serializer = ResourceCategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ResourceCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResourceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response(
                {'error': 'category_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        resources = Resource.objects.filter(category_id=category_id)
        serializer = ResourceSerializer(resources, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ResourceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
