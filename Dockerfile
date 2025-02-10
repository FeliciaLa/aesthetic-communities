# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000  # Add explicit PORT env var

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

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose the port
EXPOSE ${PORT}

# Command to run the application
CMD gunicorn config.wsgi:application --bind 0.0.0.0:${PORT} --log-level debug --timeout 120 