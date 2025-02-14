#!/bin/bash
set -e

echo "Waiting for database..."
python manage.py wait_for_db

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting server..."
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-level debug --timeout 30 --workers 1 --threads 2 