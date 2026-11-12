#!/bin/sh
set -e

# Apply committed Prisma migrations before starting the app when requested.
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Applying pending Prisma migrations..."
  /app/node_modules/.bin/prisma migrate deploy
fi

exec "$@"
