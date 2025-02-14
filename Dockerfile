# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DJANGO_SETTINGS_MODULE=config.settings_prod

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

# Create static directories
RUN mkdir -p staticfiles && mkdir -p static

# Expose the port the app runs on
EXPOSE $PORT

# Command to run the application
CMD python manage.py wait_for_db && \
    python manage.py migrate --noinput && \
    echo "Starting Gunicorn..." && \
    gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-level debug --timeout 30 --workers 1 --threads 2