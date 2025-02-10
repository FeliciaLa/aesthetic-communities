from django.contrib import admin
from django.urls import path, include  # Import `include` to reference app-specific URLs
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from main.views import SavedItemsViewSet, LoginView, UserRegistrationView
from django.http import HttpResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
import logging
import sys
import os
from django.views.static import serve

def serve_media_file(request, path):
    """Custom view to serve media files with proper headers"""
    try:
        # Remove any leading slashes from the path
        path = path.lstrip('/')
        file_path = os.path.join(settings.MEDIA_ROOT, path)
        print(f"Attempting to serve file: {file_path}")
        print(f"File exists: {os.path.exists(file_path)}")
        
        if os.path.exists(file_path):
            response = FileResponse(open(file_path, 'rb'))
            # Set content type based on file extension
            if path.endswith('.jpg') or path.endswith('.jpeg'):
                response['Content-Type'] = 'image/jpeg'
            elif path.endswith('.png'):
                response['Content-Type'] = 'image/png'
            elif path.endswith('.gif'):
                response['Content-Type'] = 'image/gif'
                
            response['Access-Control-Allow-Origin'] = '*'
            return response
            
        print(f"File not found: {file_path}")
        return HttpResponse(status=404)
    except Exception as e:
        print(f"Error serving media file: {str(e)}")
        return HttpResponse(status=500)

router = DefaultRouter()
router.register(r'saved', SavedItemsViewSet, basename='saved')

logger = logging.getLogger(__name__)

@csrf_exempt
def health_check(request):
    logger.debug(f"Health check endpoint hit at {request.path}")
    logger.debug(f"Available environment variables: {[k for k in os.environ.keys()]}")
    logger.debug(f"DATABASE_URL exists: {bool(os.getenv('DATABASE_URL'))}")
    logger.debug(f"PGHOST value: {os.getenv('PGHOST', 'not set')}")
    
    try:
        # Test database connection
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            logger.debug("Database connection successful")
        
        # Log database settings (without sensitive info)
        from django.conf import settings
        logger.debug(f"Database ENGINE: {settings.DATABASES['default']['ENGINE']}")
        logger.debug(f"Database HOST: {settings.DATABASES['default'].get('HOST', 'not set')}")
        logger.debug(f"Database PORT: {settings.DATABASES['default'].get('PORT', 'not set')}")
        
        return HttpResponse("OK", status=200)
    except Exception as e:
        logger.error(f"Health check failed with error: {str(e)}")
        logger.exception("Full traceback:")
        return HttpResponse(f"Health check failed: {str(e)}", status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('main.urls')),
    path('api/', include('music.urls')),
    path('api/', include(router.urls)),
    path('health/', health_check, name='health_check'),
    # Single media serving path
    path('media/<path:path>', serve_media_file, name='serve_media'),
]
