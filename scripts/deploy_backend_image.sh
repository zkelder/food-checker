#!/usr/bin/env bash
set -euo pipefail

EC2_HOST="54.159.60.186"
EC2_USER="ubuntu"
SSH_KEY="$HOME/.ssh/food-checker-aws"
APP_DIR="/home/ubuntu/food-checker"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY_URL="627225873907.dkr.ecr.us-east-1.amazonaws.com/food-checker-api"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "Deploying Food Checker backend image ${ECR_REPOSITORY_URL}:${IMAGE_TAG} to ${EC2_HOST}..."

ssh -i "$SSH_KEY" "${EC2_USER}@${EC2_HOST}" \
  "AWS_REGION='${AWS_REGION}' ECR_REPOSITORY_URL='${ECR_REPOSITORY_URL}' IMAGE_TAG='${IMAGE_TAG}' APP_DIR='${APP_DIR}' bash -s" << 'EOF'
set -euo pipefail

cd "${APP_DIR}"

if ! command -v aws >/dev/null 2>&1; then
  echo "Installing aws CLI for ECR login..."
  sudo apt-get update
  sudo apt-get install -y awscli
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the EC2 host." >&2
  exit 1
fi

echo "Pulling latest code for compose file updates..."
git pull

echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region "${AWS_REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REPOSITORY_URL%/*}"

echo "Pulling backend image..."
IMAGE_TAG="${IMAGE_TAG}" docker compose -f docker-compose.prod.yml pull

echo "Starting backend container..."
IMAGE_TAG="${IMAGE_TAG}" docker compose -f docker-compose.prod.yml up -d

echo "Checking container status..."
docker ps

echo "Checking backend health..."
curl -f http://127.0.0.1:8000/health

echo "Recent backend logs..."
docker logs food-checker-api --tail 40
EOF

echo "Image deployment complete."
echo "Public health check:"
curl -f "http://${EC2_HOST}:8000/health"
