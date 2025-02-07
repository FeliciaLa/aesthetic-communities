FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the entire project first
COPY . .

# Install Python dependencies
RUN cd backend && pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings_prod
ENV PORT=8000

# Run migrations and start the application
CMD cd backend && python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT 