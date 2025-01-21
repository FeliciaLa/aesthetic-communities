from django.urls import path
from .views import (
    UserRegistrationView,
    UserLoginView,
    UserLogoutView,
    CommunityView,
    CommunityDetailView,
    GalleryImageView,
    ResourceCategoryView,
    ResourceView,
    UserProfileView,
    ForumPostView,
    ForumCommentView,
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
    path('communities/<int:community_id>/gallery/', GalleryImageView.as_view(), name='community-gallery'),
    
    # Resource endpoints
    path('resources/categories/', ResourceCategoryView.as_view(), name='resource-categories'),
    path('resources/', ResourceView.as_view(), name='resources'),
    
    # Make sure these forum URLs are uncommented and properly formatted
    path('communities/<int:community_id>/forum/', ForumPostView.as_view(), name='forum-posts'),
    path('forum/posts/<int:post_id>/comments/', ForumCommentView.as_view(), name='forum-comments'),
]
