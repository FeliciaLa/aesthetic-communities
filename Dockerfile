# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=config.settings_prod \
    PORT=8000

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy the entire project
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Create necessary directories
RUN mkdir -p backend/staticfiles \
    backend/static \
    backend/media \
    backend/media/community_banners

# Set permissions
RUN chmod +x backend/manage.py

# Set the working directory to backend
WORKDIR /app/backend

# Command to run the application
CMD python manage.py wait_for_db && \
    python manage.py migrate --noinput && \
    echo "Starting Gunicorn..." && \
    gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --log-level debug --timeout 30 --workers 1 --threads 2