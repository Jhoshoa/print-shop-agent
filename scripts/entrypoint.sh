#!/bin/bash
# ============================================
# Print Shop Generator - Container Entrypoint
# ============================================
# Cleans up old .docx files on startup

echo "🧹 Cleaning up old .docx files..."

# Clean /app/backend/output
if [ -d "/app/backend/output" ]; then
    find /app/backend/output -name "*.docx" -type f -delete 2>/dev/null
    echo "   ✓ Cleaned /app/backend/output"
fi

# Clean /app/output (if exists)
if [ -d "/app/output" ]; then
    find /app/output -name "*.docx" -type f -delete 2>/dev/null
    echo "   ✓ Cleaned /app/output"
fi

echo "🚀 Starting Print Shop Generator..."

# Execute the main command
exec "$@"
