from django.db import models
from django.contrib.auth.models import User

class Community(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(User, related_name='communities')
    banner_image = models.ImageField(upload_to='community_banners/', null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Communities"

class ResourceCategory(models.Model):
    CATEGORY_CHOICES = [
        ('MOVIES', 'Movies'),
        ('BOOKS', 'Books'),
        ('VIDEOS', 'Videos'),
        ('MUSIC', 'Music'),
        ('TUTORIALS', 'Tutorials'),
        ('OTHER', 'Other'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    category_type = models.CharField(max_length=20, choices=CATEGORY_CHOICES, null=True, blank=True)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='resource_categories')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_preset = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']
        verbose_name_plural = "Resource Categories"

    def __str__(self):
        return f"{self.name} ({self.category_type})"

class Resource(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    url = models.URLField(blank=True, null=True)
    author = models.CharField(max_length=200, blank=True, null=True)
    category = models.ForeignKey(ResourceCategory, on_delete=models.CASCADE, related_name='resources')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class ForumPost(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='forum_posts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class ForumComment(models.Model):
    content = models.TextField()
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='comments')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.created_by.username} on {self.post.title}"

class GalleryImage(models.Model):
    image = models.ImageField(upload_to='gallery/')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='gallery_images')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image uploaded by {self.uploaded_by.username} for {self.community.name}"

    class Meta:
        ordering = ['-uploaded_at']