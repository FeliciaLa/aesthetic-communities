from .settings import *
import os
from decouple import config
import dj_database_url

# Basic settings
DEBUG = True  # Temporarily set to True to see errors
ALLOWED_HOSTS = ['*']

# Database configuration using DATABASE_URL
DATABASES = {
    'default': dj_database_url.config(
        default=os.environ.get('DATABASE_URL'),
        conn_max_age=600
    )
}

# Email settings with defaults
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Just log emails to console for now
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)

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