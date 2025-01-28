from django.urls import path
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    CommunityView,
    CommunityDetailView,
    CommunityUpdateView,
    GalleryImageView,
    ResourceCategoryView,
    ResourceView,
    UserProfileView,
    ForumPostView,
    PostReactionView,
    ForumCommentView,
    update_community_banner,
    GalleryImageDetailView,
    CommunityMembershipView,
    vote_resource,
    get_resources,
    increment_views,
    increment_category_views,
    QuestionView,
    AnswerView,
    AnswerVoteView,
    QuestionVoteView
)
from . import views

urlpatterns = [
    # Auth endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Community endpoints
    path('communities/', CommunityView.as_view(), name='community-list'),
    path('communities/<int:pk>/', CommunityDetailView.as_view(), name='community-detail'),
    path('communities/<int:community_id>/update_details/', CommunityUpdateView.as_view(), name='community-update'),
    path('communities/<int:community_id>/banner/', update_community_banner, name='update-community-banner'),
    
    # Resource endpoints
    path('resources/categories/', ResourceCategoryView.as_view(), name='resource-categories'),
    path('resources/categories/<int:pk>/', ResourceCategoryView.as_view(), name='resource-category-detail'),
    path('resources/', ResourceView.as_view(), name='resources'),
    path('resources/', get_resources, name='get_resources'),
    path('resources/categories/<int:category_id>/stats/', views.get_collection_stats, name='collection-stats'),
    
    # Forum endpoints
    path('communities/<int:community_id>/forum/posts/', ForumPostView.as_view(), name='forum-posts'),
    path('forum/posts/<int:post_id>/react/', PostReactionView.as_view(), name='post-reaction'),
    path('forum/posts/<int:post_id>/comments/', ForumCommentView.as_view(), name='post-comments'),
    path('communities/<int:community_id>/forum/questions/', QuestionView.as_view(), name='questions'),
    path('questions/<int:question_id>/answers/', AnswerView.as_view(), name='answers'),
    path('answers/<int:answer_id>/vote/', AnswerVoteView.as_view(), name='answer-vote'),
    path('questions/<int:question_id>/vote/', QuestionVoteView.as_view(), name='question-vote'),

    # Gallery endpoints
    path('communities/<int:community_id>/gallery/', GalleryImageView.as_view(), name='community-gallery'),
    path('communities/<int:community_id>/gallery/<int:image_id>/', GalleryImageDetailView.as_view(), name='gallery-image-detail'),

    # Membership endpoints
    path('communities/<int:community_id>/membership/', CommunityMembershipView.as_view(), name='community-membership'),

    # Preview endpoint
    path('preview/', views.get_page_preview, name='get_page_preview'),

    # Vote endpoint
    path('resources/<int:resource_id>/vote/', vote_resource, name='vote-resource'),

    # View endpoint
    path('resources/<int:resource_id>/view/', increment_views, name='increment-views'),

    # Category view endpoint
    path('resources/categories/<int:category_id>/view/', views.increment_category_views, name='increment-category-views'),
]
