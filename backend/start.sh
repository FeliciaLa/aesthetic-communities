#!/bin/bash
set -e

echo "Starting server..."
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-level debug --timeout 30 --workers 1 --threads 2 