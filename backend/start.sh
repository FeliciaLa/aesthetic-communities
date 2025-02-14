#!/bin/bash

# Wait for database
echo "Waiting for database..."
python manage.py wait_for_db

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Start server
echo "Starting server..."
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-level debug 