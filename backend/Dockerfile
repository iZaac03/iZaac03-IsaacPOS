FROM php:8.2-cli

# Install system dependencies and pdo_mysql extension
RUN apt-get update && apt-get install -y \
    git \
    curl \
    unzip \
    libzip-dev \
    && docker-php-ext-install pdo_mysql \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Ensure storage directories exist
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache

# Copy application files
COPY . .

# Set permissions
RUN chmod -R 777 storage bootstrap/cache

# Install dependencies (skip scripts during build to prevent early boot crashes)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
