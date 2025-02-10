from django.contrib import admin
from django.urls import path, include  # Import `include` to reference app-specific URLs
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from main.views import SavedItemsViewSet
from django.http import HttpResponse

router = DefaultRouter()
router.register(r'saved', SavedItemsViewSet, basename='saved')

def health_check(request):
    return HttpResponse("OK")

urlpatterns = [
    path('api/', include('main.urls')),  # Move this to the top
    path('admin/', admin.site.urls),  # Admin interface
    path('api/', include('music.urls')),  # Remove the 'music/' prefix
    path('api/', include(router.urls)),
    path('', health_check, name='health_check'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
