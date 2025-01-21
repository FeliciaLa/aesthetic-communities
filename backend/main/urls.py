from django.urls import path
from .views import (
    ListCommunitiesView,
    CommunityDetailView,
    CommunityGalleryView,
    UserProfileView,
    ResourceCategoryView,
    ResourceView,
    CustomAuthToken,
    RegisterView,
)

urlpatterns = [
    path('login/', CustomAuthToken.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('communities/', ListCommunitiesView.as_view(), name='community-list'),
    path('communities/<int:community_id>/', CommunityDetailView.as_view(), name='community-detail'),
    path('communities/<int:community_id>/gallery/', CommunityGalleryView.as_view(), name='community-gallery'),
    path('resources/categories/', ResourceCategoryView.as_view(), name='resource-categories'),
    path('resources/', ResourceView.as_view(), name='resources'),
]
