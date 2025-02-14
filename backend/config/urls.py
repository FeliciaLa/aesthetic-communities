from django.contrib import admin
from django.urls import path, include  # Import `include` to reference app-specific URLs
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from main.views import SavedItemsViewSet, LoginView, RegisterView, health_check  
from django.http import HttpResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
import logging
import sys
import os
from django.views.static import serve

def serve_media_file(request, path):
    """Custom view to serve media files with proper headers"""
    try:
        # Clean the path
        path = path.replace('media/', '').lstrip('/')
        file_path = os.path.join(settings.MEDIA_ROOT, 'community_banners', path)
        
        print(f"Attempting to serve file: {file_path}")
        print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
        print(f"Path requested: {path}")
        
        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'))
            response['Content-Type'] = 'image/jpeg'
            response['Access-Control-Allow-Origin'] = '*'
            response['Cache-Control'] = 'public, max-age=31536000'
            return response
            
        print(f"File not found: {file_path}")
        return HttpResponse(status=404)
    except Exception as e:
        print(f"Error serving media file: {str(e)}")
        return HttpResponse(status=500)

router = DefaultRouter()
router.register(r'saved', SavedItemsViewSet, basename='saved')

logger = logging.getLogger(__name__)

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    path('', include('main.urls')),
    path('api/', include('music.urls')),
    path('api/', include(router.urls)),
    path('media/community_banners/<path:path>', serve_media_file, name='serve_media'),
]
