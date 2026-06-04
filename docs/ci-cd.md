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
