from django.db import models
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from .serializers import UserRegistrationSerializer  
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
    UserRegistrationSerializer,
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
import os
from django.http import HttpResponse
import uuid

User = get_user_model()

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    logger.info("Health check endpoint called")
    return Response({
        'status': 'healthy'
    }, status=status.HTTP_200_OK)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                print("DEBUG: Starting registration process")
                registration_id = str(uuid.uuid4())
                email = serializer.validated_data['email']
                
                # Store validated data in cache with all required fields
                cache_data = {
                    'username': serializer.validated_data['username'],
                    'email': serializer.validated_data['email'],
                    'password': serializer.validated_data['password']
                }
                
                # Store in cache with longer timeout
                cache.set(
                    f'registration_{registration_id}',
                    cache_data,
                    timeout=60 * 60 * 24  # 24 hours
                )
                print(f"DEBUG: Stored registration data in cache for {email}")
                
                # Generate the activation URL
                activation_url = f"{settings.FRONTEND_URL}/auth/activate/{registration_id}"
                
                # Send email
                try:
                    email_subject = 'Activate Your Almas Account'
                    email_message = f'''
                    Hello!

                    Thank you for registering with Almas. To activate your account, please click the link below:

                    {activation_url}

                    If you did not request this registration, please ignore this email.

                    Best regards,
                    The Almas Team
                    '''
                    
                    send_mail(
                        subject=email_subject,
                        message=email_message,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[email],
                        fail_silently=False,
                    )
                    print(f"DEBUG: Email sent successfully to {email}")
                    
                except Exception as mail_error:
                    print(f"DEBUG: Email sending failed - {str(mail_error)}")
                    cache.delete(f'registration_{registration_id}')
                    return Response({
                        'error': f'Failed to send activation email: {str(mail_error)}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
                return Response({
                    'message': 'Registration successful. Please check your email to activate your account.'
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                print(f"DEBUG: Registration failed - {str(e)}")
                return Response({
                    'error': f'Registration failed: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        print(f"DEBUG: Validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            
            logger.info(f"Login attempt for user: {username}")
            
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
            else:
                logger.warning(f"Failed login attempt for user: {username}")
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)

class CommunityListView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        try:
            communities = Community.objects.all()
            
            # Get sort parameter from query
            sort_by = request.query_params.get('view', 'alphabetical')
            
            if sort_by == 'alphabetical':
                communities = communities.order_by('name')
            elif sort_by == 'trending':
                communities = communities.annotate(
                    member_count=Count('members')
                ).order_by('-member_count')
            elif sort_by == 'newest':
                communities = communities.order_by('-created_at')
            elif sort_by == 'oldest':
                communities = communities.order_by('created_at')
            elif sort_by == 'biggest':
                communities = communities.annotate(
                    member_count=Count('members')
                ).order_by('-member_count')
            elif sort_by == 'smallest':
                communities = communities.annotate(
                    member_count=Count('members')
                ).order_by('member_count')
            
            serializer = CommunitySerializer(
                communities, 
                many=True,
                context={'request': request}
            )
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        try:
            print("Received data:", request.data)  # Debug print
            print("Received files:", request.FILES)  # Debug print
            
            serializer = CommunitySerializer(
                data=request.data,
                context={'request': request}
            )
            if serializer.is_valid():
                community = serializer.save(created_by=request.user)
                return Response(
                    CommunitySerializer(community, context={'request': request}).data,
                    status=status.HTTP_201_CREATED
                )
            print("Serializer errors:", serializer.errors)  # Debug print
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print("Error creating community:", str(e))  # Debug print
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CommunityDetailView(APIView):
    permission_classes = [AllowAny]

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
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, pk):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            community = get_object_or_404(Community, id=pk)
            if request.user != community.created_by:
                return Response(
                    {'error': 'Only creator can update community'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = CommunitySerializer(
                community, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CommunityUpdateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, community_id):
        try:
            community = get_object_or_404(Community, id=community_id)
            serializer = CommunitySerializer(community, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, community_id):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to update community'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        try:
            community = get_object_or_404(Community, id=community_id)
            
            # Check if user is the creator
            if request.user != community.created_by:
                return Response(
                    {'error': 'Only creator can update community'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = CommunitySerializer(
                community, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GalleryImageView(APIView):
    permission_classes = [AllowAny]
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
        # Check authentication for posting
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to upload images'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            community = get_object_or_404(Community, id=community_id)
            
            # Check if user is the creator
            if request.user != community.created_by:
                return Response(
                    {'error': 'Only the community creator can upload images'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
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
    permission_classes = [AllowAny]

    def get(self, request, pk=None):
        try:
            if pk:
                category = get_object_or_404(ResourceCategory, id=pk)
                serializer = ResourceCategorySerializer(category)
            else:
                # Get community_id from query params
                community_id = request.query_params.get('community_id')
                if community_id:
                    categories = ResourceCategory.objects.filter(community_id=community_id)
                else:
                    categories = ResourceCategory.objects.all()
                serializer = ResourceCategorySerializer(categories, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to create categories'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            serializer = ResourceCategorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
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
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            category_id = request.query_params.get('category')
            community_id = request.query_params.get('community')
            
            # Start with all resources
            resources = Resource.objects.all()
            
            # Filter by community_id if provided
            if community_id:
                # Get all categories in this community
                community_categories = ResourceCategory.objects.filter(community_id=community_id)
                # Filter resources by these categories
                resources = resources.filter(category__in=community_categories)
            
            # Additional category filter if provided
            if category_id:
                resources = resources.filter(category_id=category_id)
                
            serializer = ResourceSerializer(resources, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to add resources'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            serializer = ResourceSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

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
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, community_id):
        try:
            posts = ForumPost.objects.filter(community_id=community_id).order_by('-created_at')
            serializer = ForumPostSerializer(posts, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching posts: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, community_id):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to create posts'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            data = request.data.copy()
            data['community'] = community_id
            serializer = ForumPostSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error creating post: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ForumCommentView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, post_id):
        try:
            comments = ForumComment.objects.filter(post_id=post_id).order_by('created_at')
            serializer = ForumCommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching comments: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, post_id):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to post comments'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        try:
            post = get_object_or_404(ForumPost, id=post_id)
            serializer = ForumCommentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(post=post, created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
    permission_classes = [AllowAny]

    def get(self, request, post_id):
        try:
            reactions = Reaction.objects.filter(post_id=post_id)
            return Response({
                'reactions': reactions.values('reaction_type').annotate(count=Count('id'))
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, post_id):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to react to posts'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
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
    permission_classes = [AllowAny]

    def get(self, request, community_id):
        questions = Question.objects.filter(community_id=community_id)
        # Annotate questions with vote count and order by votes
        questions = questions.annotate(
            vote_count=models.Count('question_votes')
        ).order_by('-vote_count', '-created_at')
        
        serializer = QuestionSerializer(questions, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, community_id):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to post questions'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
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
    permission_classes = [AllowAny]

    def get(self, request, question_id):
        try:
            answers = Answer.objects.filter(question_id=question_id)
            serializer = AnswerSerializer(answers, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, question_id):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to post answers'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
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
    permission_classes = [AllowAny]

    def get(self, request, community_id):
        polls = Poll.objects.filter(community_id=community_id)
        serializer = PollSerializer(polls, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, community_id):
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to create polls'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
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
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, community_id):
        try:
            print(f"Fetching announcements for community {community_id}")
            announcements = Announcement.objects.filter(community_id=community_id)
            print(f"Found {announcements.count()} announcements")
            serializer = AnnouncementSerializer(announcements, many=True)
            return Response(serializer.data)
        except Exception as e:
            print(f"Error fetching announcements: {str(e)}")
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
@permission_classes([AllowAny])
def recommended_products(request, community_id):
    if request.method == 'GET':
        products = RecommendedProduct.objects.filter(community_id=community_id)
        serializer = RecommendedProductSerializer(products, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Require authentication for adding products
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to add products'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            data = request.data.copy()
            data['community'] = community_id
            serializer = RecommendedProductSerializer(data=data)
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

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

    def delete(self, request):
        try:
            user = request.user
            # Delete the user (this will cascade delete the profile)
            user.delete()
            return Response(
                {'message': 'Profile deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            logger.error(f"Error deleting profile: {str(e)}")
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
    
    def post(self, request, userId, token):
        try:
            user = User.objects.get(id=userId)
            if default_token_generator.check_token(user, token):
                password = request.data.get('password')
                user.set_password(password)
                user.save()
                return Response({'message': 'Password reset successful'})
            return Response(
                {'error': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class TrendingCommunitiesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            # Get all communities and order by member count only for now
            communities = Community.objects.annotate(
                member_count=Count('members')
            ).order_by('-member_count')[:5]  # Get top 5
            
            serializer = CommunitySerializer(
                communities, 
                many=True,
                context={'request': request}
            )
            return Response(serializer.data)
        except Exception as e:
            print(f"Error in TrendingCommunitiesView: {str(e)}")  # Debug log
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AccountActivationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, registration_id):
        print(f"DEBUG: Activation attempt for ID: {registration_id}")
        try:
            # Get registration data from cache
            registration_data = cache.get(f'registration_{registration_id}')
            print(f"DEBUG: Retrieved cache data: {registration_data}")
            
            if not registration_data or not isinstance(registration_data, dict):
                print(f"DEBUG: Invalid cache data format: {registration_data}")
                return Response(
                    {'error': 'Invalid or expired activation link. Please register again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            required_fields = ['username', 'email', 'password']
            if not all(field in registration_data for field in required_fields):
                print(f"DEBUG: Missing required fields in cache data: {registration_data}")
                return Response(
                    {'error': 'Invalid registration data. Please register again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if user already exists
            if User.objects.filter(email=registration_data['email']).exists():
                print(f"DEBUG: User already exists with email {registration_data['email']}")
                return Response(
                    {'error': 'User with this email already exists'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create and activate user
            user = User.objects.create_user(
                username=registration_data['username'],
                email=registration_data['email'],
                password=registration_data['password'],
                is_active=True
            )
            print(f"DEBUG: User created successfully: {user.username}")
            
            # Clean up cache after successful creation
            cache.delete(f'registration_{registration_id}')
            print("DEBUG: Cache cleaned up")
            
            return Response({
                'message': 'Account activated successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"DEBUG: Activation error: {str(e)}")
            return Response(
                {'error': f'Failed to activate account: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_community(request, community_id):
    try:
        community = get_object_or_404(Community, id=community_id)
        
        # Check if user is the creator
        if request.user != community.created_by:
            return Response(
                {'error': 'Only the creator can delete the community'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Delete the community
        community.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)
            
    except Exception as e:
        print(f"Error in delete_community: {str(e)}")
        return Response(
            {'error': 'Failed to delete community'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
