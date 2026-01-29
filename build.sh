#!/bin/bash
# Clock It - Build and Deployment Script

echo "🕐 Clock It - Build Script"
echo "=========================="
echo ""

# Check if all required files exist
echo "Checking files..."
files=("index.html" "styles.css" "app.js" "manifest.json" "service-worker.js" "icon-192.png" "icon-512.png")

all_exist=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file - MISSING!"
        all_exist=false
    fi
done

echo ""

if [ "$all_exist" = false ]; then
    echo "❌ Build failed: Some files are missing"
    exit 1
fi

echo "✅ All files present!"
echo ""

# Create distribution directory
echo "Creating distribution package..."
mkdir -p dist
cp -r *.html *.css *.js *.json *.png dist/

echo "✅ Distribution package created in ./dist/"
echo ""

# Optional: Start local server
echo "Starting local development server..."
echo "Access the app at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

python3 -m http.server 8000
