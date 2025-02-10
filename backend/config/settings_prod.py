import os
from pathlib import Path
import dj_database_url
from decouple import config, UndefinedValueError
import logging

print("=== Environment Variables Check ===")
print("Available environment variables:", [k for k in os.environ.keys()])
print("DATABASE_URL exists:", 'DATABASE_URL' in os.environ)
print("PGDATABASE exists:", 'PGDATABASE' in os.environ)
print("PGHOST exists:", 'PGHOST' in os.environ)
print("=== End Environment Check ===")

# Database Configuration
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.config(
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Try direct PostgreSQL configuration
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('PGDATABASE'),
            'USER': os.getenv('PGUSER'),
            'PASSWORD': os.getenv('PGPASSWORD'),
            'HOST': os.getenv('PGHOST'),
            'PORT': os.getenv('PGPORT'),
        }
    }

# Print database configuration (without sensitive details)
print("Database Engine:", DATABASES['default']['ENGINE'])
print("Database Host:", DATABASES['default'].get('HOST', 'not set'))

# Now import the rest of the settings
from .settings import *

# Add detailed logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'level': 'DEBUG',
        },
    },
    'loggers': {
        '': {  # Root logger
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'gunicorn': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}

# Static Files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Create staticfiles directory if it doesn't exist
if not os.path.exists(STATIC_ROOT):
    os.makedirs(STATIC_ROOT, exist_ok=True)

# Remove STATICFILES_DIRS if the directory doesn't exist
# STATICFILES_DIRS = [
#     os.path.join(BASE_DIR, 'static'),
# ]

# Other settings remain the same...
DEBUG = False

# Print configuration status
print("Configuration loaded with:")
print(f"DEBUG: {DEBUG}")
print(f"STATIC_ROOT: {STATIC_ROOT}")
print(f"Database Engine: {DATABASES['default']['ENGINE']}")

# Security settings
SECURE_SSL_REDIRECT = False  # Disable SSL redirect for healthcheck
SECURE_PROXY_SSL_HEADER = None
SESSION_COOKIE_SECURE = False  # Temporarily disable for testing
CSRF_COOKIE_SECURE = False  # Temporarily disable for testing

# Basic settings
ALLOWED_HOSTS = [
    'aesthetic-communities-production.up.railway.app',
    'aesthetic-communities-git-master-felicia-lammertings-projects.vercel.app',
    '*',
]

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://aesthetic-communities.vercel.app",
    "https://aesthetic-communities-git-main-feliciacarlattos-projects.vercel.app",
    "https://aesthetic-communities-feliciacarlattos-projects.vercel.app",
    "https://aesthetic-communities-production.up.railway.app",
    "http://localhost:3000",
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

CSRF_TRUSTED_ORIGINS = [
    "https://aesthetic-communities.vercel.app",
    "https://aesthetic-communities-production.up.railway.app",
]

# Add these additional settings
CORS_PREFLIGHT_MAX_AGE = 86400

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