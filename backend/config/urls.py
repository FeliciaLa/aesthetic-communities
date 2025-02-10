from django.contrib import admin
from django.urls import path, include  # Import `include` to reference app-specific URLs
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from main.views import SavedItemsViewSet
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import logging

router = DefaultRouter()
router.register(r'saved', SavedItemsViewSet, basename='saved')

logger = logging.getLogger(__name__)

@csrf_exempt
def health_check(request):
    logger.debug("Health check endpoint hit")
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return HttpResponse("OK", status=200)
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HttpResponse(str(e), status=500)

urlpatterns = [
    path('api/', include('main.urls')),  # Move this to the top
    path('admin/', admin.site.urls),  # Admin interface
    path('api/', include('music.urls')),  # Remove the 'music/' prefix
    path('api/', include(router.urls)),
    path('', health_check, name='health_check'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
