from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from .models import Community, GalleryImage, ResourceCategory, Resource
from .serializers import CommunitySerializer, GalleryImageSerializer, ResourceCategorySerializer, ResourceSerializer, UserSerializer
from rest_framework.authtoken.views import ObtainAuthToken
from django.core.files.storage import default_storage
import traceback
import logging

logger = logging.getLogger(__name__)

# Other views here, but no authentication views for now

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'email': user.email
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email
            })
        except Exception as e:
            print(f"Error in profile view: {str(e)}")  # Debug log
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ListCommunitiesView(APIView):
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

class CommunityCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CommunitySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CommunityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, community_id):
        try:
            community = Community.objects.get(id=community_id)
            serializer = CommunitySerializer(community, context={'request': request})
            return Response(serializer.data)
        except Community.DoesNotExist:
            return Response(
                {'error': 'Community not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class CommunityGalleryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, community_id):
        try:
            print(f"Fetching gallery for community {community_id}")
            community = Community.objects.get(id=community_id)
            print(f"Found community: {community}")
            
            gallery_images = GalleryImage.objects.filter(community=community)
            print(f"Found {gallery_images.count()} images")
            
            serializer = GalleryImageSerializer(gallery_images, many=True, context={'request': request})
            print("Serialized data:", serializer.data)
            
            return Response(serializer.data)
            
        except Community.DoesNotExist:
            return Response(
                {'error': 'Community not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in gallery view: {str(e)}")
            print(traceback.format_exc())  # Add full traceback
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, community_id):
        try:
            community = Community.objects.get(id=community_id)
            
            if 'image' not in request.FILES:
                return Response(
                    {'error': 'No image file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            gallery_image = GalleryImage.objects.create(
                community=community,
                uploaded_by=request.user,
                image=request.FILES['image']
            )

            serializer = GalleryImageSerializer(gallery_image)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Community.DoesNotExist:
            return Response(
                {'error': 'Community not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error uploading image: {str(e)}")  # Debug log
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ResourceCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = ResourceCategory.objects.all()
        serializer = ResourceCategorySerializer(categories, many=True)
        return Response(serializer.data)

class ResourceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        resources = Resource.objects.all()
        serializer = ResourceSerializer(resources, many=True)
        return Response(serializer.data)

class CreatePostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, community_id):
        try:
            community = Community.objects.get(id=community_id)
            serializer = PostSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    author=request.user,
                    community=community
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Community.DoesNotExist:
            return Response(
                {'error': 'Community not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class PostDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
            serializer = PostSerializer(post)
            return Response(serializer.data)
        except Post.DoesNotExist:
            return Response(
                {'error': 'Post not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class CreateCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = Post.objects.get(id=post_id)
            serializer = CommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(
                    author=request.user,
                    post=post
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Post.DoesNotExist:
            return Response(
                {'error': 'Post not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"message": "Successfully logged out."})

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                         context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email
        })
