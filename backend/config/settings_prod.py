import os
from pathlib import Path
import dj_database_url
from decouple import config
import sys

# Check if we're running collectstatic
IS_COLLECTSTATIC = 'collectstatic' in sys.argv

# Print environment debug info
print("=== Database Configuration Debug ===")
print(f"DATABASE_URL exists: {bool(os.getenv('DATABASE_URL'))}")
print(f"PGHOST exists: {bool(os.getenv('PGHOST'))}")
print(f"PGHOST value: {os.getenv('PGHOST', 'not set')}")
print(f"Available env vars: {[k for k in os.environ.keys()]}")

# Database Configuration
if IS_COLLECTSTATIC:
    # Use dummy DB for collectstatic
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:'
        }
    }
elif os.getenv('DATABASE_URL'):
    # Parse the DATABASE_URL
    db_config = dj_database_url.parse(os.getenv('DATABASE_URL'))
    # Ensure we're not using localhost
    if db_config.get('HOST') in ['localhost', '127.0.0.1', '::1']:
        print("WARNING: Database host is localhost, checking for PGHOST")
        db_config['HOST'] = os.getenv('PGHOST')
    
    DATABASES = {
        'default': db_config
    }
else:
    # Fallback to individual Postgres settings
    db_host = os.getenv('PGHOST')
    if not db_host or db_host in ['localhost', '127.0.0.1', '::1']:
        raise ValueError("Invalid database host. PGHOST must be set to a non-localhost value")
        
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('PGDATABASE'),
            'USER': os.getenv('PGUSER'),
            'PASSWORD': os.getenv('PGPASSWORD'),
            'HOST': db_host,
            'PORT': os.getenv('PGPORT', '5432'),
        }
    }

print(f"Final Database HOST setting: {DATABASES['default'].get('HOST', 'not set')}")

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