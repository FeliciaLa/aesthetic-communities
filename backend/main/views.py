from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import Community, GalleryImage, ResourceCategory, Resource, ForumPost, ForumComment
from .serializers import (
    CommunitySerializer, 
    UserSerializer, 
    GalleryImageSerializer,
    ResourceCategorySerializer,
    ResourceSerializer,
    ForumPostSerializer,
    ForumCommentSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets
from rest_framework.decorators import api_view, parser_classes
from django.core.files.storage import default_storage

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
        try:
            community = get_object_or_404(Community, id=pk)
            serializer = CommunitySerializer(community, context={'request': request})
            return Response(serializer.data)
        except Community.DoesNotExist:
            return Response(
                {'error': 'Community not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class CommunityUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, community_id):
        try:
            # Get the community
            community = get_object_or_404(Community, id=community_id)
            
            # Debug prints
            print(f"Request user: {request.user}")
            print(f"Community creator: {community.created_by}")
            print(f"Is creator: {community.created_by == request.user}")
            
            # Check if user is the creator
            if request.user != community.created_by:
                return Response(
                    {'error': 'Only the creator can update the community'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update fields
            if 'name' in request.data:
                community.name = request.data['name']
            if 'description' in request.data:
                community.description = request.data['description']
            
            community.save()
            
            # Return updated community data
            serializer = CommunitySerializer(community)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error in update: {str(e)}")  # Debug print
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

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

class GalleryImageDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, community_id, image_id):
        try:
            print(f"Attempting to delete image {image_id} from community {community_id}")
            community = get_object_or_404(Community, id=community_id)
            image = get_object_or_404(GalleryImage, id=image_id, community=community)
            
            # Check if user is authorized to delete
            if request.user == image.uploaded_by or request.user == community.created_by:
                # Delete the image file from storage
                if image.image:
                    try:
                        default_storage.delete(image.image.path)
                    except Exception as e:
                        print(f"Error deleting file: {e}")
                
                # Delete the database record
                image.delete()
                print(f"Successfully deleted image {image_id}")
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                print(f"User {request.user} not authorized to delete image {image_id}")
                return Response(
                    {'error': 'Not authorized to delete this image'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            print(f"Error deleting image: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ResourceCategoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        categories = ResourceCategory.objects.filter(community_id=request.query_params.get('community_id'))
        serializer = ResourceCategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        try:
            print("Received data:", request.data)  # Debug print
            
            # Create a new data dictionary with all required fields
            data = request.data.copy()
            data['created_by'] = request.user.id  # Add the user ID explicitly
            
            print("Processing data:", data)  # Debug print
            
            serializer = ResourceCategorySerializer(data=data)
            if serializer.is_valid():
                # Pass the user directly to save method
                category = serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            print("Validation errors:", serializer.errors)  # Debug print
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

class ForumPostView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, community_id):
        try:
            # First check if the community exists
            community = get_object_or_404(Community, id=community_id)
            
            # Get all posts for this community
            posts = ForumPost.objects.filter(community=community)
            
            # Serialize the data
            serializer = ForumPostSerializer(posts, many=True)
            return Response(serializer.data)
            
        except Community.DoesNotExist:
            return Response(
                {'error': 'Community not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in ForumPostView.get: {str(e)}")  # Debug print
            return Response(
                {'error': 'Internal server error', 'details': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, community_id):
        try:
            # First check if the community exists
            community = get_object_or_404(Community, id=community_id)
            
            # Prepare the data
            data = {
                'title': request.data.get('title'),
                'content': request.data.get('content'),
                'community': community.id
            }
            
            serializer = ForumPostSerializer(data=data)
            if serializer.is_valid():
                serializer.save(created_by=request.user, community=community)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Community.DoesNotExist:
            return Response(
                {'error': 'Community not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error in ForumPostView.post: {str(e)}")  # Debug print
            return Response(
                {'error': 'Internal server error', 'details': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ForumCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(ForumPost, id=post_id)
        data = {
            'content': request.data.get('content'),
            'post': post_id
        }
        serializer = ForumCommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResourceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ResourceCategory.objects.all()
    serializer_class = ResourceCategorySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

@api_view(['PUT'])
@parser_classes([MultiPartParser, FormParser])
def update_community_banner(request, community_id):
    try:
        community = get_object_or_404(Community, id=community_id)
        
        # Check if user is the creator
        if request.user != community.created_by:
            return Response(
                {'error': 'Only the creator can update the banner'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if 'banner_image' not in request.FILES:
            return Response(
                {'error': 'No image provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Handle the banner image upload
        banner_image = request.FILES['banner_image']
        
        # Delete old banner if it exists
        if community.banner_image:
            try:
                default_storage.delete(community.banner_image.path)
            except Exception:
                pass  # If old file doesn't exist, continue
        
        # Save new banner
        community.banner_image = banner_image
        community.save()
        
        serializer = CommunitySerializer(community)
        return Response(serializer.data)
            
    except Exception as e:
        print(f"Error in update_community_banner: {str(e)}")  # Add debugging
        return Response(
            {'error': 'Failed to update banner'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
