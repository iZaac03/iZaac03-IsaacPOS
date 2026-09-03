#!/bin/sh
set -e

echo "=== Starting IsaacPOS Backend on Railway ==="
echo "Port: ${PORT:-8000}"
echo "DB Host: ${DB_HOST:-not set}"

# Clear config cache so environment variables are fresh
php artisan config:clear || true

# Wait for MySQL to be ready (up to 30 attempts)
echo "Checking database connection..."
for i in $(seq 1 30); do
    if php -r "try { new PDO('mysql:host=' . (getenv('DB_HOST') ?: '127.0.0.1') . ';port=' . (getenv('DB_PORT') ?: 3306) . ';dbname=' . (getenv('DB_DATABASE') ?: 'railway'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'), [PDO::ATTR_TIMEOUT => 2]); echo 'Connected!'; exit(0); } catch (Exception \$e) { exit(1); }"; then
        echo "Database is ready!"
        break
    fi
    echo "Waiting for database connection ($i/30)..."
    sleep 2
done

# Run migrations and seed
echo "Running migrations..."
php artisan migrate --force || echo "Migration skipped or failed, continuing..."

echo "Running seeders..."
php artisan db:seed --force || echo "Seeder skipped or failed, continuing..."

# Start Laravel server
echo "Starting HTTP server on 0.0.0.0:${PORT:-8000}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
