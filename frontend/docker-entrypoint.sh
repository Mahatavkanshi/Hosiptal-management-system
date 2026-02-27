#!/bin/sh

# Runtime configuration for Frontend
# This script replaces environment variable placeholders in the built files at container startup

# Set default values if not provided
VITE_API_URL=${VITE_API_URL:-http://localhost:5000/api}
VITE_SOCKET_URL=${VITE_SOCKET_URL:-http://localhost:5000}
VITE_RAZORPAY_KEY_ID=${VITE_RAZORPAY_KEY_ID:-}

echo "=========================================="
echo "Configuring Hospital Management Frontend"
echo "=========================================="
echo "  VITE_API_URL: $VITE_API_URL"
echo "  VITE_SOCKET_URL: $VITE_SOCKET_URL"
echo "  VITE_RAZORPAY_KEY_ID: ${VITE_RAZORPAY_KEY_ID:-(not set)}"
echo "=========================================="

# Update the runtime config in index.html
sed -i \
    -e "s|\"VITE_API_URL_PLACEHOLDER\"|\"$VITE_API_URL\"|g" \
    -e "s|\"VITE_SOCKET_URL_PLACEHOLDER\"|\"$VITE_SOCKET_URL\"|g" \
    -e "s|\"VITE_RAZORPAY_KEY_ID_PLACEHOLDER\"|\"$VITE_RAZORPAY_KEY_ID\"|g" \
    /usr/share/nginx/html/index.html

# Verify the replacement
echo ""
echo "Verifying configuration..."
grep -A 4 "window.__ENV__" /usr/share/nginx/html/index.html | head -6

echo ""
echo "Starting nginx..."

# Execute the main command
exec "$@"
