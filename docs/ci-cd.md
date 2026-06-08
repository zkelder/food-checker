# CI/CD

## Backend CI

Backend CI is defined in `.github/workflows/backend-ci.yml`.

It runs on pushes and pull requests to `main` and performs:

- Python dependency installation from `requirements.txt` and
  `requirements-dev.txt`.
- FastAPI backend import check.
- Backend test suite with `python -m pytest -q`.

## Mobile CI

Mobile CI is defined in `.github/workflows/mobile-ci.yml`.

It runs on relevant mobile workflow changes and performs:

- `npm ci` in `mobile/`.
- Expo public config validation with `npx expo config --type public`.
- TypeScript typecheck.
- Expo lint.

## AWS OIDC Foundation

AWS OIDC validation is defined in `.github/workflows/aws-oidc-check.yml`.

It is manual-only through `workflow_dispatch` and uses GitHub Actions OIDC to
assume the IAM role created by Terraform. This avoids long-lived AWS access keys
and provides the authentication foundation for ECR and deploy workflows.

Required repository variables:

- `AWS_OIDC_ROLE_ARN`
- `AWS_REGION` (optional; defaults to `us-east-1`)

The workflow only runs `aws sts get-caller-identity` as a proof check.

## Backend Image

Backend image publishing is defined in `.github/workflows/backend-image.yml`.

It is manual-only through `workflow_dispatch`. The workflow assumes the AWS OIDC
role, logs in to Amazon ECR, builds the backend Docker image from the repository
root `Dockerfile`, and pushes both `$GITHUB_SHA` and `latest` tags.

Required repository variables:

- `AWS_OIDC_ROLE_ARN`
- `AWS_REGION` (optional; defaults to `us-east-1`)
- `ECR_REPOSITORY_URL`

This workflow only publishes the image to ECR.

## EC2 Image Deployment

EC2 image deployment is defined in
`.github/workflows/deploy-backend-image.yml`.

This is the primary production deploy path:

GitHub Actions -> AWS OIDC -> SSM Run Command -> EC2 -> ECR image pull ->
Docker Compose restart.

It is manual-only through `workflow_dispatch`. The workflow assumes the AWS OIDC
role, sends an SSM Run Command to the backend EC2 instance, logs in to ECR,
pulls the selected ECR image with `docker-compose.prod.yml`, starts the
container, and verifies the deployment.

The production Compose file binds FastAPI to `127.0.0.1:8000` on the EC2 host.
Public API traffic should reach the backend through Caddy over HTTPS at
`https://api.foodchecker.zkelder.dev`, not by connecting to port 8000 directly.

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

Post-deploy validation includes:

- `GET http://127.0.0.1:8000/health`.
- A synthetic `POST http://127.0.0.1:8000/analyze` request using a known
  ingredient sample and expecting `match_count >= 1`.

Post-deploy cleanup runs only after validation succeeds:

- Unused Docker images older than 7 days.
- Docker build cache older than 7 days.
- `/tmp/aws` removal.

The workflow does not prune Docker volumes.

Terraform still documents an API ingress path for TCP 8000 from the earlier MVP
setup. After confirming Caddy/HTTPS works with localhost-only Docker binding,
tighten the security group so public traffic is limited to ports 80 and 443
plus trusted SSH access.

## Host Configuration

Ansible host configuration lives under `ansible/`. It prepares the EC2 backend
host for ECR image deployment by installing baseline packages, Docker Engine
from Docker's official apt repository, the Docker Compose plugin, AWS CLI v2
from the official zip installer, SSM Agent, and app directory checks.

Terraform still owns AWS infrastructure. GitHub Actions still owns CI and image
publishing. Ansible only owns host prerequisites for the EC2 instance.

## No-SSH Deployment Foundation

AWS Systems Manager is the no-SSH deployment channel. Terraform grants the
backend EC2 instance managed-instance permissions and gives the GitHub OIDC role
scoped permission to run `AWS-RunShellScript` against the backend instance.

Ansible ensures the EC2 host has the SSM Agent installed and running.

## Fallback Deploy Paths

The local SSH deploy scripts remain fallback/legacy paths:

- `scripts/deploy_backend_image.sh` pulls an ECR image and restarts Docker
  Compose over SSH.
- `scripts/deploy_backend.sh` rebuilds from source over SSH.
- `.github/workflows/deploy-backend.yml` is the legacy manual SSH/source-build
  GitHub Actions fallback.

They are useful during recovery or SSM troubleshooting, but the primary backend
image deployment path is GitHub Actions -> OIDC -> SSM -> EC2 -> ECR image pull
-> Docker Compose restart.

## Operating Model

- Infrastructure changes: update Terraform in `infra/`, review `terraform plan`,
  then apply manually.
- Host configuration changes: update Ansible under `ansible/`, run the backend
  host playbook, and verify SSM/Docker health.
- Backend code changes: Backend CI -> Backend Image -> Deploy Backend Image.
- Mobile changes: Mobile CI -> manual EAS/TestFlight process.
- Troubleshooting: check workflow logs, SSM command stdout/stderr, API health,
  container logs, and the production runbook. Use SSH fallback only when needed.

## Decision Rationale

- EC2 + Docker Compose fits the current MVP: simple, inspectable, low overhead,
  and enough for one backend container. ECS/EKS can wait until scaling or
  operational complexity justifies them.
- SSM replaced SSH as the primary deploy channel because GitHub can deploy
  without private SSH keys or inbound operator access.
- Ansible owns host packages so deploy scripts stay focused on deployment, not
  long-lived server setup.
- GitHub OIDC avoids long-lived AWS access keys in repository secrets.
- SSH scripts remain as fallbacks because they are useful during recovery, but
  they are no longer the preferred deployment path.

## Related Docs

- [Roadmap](roadmap.md)
- [Production runbook](production-runbook.md)
- [Mobile release pipeline](mobile-release-pipeline.md)
- [TestFlight checklist](testflight-checklist.md)
