from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from .models import CommunitySpotifyPlaylist
from .serializers import SpotifyPlaylistSerializer
import logging

logger = logging.getLogger(__name__)

class CommunitySpotifyPlaylistViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Spotify playlists in communities.
    Allows one playlist per community.
    """
    serializer_class = SpotifyPlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter playlists by community ID"""
        return CommunitySpotifyPlaylist.objects.filter(
            community_id=self.kwargs['community_id']
        )

    def create(self, request, *args, **kwargs):
        """Create a new playlist, ensuring only one exists per community"""
        try:
            community_id = self.kwargs['community_id']
            
            # Check if playlist exists
            if CommunitySpotifyPlaylist.objects.filter(community_id=community_id).exists():
                return Response(
                    {'error': 'Community already has a Spotify playlist'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate the URL
            spotify_url = request.data.get('spotify_playlist_url')
            if not spotify_url or not ('spotify.com' in spotify_url):
                return Response(
                    {'error': 'Invalid Spotify URL'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create serializer with modified data
            serializer = self.get_serializer(data={
                'spotify_playlist_url': spotify_url,
                'community': community_id
            })
            
            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save with the user
            serializer.save(added_by=request.user)
            
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_update(self, serializer):
        serializer.save(added_by=self.request.user)