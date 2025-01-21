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
)

urlpatterns = [
    # Auth endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    
    # Community endpoints
    path('communities/', CommunityView.as_view(), name='communities'),
    path('communities/<int:pk>/', CommunityDetailView.as_view(), name='community-detail'),
    path('communities/<int:community_id>/gallery/', GalleryImageView.as_view(), name='community-gallery'),
    
    # Resource endpoints
    path('resources/categories/', ResourceCategoryView.as_view(), name='resource-categories'),
    path('resources/', ResourceView.as_view(), name='resources'),
]
