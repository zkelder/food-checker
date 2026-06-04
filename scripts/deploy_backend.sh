#!/usr/bin/env bash
set -euo pipefail

EC2_HOST="54.159.60.186"
EC2_USER="ubuntu"
SSH_KEY="$HOME/.ssh/food-checker-aws"
APP_DIR="/home/ubuntu/food-checker"

echo "Deploying Food Checker backend to ${EC2_HOST}..."

ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" << EOF
set -euo pipefail

cd "${APP_DIR}"

echo "Pulling latest code..."
git pull

echo "Rebuilding backend container..."
docker compose down --remove-orphans
docker rm -f food-checker-api 2>/dev/null || true
docker compose up -d --build

echo "Checking container status..."
docker ps

echo "Checking backend health..."
curl -f http://127.0.0.1:8000/health

echo "Recent backend logs..."
docker logs food-checker-api --tail 40
EOF

echo "Deployment complete."
echo "Public health check:"
curl -f "http://${EC2_HOST}:8000/health"
