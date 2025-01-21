from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

# Create your models here.

class Community(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    banner_image = models.ImageField(upload_to='community_banners/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='communities')

    def __str__(self):
        return self.name

class GalleryImage(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='gallery_images/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.id} for {self.community.name}"

    class Meta:
        ordering = ['-uploaded_at']

class ResourceCategory(models.Model):
    PRESET_CATEGORIES = [
        ('MOVIES', 'Movies'),
        ('BOOKS', 'Books'),
        ('VIDEOS', 'Videos'),
        ('MUSIC', 'Music'),
        ('TUTORIALS', 'Tutorials'),
        ('OTHER', 'Other'),
    ]

    name = models.CharField(max_length=100)
    category_type = models.CharField(
        max_length=20, 
        choices=PRESET_CATEGORIES,
        default='OTHER'
    )
    description = models.TextField(blank=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='resource_categories')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_preset = models.BooleanField(default=False)

    class Meta:
        unique_together = ['community', 'category_type']

class Resource(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True, null=True)
    author = models.CharField(max_length=200, blank=True, null=True)
    category = models.ForeignKey('ResourceCategory', on_delete=models.CASCADE, related_name='resources')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'main_resource'  # Explicitly set the table name

    def __str__(self):
        return self.title

class ForumPost(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    community = models.ForeignKey('Community', on_delete=models.CASCADE, related_name='forum_posts')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class ForumComment(models.Model):
    content = models.TextField()
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='comments')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Comment by {self.created_by.username} on {self.post.title}'