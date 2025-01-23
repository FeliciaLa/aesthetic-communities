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
    ForumCommentView,
    update_community_banner,
    GalleryImageDetailView,
)

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
    path('resources/', ResourceView.as_view(), name='resources'),
    
    # Forum endpoints
    path('communities/<int:community_id>/forum/', ForumPostView.as_view(), name='forum-posts'),
    path('forum/posts/<int:post_id>/comments/', ForumCommentView.as_view(), name='forum-comments'),

    # Gallery endpoints
    path('communities/<int:community_id>/gallery/', GalleryImageView.as_view(), name='community-gallery'),
    path('communities/<int:community_id>/gallery/<int:image_id>/', GalleryImageDetailView.as_view(), name='gallery-image-detail'),
]
