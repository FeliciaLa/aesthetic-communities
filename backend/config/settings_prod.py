import os
from pathlib import Path
import dj_database_url
from decouple import config
import sys

# Import base settings first
from .settings import *

# Now override database settings
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.config(
            default=os.getenv('DATABASE_URL'),
            conn_max_age=600,
        )
    }
    print(f"Using DATABASE_URL configuration: {DATABASES['default']['HOST']}")
else:
    print("No DATABASE_URL found in environment")
    raise ValueError("DATABASE_URL must be set in production")

# Check if we're in build/collect static phase
IS_BUILD = any(arg in sys.argv for arg in ['collectstatic', 'migrate', '--noinput'])

if IS_BUILD:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:'
        }
    }

# Print environment debug info
print("=== Database Configuration Debug ===")
print(f"DATABASE_URL exists: {bool(os.getenv('DATABASE_URL'))}")
print(f"Database HOST: {DATABASES['default'].get('HOST', 'not set')}")

# Production-specific settings
DEBUG = False
ALLOWED_HOSTS = [
    'aesthetic-communities-production.up.railway.app',
    'aesthetic-communities-git-master-felicia-lammertings-projects.vercel.app',
    '*',
]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    'https://aesthetic-communities-m0yg51gdj-felicia-lammertings-projects.vercel.app',
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
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

CSRF_TRUSTED_ORIGINS = [
    'https://aesthetic-communities-m0yg51gdj-felicia-lammertings-projects.vercel.app',
]