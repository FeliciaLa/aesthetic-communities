from django.urls import path
from .views import CommunitySpotifyPlaylistViewSet

urlpatterns = [
    # Endpoint for listing all playlists and creating new ones
    path(
        'communities/<int:community_id>/spotify-playlist/', 
        CommunitySpotifyPlaylistViewSet.as_view({
            'get': 'list',    # Get the community's playlist
            'post': 'create'  # Create a new playlist
        })
    ),
    
    # Endpoint for managing a specific playlist
    path(
        'communities/<int:community_id>/spotify-playlist/<int:pk>/',
        CommunitySpotifyPlaylistViewSet.as_view({
            'get': 'retrieve',    # Get playlist details
            'put': 'update',      # Update playlist URL
            'delete': 'destroy'   # Remove playlist
        })
    ),
] 