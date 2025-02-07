FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app/backend

# Copy only requirements first
COPY backend/requirements.txt /app/backend/

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ /app/backend/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings_prod
ENV PORT=8000

# Run migrations and start the application
CMD python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT 