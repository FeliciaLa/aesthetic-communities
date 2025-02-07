from .settings import *
import os
from decouple import config
import dj_database_url
import logging

# Set up logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Basic settings
DEBUG = True
ALLOWED_HOSTS = [
    'aesthetic-communities-production.up.railway.app',
    '*',
]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://aesthetic-communities-production.up.railway.app",
    "https://aesthetic-communities.vercel.app",
    "https://aesthetic-communities-git-master-felicialas-projects.vercel.app"
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Change this to False
CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Add these settings
CORS_EXPOSE_HEADERS = ['content-type', 'x-csrftoken']
CORS_PREFLIGHT_MAX_AGE = 86400

# Database configuration
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# URLs
APPEND_SLASH = True  # This ensures URLs end with a slash
USE_X_FORWARDED_HOST = True
USE_X_FORWARDED_PORT = True

print("Starting Django with settings:")
print(f"DEBUG: {DEBUG}")
print(f"ALLOWED_HOSTS: {ALLOWED_HOSTS}")
print(f"DATABASE_URL exists: {bool(os.environ.get('DATABASE_URL'))}")
print(f"STATIC_ROOT: {STATIC_ROOT}")

# Email settings with defaults
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Just log emails to console for now
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)

# Security settings
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'default-key-for-testing')

# Print environment variables for debugging (will be removed later)
print("DATABASE SETTINGS:")
print(f"NAME: {os.environ.get('PGDATABASE')}")
print(f"USER: {os.environ.get('PGUSER')}")
print(f"HOST: {os.environ.get('PGHOST')}")
print(f"PORT: {os.environ.get('PGPORT')}")

# Security settings
CSRF_TRUSTED_ORIGINS = [
    "https://aesthetic-communities-production.up.railway.app",  # Your Railway domain
]

# Add any other production-specific settings

# Security settings
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True 