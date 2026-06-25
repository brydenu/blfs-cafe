#!/bin/bash

# Deployment script for BaristaOS
# This script is run on the EC2 server to deploy the latest code

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to application directory
cd /home/ubuntu/blfs-cafe

# Pull latest code from GitHub
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run database migrations (if any)
echo "🗄️  Running database migrations..."
npx prisma db push

# Stop production before rebuilding — building in-place while Next.js is
# running corrupts .next/ and leaves static assets (CSS/JS) in a broken state.
echo "🛑 Stopping production processes..."
pm2 stop baristaos-nextjs baristaos-socket

# Build the application
echo "🏗️  Building application..."
export NODE_OPTIONS="--max-old-space-size=3072"
npm run build

# Restart production (not cafe-dev — that is a separate dev instance)
echo "🔄 Restarting production processes..."
pm2 restart baristaos-nextjs baristaos-socket

echo "✅ Deployment complete!"
echo "📊 Checking PM2 status..."
pm2 status
