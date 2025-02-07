FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy backend files
COPY backend/ .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings_prod
ENV PORT=8000

# Add a health check
HEALTHCHECK CMD curl --fail http://localhost:8000/ || exit 1

# Run migrations and start with more verbose output
CMD python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-level debug 