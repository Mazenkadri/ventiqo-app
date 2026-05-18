#!/bin/bash
set -e

# Run Laravel setup
php artisan config:cache
php artisan migrate --force

# Transform nginx template (nixpacks generates this)
if [ -f /assets/scripts/prestart.mjs ]; then
    node /assets/scripts/prestart.mjs /assets/nginx.template.conf /etc/nginx/nginx.conf
fi

# Start PHP-FPM in background
php-fpm -y /assets/php-fpm.conf &

# Start nginx in foreground
nginx -c /etc/nginx/nginx.conf -g 'daemon off;'
