#!/bin/bash
set -e

# Wait for database
echo "Waiting for database..."
python manage.py wait_for_db

# Start server
echo "Starting Gunicorn..."
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-level debug --timeout 30 --workers 1 --threads 2 