from django.contrib import admin
from django.urls import path, include  # Import `include` to reference app-specific URLs
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from main.views import SavedItemsViewSet

router = DefaultRouter()
router.register(r'saved', SavedItemsViewSet, basename='saved')

urlpatterns = [
    path('admin/', admin.site.urls),  # Admin interface
    path('api/', include('main.urls')),  # Changed from communities to main
    path('api/', include('music.urls')),  # Remove the 'music/' prefix
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
