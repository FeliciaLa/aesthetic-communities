from rest_framework import serializers
from .models import CommunitySpotifyPlaylist

class SpotifyPlaylistSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunitySpotifyPlaylist
        fields = ['id', 'community', 'spotify_playlist_url', 'added_by', 'created_at']
        read_only_fields = ['added_by', 'created_at']

    def validate_spotify_playlist_url(self, value):
        if not 'open.spotify.com/playlist/' in value:
            raise serializers.ValidationError('Invalid Spotify playlist URL')
        return value

    def create(self, validated_data):
        # Ensure we have a community
        if 'community' not in validated_data:
            raise serializers.ValidationError({'community': 'This field is required.'})
        return super().create(validated_data) 