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
    community = models.ForeignKey('Community', on_delete=models.CASCADE, related_name='gallery_images')
    image = models.ImageField(upload_to='gallery_images/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image {self.id} for {self.community.name}"

class ResourceCategory(models.Model):
    PRESET_CATEGORIES = [
        ('MOVIES', 'Movies'),
        ('BOOKS', 'Books'),
        ('VIDEOS', 'Videos'),
        ('MUSIC', 'Music'),
        ('TUTORIALS', 'Tutorials'),
    ]

    name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=20, choices=PRESET_CATEGORIES)
    description = models.TextField(blank=True)
    is_preset = models.BooleanField(default=False)
    community = models.ForeignKey('Community', on_delete=models.CASCADE, related_name='resource_categories')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Resource categories"
        ordering = ['name']
        unique_together = ['community', 'category_type']  # Ensures one category type per community

    def __str__(self):
        return f"{self.get_category_type_display()} - {self.community.name}"

class Resource(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    url = models.URLField(help_text="Link to the resource (e.g., movie streaming link, book purchase link, video URL)")
    thumbnail = models.ImageField(upload_to='resource_thumbnails/', blank=True, null=True)
    category = models.ForeignKey(ResourceCategory, on_delete=models.CASCADE, related_name='resources')
    
    # Additional metadata fields
    author = models.CharField(max_length=200, blank=True, help_text="Author/Artist/Director name")
    release_year = models.PositiveIntegerField(null=True, blank=True)
    duration = models.CharField(max_length=50, blank=True, help_text="Duration or length (e.g., '2h 30min', '300 pages')")
    rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True, help_text="Rating out of 10")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.category.get_category_type_display()})"