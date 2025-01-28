from django.db import models
from django.conf import settings

class CommunitySpotifyPlaylist(models.Model):
    community = models.OneToOneField('main.Community', on_delete=models.CASCADE, related_name='spotify_playlist')
    spotify_playlist_url = models.URLField()
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Community Spotify Playlist"
        verbose_name_plural = "Community Spotify Playlists"

    def __str__(self):
        return f"Spotify Playlist for {self.community.name}" 