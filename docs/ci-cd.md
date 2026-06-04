# CI/CD

## Backend CI

Backend CI is defined in `.github/workflows/backend-ci.yml`.

It runs on pushes and pull requests to `main` and performs:

- Python dependency installation from `requirements.txt`.
- FastAPI backend import check.
- Backend test suite with `python -m pytest -q`.

## Mobile CI

Mobile CI is defined in `.github/workflows/mobile-ci.yml`.

It runs on relevant mobile workflow changes and performs:

- `npm ci` in `mobile/`.
- Expo public config validation with `npx expo config --type public`.
- TypeScript typecheck.
- Expo lint.

## Manual Backend Deployment

Backend deployment is defined in `.github/workflows/deploy-backend.yml`.

It is manual-only through `workflow_dispatch`; it does not deploy on push.
Run it from the GitHub Actions tab after CI passes.

The workflow uses these repository secrets:

- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`

The deploy job SSHes to the EC2 host, resets `/home/ubuntu/food-checker` to
`origin/main`, optionally updates a host `.venv` if present, rebuilds the Docker
Compose backend container, and verifies `http://127.0.0.1:8000/health`.

## AWS OIDC Foundation

AWS OIDC validation is defined in `.github/workflows/aws-oidc-check.yml`.

It is manual-only through `workflow_dispatch` and uses GitHub Actions OIDC to
assume the IAM role created by Terraform. This avoids long-lived AWS access keys
and provides the authentication foundation for future ECR and deploy workflows.

Required repository variables:

- `AWS_OIDC_ROLE_ARN`
- `AWS_REGION` (optional; defaults to `us-east-1`)

The workflow only runs `aws sts get-caller-identity` as a proof check.

## Backend Image

Backend image publishing is defined in `.github/workflows/backend-image.yml`.

It is manual-only through `workflow_dispatch`. The workflow assumes the AWS OIDC
role, logs in to Amazon ECR, builds the backend Docker image from the repository
root `Dockerfile`, and pushes both the commit SHA tag and `latest`.

Required repository variables:

- `AWS_OIDC_ROLE_ARN`
- `AWS_REGION` (optional; defaults to `us-east-1`)
- `ECR_REPOSITORY_URL`

This workflow only publishes the image to ECR.

## EC2 Image Deployment

EC2 image deployment is available as a bridge step in
`scripts/deploy_backend_image.sh`. It keeps the current SSH-based operations
model, logs in to ECR from the EC2 host using the instance profile, pulls the
image with `docker-compose.prod.yml`, starts the container, checks
`http://127.0.0.1:8000/health`, and prints recent `food-checker-api` logs.

By default it deploys `latest`. To deploy a specific image tag:

```bash
IMAGE_TAG=<commit-sha> scripts/deploy_backend_image.sh
```

The existing source-build deployment script remains available. A no-SSH
SSM-based deploy workflow is still future work.
