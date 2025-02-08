from django.db import models
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import (
    Community, 
    GalleryImage, 
    ResourceCategory, 
    Resource, 
    ForumPost, 
    ForumComment, 
    Vote, 
    Reaction, 
    Question,
    Answer, 
    AnswerVote,
    QuestionVote,
    Poll,
    PollOption,
    PollVote,
    Announcement,
    RecommendedProduct,
    SavedImage,
    SavedResource,
    SavedProduct,
    SavedCollection,
    CommunityView,
    Profile,
    CustomUser
)
from .serializers import (
    CommunitySerializer, 
    UserSerializer, 
    GalleryImageSerializer,
    ResourceCategorySerializer,
    ResourceSerializer,
    ForumPostSerializer,
    ForumCommentSerializer,
    UserRegisterSerializer,
    QuestionSerializer,
    AnswerSerializer,
    PollSerializer,
    AnnouncementSerializer,
    RecommendedProductSerializer,
    SavedImageSerializer,
    SavedProductSerializer,
    SavedCollectionSerializer,
    SavedResourceSerializer,
    UserLoginSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import viewsets
from rest_framework.decorators import api_view, parser_classes, permission_classes, action
from django.core.files.storage import default_storage
from bs4 import BeautifulSoup
import requests
from django.http import JsonResponse
from urllib.parse import urljoin
from django.db.models import Sum
from django.db.models import F
from django.db.models import Count
from django.db import transaction
from django.db import models
import re
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from django.db.models import Q
import logging
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
import json

User = get_user_model()

logger = logging.getLogger(__name__)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'username': user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            identifier = request.data.get('identifier')  # This can be email or username
            password = request.data.get('password')

            # Try to find the user by email or username
            user = authenticate(
                username=identifier,  # Django's authenticate will try username first
                password=password
            )

            if not user:
                # If authentication with username failed, try with email
                try:
                    user_obj = User.objects.get(email=identifier)
                    user = authenticate(
                        username=user_obj.username,
                        password=password
                    )
                except User.DoesNotExist:
                    pass

            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                })
            
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        except Exception as e:
            print(f"Login error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("Registration attempt with data:", request.data)  # Debug print
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            if user:
                token, _ = Token.objects.get_or_create(user=user)
                return Response({
                    'token': token.key,
                    'user': {
                        'id': user.id,
                        'username': user.username
                    }
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
            return Response({
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username
                }
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

class CommunityListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        communities = Community.objects.all()
        serializer = CommunitySerializer(communities, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to create communities'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
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
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, pk=None):
        try:
            print("GET request received")
            print("Query params:", request.query_params)
            print("Community ID:", request.query_params.get('community_id'))
            
            if pk:
                category = ResourceCategory.objects.get(pk=pk)
                serializer = ResourceCategorySerializer(category)
                return Response(serializer.data)
            else:
                community_id = request.query_params.get('community_id')
                if not community_id:
                    return Response(
                        {"error": "community_id is required"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                print(f"Fetching collections for community_id: {community_id}")
                collections = ResourceCategory.objects.filter(community_id=community_id)
                print(f"Found {collections.count()} collections")
                
                serializer = ResourceCategorySerializer(collections, many=True)
                return Response(serializer.data)
                
        except Exception as e:
            print(f"Error in get: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        try:
            print("POST request received")
            print("Request data:", request.data)
            
            data = request.data.copy()
            data['created_by'] = request.user.id
            
            preview_image = request.FILES.get('preview_image')
            if 'preview_image' in data:
                del data['preview_image']
            
            print("Data being sent to serializer:", data)
            serializer = ResourceCategorySerializer(data=data)
            
            if serializer.is_valid():
                instance = serializer.save(created_by=request.user)
                
                if preview_image:
                    instance.preview_image = preview_image
                    instance.save()
                
                return Response(
                    ResourceCategorySerializer(instance).data, 
                    status=status.HTTP_201_CREATED
                )
            
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error in post: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, pk):
        try:
            category = ResourceCategory.objects.get(pk=pk)
            data = request.data.copy()
            
            # Handle the preview image
            preview_image = request.FILES.get('preview_image')
            if 'preview_image' in data:
                del data['preview_image']
                
            serializer = ResourceCategorySerializer(category, data=data, partial=True)
            if serializer.is_valid():
                instance = serializer.save()
                
                if preview_image:
                    instance.preview_image = preview_image
                    instance.save()
                    
                return Response(ResourceCategorySerializer(instance).data)
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except ResourceCategory.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in patch: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pk):
        try:
            collection = ResourceCategory.objects.get(pk=pk)
            
            # Optional: Add permission check
            if collection.created_by != request.user:
                return Response(
                    {"error": "You don't have permission to delete this collection"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            collection.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except ResourceCategory.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in delete: {str(e)}")
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
        resources_data = []

        for resource in resources:
            # Get vote counts
            upvotes = Vote.objects.filter(resource=resource, vote_type='up').count()
            downvotes = Vote.objects.filter(resource=resource, vote_type='down').count()
            total_votes = upvotes - downvotes

            # Get user's vote if exists
            user_vote = Vote.objects.filter(resource=resource, user=request.user).first()
            
            # Get base resource data
            resource_data = ResourceSerializer(resource).data
            # Add vote information
            resource_data['votes'] = total_votes
            resource_data['user_vote'] = user_vote.vote_type if user_vote else None
            
            resources_data.append(resource_data)

        return Response(resources_data)

    def post(self, request):
        serializer = ResourceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Get communities created by the user
        created_communities = Community.objects.filter(created_by=user)
        # Get communities the user is a member of
        joined_communities = user.communities.all()

        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'date_joined': user.date_joined,
            'communities': CommunitySerializer(joined_communities, many=True).data,
            'created_communities': CommunitySerializer(created_communities, many=True).data
        }
        
        return Response(data)

class ForumPostView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, community_id):
        try:
            print("Getting posts for community:", community_id)
            community = get_object_or_404(Community, id=community_id)
            posts = ForumPost.objects.filter(community=community).prefetch_related(
                'reactions',
                'comments',
                'comments__created_by',
                'created_by'
            ).order_by('-created_at')
            
            serializer = ForumPostSerializer(
                posts,
                many=True,
                context={'request': request}
            )
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in ForumPostView.get: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, community_id):
        try:
            print("Request DATA:", request.data)
            print("Request FILES:", request.FILES)
            
            community = get_object_or_404(Community, id=community_id)
            
            # Create mutable copy of request.data
            data = request.data.copy()
            
            # Add community ID to the data
            data['community'] = community_id
            
            # Ensure content is present
            if 'content' not in data:
                data['content'] = ''
            
            # Handle media file
            if 'media' in request.FILES:
                file = request.FILES['media']
                data['media'] = file
                
                # Set media type based on file content type
                if file.content_type.startswith('image/'):
                    data['media_type'] = 'image'
                elif file.content_type.startswith('video/'):
                    data['media_type'] = 'video'
                else:
                    data['media_type'] = 'none'
            else:
                data['media_type'] = 'none'
            
            print("Processed data:", data)
            
            serializer = ForumPostSerializer(
                data=data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                post = serializer.save(
                    created_by=request.user,
                    community=community
                )
                return Response(
                    ForumPostSerializer(post, context={'request': request}).data,
                    status=status.HTTP_201_CREATED
                )
            
            print("Serializer errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"Error in ForumPostView.post: {str(e)}")
            return Response(
                {'error': str(e)},
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

class CommunityMembershipView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, community_id):
        try:
            community = get_object_or_404(Community, id=community_id)
            action = request.data.get('action')
            
            if action == 'join':
                community.members.add(request.user)
                return Response({'status': 'joined'}, status=status.HTTP_200_OK)
            elif action == 'leave':
                community.members.remove(request.user)
                return Response({'status': 'left'}, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': 'Invalid action'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def get(self, request, community_id):
        try:
            community = get_object_or_404(Community, id=community_id)
            is_member = community.members.filter(id=request.user.id).exists()
            return Response({'is_member': is_member})
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

def get_page_preview(request):
    url = request.GET.get('url')
    if not url:
        return JsonResponse({'error': 'URL parameter is required'}, status=400)
        
    try:
        # Add more headers to mimic a real browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'max-age=0',
        }
        
        response = requests.get(url, headers=headers, timeout=10, verify=False)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try multiple methods to find image
        image_url = None
        
        # Method 1: OpenGraph
        if not image_url:
            og_image = soup.find('meta', property='og:image')
            if og_image:
                image_url = og_image.get('content')
        
        # Method 2: Twitter Card
        if not image_url:
            twitter_image = soup.find('meta', property='twitter:image')
            if twitter_image:
                image_url = twitter_image.get('content')
        
        # Method 3: Schema.org
        if not image_url:
            schema = soup.find('script', type='application/ld+json')
            if schema:
                try:
                    data = json.loads(schema.string)
                    image_url = data.get('image')
                except:
                    pass
        
        # Method 4: First large image
        if not image_url:
            images = soup.find_all('img')
            for img in images:
                src = img.get('src')
                if src and (src.endswith('.jpg') or src.endswith('.png')):
                    image_url = src
                    break
        
        if image_url:
            # Ensure absolute URL
            image_url = urljoin(url, image_url)
            
        return JsonResponse({'image': image_url})
        
    except Exception as e:
        print(f"Error fetching preview for {url}: {str(e)}")
        return JsonResponse({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def vote_resource(request, resource_id):
    try:
        resource = Resource.objects.get(id=resource_id)
        vote_type = request.data.get('vote_type')
        
        if vote_type not in ['up', 'down']:
            return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if user has already voted
        vote = Vote.objects.filter(resource=resource, user=request.user).first()

        if vote:
            if vote.vote_type == vote_type:
                # Remove vote if clicking same button
                vote.delete()
            else:
                # Change vote if clicking different button
                vote.vote_type = vote_type
                vote.save()
        else:
            # Create new vote
            Vote.objects.create(
                resource=resource,
                user=request.user,
                vote_type=vote_type
            )

        # Calculate total votes
        upvotes = Vote.objects.filter(resource=resource, vote_type='up').count()
        downvotes = Vote.objects.filter(resource=resource, vote_type='down').count()
        total_votes = upvotes - downvotes

        return Response({
            'votes': total_votes,
            'user_vote': vote_type if vote_type else None
        })

    except Resource.DoesNotExist:
        return Response({'error': 'Resource not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_resources(request):
    category_id = request.query_params.get('category_id')
    resources = Resource.objects.filter(category_id=category_id)
    resources_data = []

    for resource in resources:
        # Get vote counts
        upvotes = Vote.objects.filter(resource=resource, vote_type='up').count()
        downvotes = Vote.objects.filter(resource=resource, vote_type='down').count()
        total_votes = upvotes - downvotes

        # Get user's vote if exists
        user_vote = Vote.objects.filter(resource=resource, user=request.user).first()
        
        resource_data = ResourceSerializer(resource).data
        resource_data['votes'] = total_votes
        resource_data['user_vote'] = user_vote.vote_type if user_vote else None
        
        resources_data.append(resource_data)

    return Response(resources_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_collection_stats(request, category_id):
    try:
        resources = Resource.objects.filter(category_id=category_id)
        total_resources = resources.count()
        total_views = resources.aggregate(Sum('views'))['views__sum'] or 0

        # Get total number of vote actions (both up and down)
        total_votes = Vote.objects.filter(resource__category_id=category_id).count()
        
        return Response({
            'total_resources': total_resources,
            'total_views': total_views,
            'total_votes': total_votes  # This will now be the total number of vote actions
        })
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def increment_views(request, resource_id):
    try:
        resource = Resource.objects.get(id=resource_id)
        resource.views = F('views') + 1  # Use F() to avoid race conditions
        resource.save()
        return Response({'views': resource.views})
    except Resource.DoesNotExist:
        return Response({'error': 'Resource not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def increment_category_views(request, category_id):
    try:
        category = ResourceCategory.objects.get(id=category_id)
        # Instead of returning the expression directly, evaluate it first
        category.views = F('views') + 1
        category.save()
        
        # Refresh from database to get the actual value
        category.refresh_from_db()
        
        return Response({
            'views': category.views,
            'message': 'View count updated successfully'
        })
    except ResourceCategory.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

class PostReactionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        try:
            post = get_object_or_404(ForumPost, id=post_id)
            reaction_type = request.data.get('reaction_type')
            
            if reaction_type not in dict(Reaction.REACTION_TYPES):
                return Response(
                    {'error': 'Invalid reaction type'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Toggle reaction
            reaction, created = Reaction.objects.get_or_create(
                post=post,
                user=request.user,
                reaction_type=reaction_type
            )
            
            if not created:
                reaction.delete()
                action = 'removed'
            else:
                action = 'added'
            
            serializer = ForumPostSerializer(
                post,
                context={'request': request}
            )
            return Response({
                'post': serializer.data,
                'action': action
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class QuestionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, community_id):
        questions = Question.objects.filter(community_id=community_id)
        # Annotate questions with vote count and order by votes
        questions = questions.annotate(
            vote_count=models.Count('question_votes')
        ).order_by('-vote_count', '-created_at')
        
        serializer = QuestionSerializer(questions, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, community_id):
        try:
            # Only include necessary fields
            data = {
                'content': request.data.get('content'),
                'media': request.data.get('media'),
                'community': community_id
            }
            
            serializer = QuestionSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                question = serializer.save(
                    created_by=request.user,
                    community_id=community_id
                )
                return Response(
                    QuestionSerializer(question, context={'request': request}).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        try:
            question = get_object_or_404(Question, id=question_id)
            data = request.data.copy()
            data['question'] = question_id
            
            serializer = AnswerSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                answer = serializer.save(
                    created_by=request.user,
                    question=question
                )
                return Response(
                    AnswerSerializer(answer, context={'request': request}).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AnswerVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, answer_id):
        try:
            answer = get_object_or_404(Answer, id=answer_id)
            vote_type = request.data.get('vote_type')
            
            if vote_type not in dict(Vote.VOTE_TYPES):
                return Response(
                    {'error': 'Invalid vote type'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            vote, created = AnswerVote.objects.get_or_create(
                answer=answer,
                user=request.user,
                defaults={'vote_type': vote_type}
            )

            if not created:
                if vote.vote_type == vote_type:
                    vote.delete()
                else:
                    vote.vote_type = vote_type
                    vote.save()

            # Recalculate total votes
            upvotes = AnswerVote.objects.filter(answer=answer, vote_type='up').count()
            downvotes = AnswerVote.objects.filter(answer=answer, vote_type='down').count()
            answer.votes = upvotes - downvotes
            answer.save()

            return Response({
                'votes': answer.votes,
                'user_vote': vote_type if vote_type else None
            })

        except Answer.DoesNotExist:
            return Response({'error': 'Answer not found'}, status=status.HTTP_404_NOT_FOUND)

class QuestionVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, question_id):
        try:
            question = get_object_or_404(Question, id=question_id)
            vote_type = request.data.get('vote_type')
            
            if vote_type not in dict(Vote.VOTE_TYPES):
                return Response(
                    {'error': 'Invalid vote type'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            vote, created = QuestionVote.objects.get_or_create(
                question=question,
                user=request.user,
                defaults={'vote_type': vote_type}
            )

            if not created:
                if vote.vote_type == vote_type:
                    vote.delete()
                else:
                    vote.vote_type = vote_type
                    vote.save()

            # Recalculate total votes
            upvotes = QuestionVote.objects.filter(question=question, vote_type='up').count()
            downvotes = QuestionVote.objects.filter(question=question, vote_type='down').count()
            total_votes = upvotes - downvotes

            return Response({
                'votes': total_votes,
                'user_vote': vote_type if vote_type else None
            })

        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=status.HTTP_404_NOT_FOUND)

class PollView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, community_id):
        polls = Poll.objects.filter(community_id=community_id)
        serializer = PollSerializer(polls, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, community_id):
        try:
            with transaction.atomic():
                # Create poll
                poll = Poll.objects.create(
                    question=request.data.get('question'),
                    created_by=request.user,
                    community_id=community_id
                )

                # Create options
                options_data = request.data.get('options', [])
                for option_text in options_data:
                    if option_text.strip():  # Only create non-empty options
                        PollOption.objects.create(
                            poll=poll,
                            text=option_text
                        )

                serializer = PollSerializer(poll, context={'request': request})
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PollVoteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, option_id):
        try:
            option = get_object_or_404(PollOption, id=option_id)
            
            # Remove any existing votes by this user for this poll
            PollVote.objects.filter(
                user=request.user,
                option__poll=option.poll
            ).delete()
            
            # Create new vote
            PollVote.objects.create(
                user=request.user,
                option=option
            )
            
            # Return updated poll data
            serializer = PollSerializer(option.poll, context={'request': request})
            return Response(serializer.data)
            
        except PollOption.DoesNotExist:
            return Response(
                {'error': 'Option not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class AnnouncementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, community_id):
        try:
            announcements = Announcement.objects.filter(community_id=community_id)
            serializer = AnnouncementSerializer(announcements, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, community_id):
        try:
            community = get_object_or_404(Community, id=community_id)
            
            # Check if user is creator - using created_by instead of creator
            if community.created_by != request.user:
                return Response(
                    {'error': 'Only community creator can post announcements'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            data = {
                'content': request.data.get('content'),
                'community': community.id
            }
            
            serializer = AnnouncementSerializer(data=data)
            if serializer.is_valid():
                announcement = serializer.save(
                    created_by=request.user,
                    community=community
                )
                return Response(
                    AnnouncementSerializer(announcement).data,
                    status=status.HTTP_201_CREATED
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def recommended_products(request, community_id):
    if request.method == 'GET':
        catalogue = request.GET.get('catalogue', '')
        products = RecommendedProduct.objects.filter(community_id=community_id)
        if catalogue and catalogue != 'all':
            products = products.filter(catalogue_name=catalogue)
        serializer = RecommendedProductSerializer(products, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        print("Received data:", request.data)  # Add this line to debug
        data = {
            'title': request.data.get('title'),
            'url': request.data.get('url'),
            'comment': request.data.get('comment'),
            'catalogue_name': request.data.get('catalogue_name'),
            'community': community_id,
            'created_by': request.user.id
        }
        print("Processed data:", data)  # Add this line to debug
        serializer = RecommendedProductSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("Validation errors:", serializer.errors)  # Add this line to debug
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_url_preview(request):
    url = request.GET.get('url')
    if not url:
        return Response({'error': 'URL is required'}, status=400)
    
    try:
        # Send request with headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try to find image in this order:
        # 1. OpenGraph image
        # 2. Twitter image
        # 3. First meaningful image in the content
        image_url = None
        
        # Check OpenGraph
        og_image = soup.find('meta', property='og:image')
        if og_image:
            image_url = og_image.get('content')
            
        # Check Twitter
        if not image_url:
            twitter_image = soup.find('meta', property='twitter:image')
            if twitter_image:
                image_url = twitter_image.get('content')
        
        # Try regular image
        if not image_url:
            img_tag = soup.find('img')
            if img_tag:
                image_url = img_tag.get('src')
                if image_url:
                    image_url = urljoin(url, image_url)
        
        return Response({
            'image_url': image_url
        })
        
    except Exception as e:
        print(f"Error fetching preview: {str(e)}")
        return Response({'error': 'Failed to fetch preview'}, status=400)

class SavedItemsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='save_image', url_name='save_image')
    def save_image(self, request, pk=None):
        try:
            print(f"Attempting to save image with ID: {pk}")
            image = GalleryImage.objects.get(pk=pk)
            saved_image, created = SavedImage.objects.get_or_create(
                user=request.user,
                image=image
            )
            if created:
                print(f"Saved image {pk} for user {request.user}")
                return Response({'status': 'saved'})
            else:
                saved_image.delete()
                print(f"Unsaved image {pk} for user {request.user}")
                return Response({'status': 'unsaved'})
        except GalleryImage.DoesNotExist:
            print(f"Image {pk} not found")
            return Response(
                {'error': 'Image not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def images(self, request):
        """
        Get all saved images. URL pattern: /api/saved/images/
        """
        saved_images = SavedImage.objects.filter(user=request.user)
        serializer = SavedImageSerializer(saved_images, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='save_product', url_name='save_product')
    def save_product(self, request, pk=None):
        try:
            print(f"Attempting to save product with ID: {pk}")
            product = RecommendedProduct.objects.get(pk=pk)
            saved_product, created = SavedProduct.objects.get_or_create(
                user=request.user,
                product=product
            )
            if created:
                print(f"Saved product {pk} for user {request.user}")
                return Response({'status': 'saved'})
            else:
                saved_product.delete()
                print(f"Unsaved product {pk} for user {request.user}")
                return Response({'status': 'unsaved'})
        except RecommendedProduct.DoesNotExist:
            print(f"Product {pk} not found")
            return Response(
                {'error': 'Product not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def products(self, request):
        try:
            saved_products = SavedProduct.objects.filter(user=request.user).order_by('-saved_at')
            print(f"Found {saved_products.count()} saved products")  # Debug print
            serializer = SavedProductSerializer(saved_products, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching saved products: {str(e)}")  # Debug print
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='save_collection', url_name='save_collection')
    def save_collection(self, request, pk=None):
        try:
            print(f"Attempting to save collection with ID: {pk}")
            collection = ResourceCategory.objects.get(pk=pk)
            saved_collection, created = SavedCollection.objects.get_or_create(
                user=request.user,
                collection=collection
            )
            if created:
                print(f"Saved collection {pk} for user {request.user}")
                return Response({'status': 'saved'})
            else:
                saved_collection.delete()
                print(f"Unsaved collection {pk} for user {request.user}")
                return Response({'status': 'unsaved'})
        except ResourceCategory.DoesNotExist:
            print(f"Collection {pk} not found")
            return Response(
                {'error': 'Collection not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def collections(self, request):
        try:
            saved_collections = SavedCollection.objects.filter(user=request.user).select_related(
                'collection',
                'collection__community'
            )
            print(f"Found {saved_collections.count()} saved collections")
            for collection in saved_collections:
                print(f"Collection {collection.id} preview image: {collection.collection.preview_image}")
            serializer = SavedCollectionSerializer(saved_collections, many=True)
            print("Serialized data:", serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in collections view: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], url_path='save_resource', url_name='save_resource')
    def save_resource(self, request, pk=None):
        try:
            print(f"Attempting to save resource with ID: {pk}")
            resource = Resource.objects.get(pk=pk)
            saved_resource, created = SavedResource.objects.get_or_create(
                user=request.user,
                resource=resource
            )
            if created:
                print(f"Saved resource {pk} for user {request.user}")
                return Response({'status': 'saved'})
            else:
                saved_resource.delete()
                print(f"Unsaved resource {pk} for user {request.user}")
                return Response({'status': 'unsaved'})
        except Resource.DoesNotExist:
            print(f"Resource {pk} not found")
            return Response(
                {'error': 'Resource not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'])
    def resources(self, request):
        try:
            saved_resources = SavedResource.objects.filter(user=request.user).select_related(
                'resource',
                'resource__category',
                'resource__category__community'
            )
            print(f"Found {saved_resources.count()} saved resources")
            serializer = SavedResourceSerializer(saved_resources, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in resources view: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CommunityViewTracker(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, community_id):
        print(f"Received view tracking request for community {community_id}")
        print(f"Request user: {request.user}")
        print(f"Request data: {request.data}")
        
        try:
            community = get_object_or_404(Community, id=community_id)
            print(f"Found community: {community}")
            
            # Try to get existing view or create new one
            view, created = CommunityView.objects.get_or_create(
                community=community,
                user=request.user,
                defaults={'viewed_at': timezone.now()}
            )
            print(f"View {'created' if created else 'updated'}")
            
            if not created:
                # Update the viewed_at timestamp
                view.viewed_at = timezone.now()
                view.save()
                print("Updated timestamp")
            
            return Response({'status': 'view recorded'}, status=status.HTTP_200_OK)
            
        except Community.DoesNotExist:
            print(f"Community {community_id} not found")
            return Response(
                {'error': f'Community {community_id} not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"Error type: {type(e)}")
            print(f"Error message: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RecommendedCommunitiesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            print(f"Finding recommendations for user: {user.username}")
            
            # Get communities the user is a member of
            user_communities = Community.objects.filter(members=user)
            print(f"User communities count: {user_communities.count()}")
            
            # If user has no communities, recommend trending ones
            if not user_communities.exists():
                print("No user communities found, getting trending ones")
                recommended = Community.objects.annotate(
                    recent_views=Count('views', filter=Q(
                        views__viewed_at__gte=timezone.now() - timedelta(days=30)
                    )),
                    member_count=Count('members')
                ).order_by('-recent_views', '-member_count')[:5]
            else:
                print("User has communities, finding similar ones based on content")
                # Get content-based recommendations
                user_community_names = user_communities.values_list('name', flat=True)
                user_community_descriptions = user_communities.values_list('description', flat=True)
                
                # Combine all words from user's communities
                all_words = ' '.join(list(user_community_names) + list(user_community_descriptions)).lower()
                words_list = [word for word in all_words.split() if len(word) > 3]  # Filter out short words
                
                # Find communities with similar content
                similar_communities = Community.objects.exclude(members=user)
                
                # Build Q objects for each significant word
                q_objects = Q()
                for word in set(words_list):  # Using set to avoid duplicate words
                    q_objects |= Q(name__icontains=word) | Q(description__icontains=word)
                
                recommended = similar_communities.filter(q_objects).annotate(
                    match_count=Count('id'),  # Count how many words match
                    member_count=Count('members')
                ).order_by('-match_count', '-member_count')[:5]
                
                print(f"Found {recommended.count()} content-based recommendations")
            
            serializer = CommunitySerializer(recommended, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Error in recommendations: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class CommunityMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, community_id):
        try:
            community = get_object_or_404(Community, id=community_id)
            creator = community.created_by
            members = community.members.all()
            
            response_data = {
                'creator': {
                    'id': creator.id,
                    'username': creator.username,
                    'avatar': creator.profile.avatar.url if hasattr(creator, 'profile') and creator.profile.avatar else None,
                },
                'members': [{
                    'id': member.id,
                    'username': member.username,
                    'avatar': member.profile.avatar.url if hasattr(member, 'profile') and member.profile.avatar else None,
                    'date_joined': member.date_joined
                } for member in members]
            }
            return Response(response_data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            profile = user.profile
            return Response({
                'username': user.username,
                'email': user.email,
                'date_joined': user.date_joined,
                'avatar': profile.avatar.url if profile.avatar else None,
                'bio': profile.bio
            })
        except Exception as e:
            logger.error(f"Error getting profile: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def patch(self, request):
        try:
            profile = request.user.profile
            
            # Debug logging
            logger.info(f"Received data: {request.data}")
            
            if 'bio' in request.data:
                profile.bio = request.data['bio']
                logger.info(f"Updating bio to: {request.data['bio']}")
            
            if 'avatar' in request.FILES:
                profile.avatar = request.FILES['avatar']
                logger.info("Updating avatar")
            
            profile.save()
            
            return Response({
                'username': request.user.username,
                'email': request.user.email,
                'date_joined': request.user.date_joined,
                'avatar': profile.avatar.url if profile.avatar else None,
                'bio': profile.bio
            })
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class PasswordResetView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        print(f"DEBUG: Received password reset request for email: {email}")  # Add this line
        
        try:
            user = User.objects.get(email=email)
            print(f"DEBUG: Found user: {user.username}")  # Add this line
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{user.id}/{token}"
            
            print(f"DEBUG: Reset URL generated: {reset_url}")  # Add this line
            print(f"DEBUG: Email settings - HOST:{settings.EMAIL_HOST}, PORT:{settings.EMAIL_PORT}, USER:{settings.EMAIL_HOST_USER}")  # Add this line
            
            try:
                send_mail(
                    'Password Reset Request',
                    f'Click the following link to reset your password: {reset_url}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                print("DEBUG: Email sent successfully")  # Add this line
                return Response({'message': 'Password reset email sent'})
            except Exception as mail_error:
                print(f"DEBUG: Email error: {str(mail_error)}")  # Add this line
                return Response(
                    {'error': f'Failed to send email: {str(mail_error)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except User.DoesNotExist:
            print(f"DEBUG: No user found with email: {email}")  # Add this line
            return Response(
                {'error': 'No user found with this email address'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            print(f"DEBUG: Unexpected error: {str(e)}")  # Add this line
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, user_id, token):
        try:
            user = User.objects.get(id=user_id)
            if default_token_generator.check_token(user, token):
                password = request.data.get('password')
                user.set_password(password)
                user.save()
                return Response({'message': 'Password reset successful'})
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
