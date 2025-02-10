import os
from pathlib import Path
import dj_database_url
from decouple import config

# Database Configuration with error handling
try:
    DATABASES = {
        'default': dj_database_url.config(
            default=os.getenv('DATABASE_URL'),
            conn_max_age=600,
        )
    }
    # Test the connection
    from django.db import connections
    connections['default'].ensure_connection()
    print("Database connection successful")
except Exception as e:
    print(f"Database connection error: {str(e)}")
    raise

# Import base settings
from .settings import *

# Override settings for production
DEBUG = False

ALLOWED_HOSTS = [
    'aesthetic-communities-production.up.railway.app',
    'aesthetic-communities-git-master-felicia-lammertings-projects.vercel.app',
    '*',
]

# Security settings that were working
SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = None
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Static Files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Create staticfiles directory if it doesn't exist
if not os.path.exists(STATIC_ROOT):
    os.makedirs(STATIC_ROOT, exist_ok=True)

# Print configuration status
print("Configuration loaded with:")
print(f"DEBUG: {DEBUG}")
print(f"STATIC_ROOT: {STATIC_ROOT}")
print(f"Database Engine: {DATABASES['default']['ENGINE']}")

# Security settings
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'default-key-for-testing')

# Security settings
SECURE_BROWSER_XSS_FILTER = True

# Media files configuration
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# For production, you might want to use cloud storage
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# Print startup diagnostic information
print("Django Starting Up:")
print(f"ALLOWED_HOSTS: {ALLOWED_HOSTS}")
print(f"DEBUG: {DEBUG}")
print(f"DATABASE_URL exists: {bool(os.environ.get('DATABASE_URL'))}")