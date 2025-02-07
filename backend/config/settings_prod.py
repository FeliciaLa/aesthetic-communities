from .settings import *
import os

# Basic settings
DEBUG = True  # Temporarily set to True to see errors
ALLOWED_HOSTS = ['*']

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('PGDATABASE'),
        'USER': os.environ.get('PGUSER'),
        'PASSWORD': os.environ.get('PGPASSWORD'),
        'HOST': os.environ.get('PGHOST'),
        'PORT': os.environ.get('PGPORT'),
    }
}

# Security settings
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'default-key-for-testing')

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Print environment variables for debugging (will be removed later)
print("DATABASE SETTINGS:")
print(f"NAME: {os.environ.get('PGDATABASE')}")
print(f"USER: {os.environ.get('PGUSER')}")
print(f"HOST: {os.environ.get('PGHOST')}")
print(f"PORT: {os.environ.get('PGPORT')}")

# CORS settings if needed
CORS_ALLOW_ALL_ORIGINS = True  # Configure this properly for production
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Add your frontend URL here
]

# Add any other production-specific settings

# Security settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True 