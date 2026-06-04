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

EC2 image deployment is defined in
`.github/workflows/deploy-backend-image.yml`.

It is manual-only through `workflow_dispatch`. The workflow assumes the AWS OIDC
role, sends an SSM Run Command to the backend EC2 instance, pulls the selected
ECR image with `docker-compose.prod.yml`, starts the container, checks
`http://127.0.0.1:8000/health`, and prints recent `food-checker-api` logs.

The `image_tag` input defaults to `latest`. Use a commit SHA tag to deploy a
specific image produced by the Backend Image workflow.

Required repository variables:

- `AWS_OIDC_ROLE_ARN`
- `AWS_REGION` (optional; defaults to `us-east-1`)
- `ECR_REPOSITORY_URL`
- `BACKEND_INSTANCE_ID` (optional; defaults to the current Terraform-managed
  backend instance ID)

The local SSH image deploy script remains available as a fallback:

```bash
IMAGE_TAG=<commit-sha> scripts/deploy_backend_image.sh
```

The existing source-build deployment script also remains available for now.

## Host Configuration

Ansible host configuration lives under `ansible/`. It prepares the EC2 backend
host for ECR image deployment by installing baseline packages, Docker Engine
from Docker's official apt repository, the Docker Compose plugin, AWS CLI v2
from the official zip installer, and app directory checks.

Terraform still owns AWS infrastructure. GitHub Actions still owns CI and image
publishing. Ansible only owns host prerequisites for the EC2 instance.

## No-SSH Deployment Foundation

AWS Systems Manager is the no-SSH deployment channel. Terraform grants the
backend EC2 instance managed-instance permissions and gives the GitHub OIDC role
scoped permission to run `AWS-RunShellScript` against the backend instance.

Ansible ensures the EC2 host has the SSM Agent installed and running.
