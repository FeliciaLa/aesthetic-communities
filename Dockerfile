# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=config.settings_prod \
    DATABASE_URL=postgres://none \
    DISABLE_COLLECTSTATIC=0

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app/backend

# Copy only the requirements first
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend directory
COPY backend/ .

# Create static directory
RUN mkdir -p staticfiles

# Collect static files with a dummy database URL
RUN python manage.py collectstatic --noinput --no-input

# Command to run the application
CMD echo "Starting Gunicorn..." && \
    gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --log-level debug --timeout 30 --workers 1 --threads 2