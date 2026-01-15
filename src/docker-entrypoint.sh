#!/bin/sh
set -e

# Copy demo.db if it doesn't exist or is empty
if [ ! -s /app/data/demo.db ]; then
  echo "Initializing demo.db from seed data..."
  cp /app/seed-data/demo.db /app/data/demo.db 2>/dev/null || true
  [ -f /app/seed-data/demo.db-shm ] && cp /app/seed-data/demo.db-shm /app/data/demo.db-shm 2>/dev/null || true
  [ -f /app/seed-data/demo.db-wal ] && cp /app/seed-data/demo.db-wal /app/data/demo.db-wal 2>/dev/null || true
  echo "Demo database initialized successfully"
else
  echo "Demo database already exists, skipping initialization"
fi

# Execute the main command
exec "$@"
