# ECS/Fargate Migration Plan

This document is a planning artifact only. It does not implement ECS resources,
change production behavior, or replace the current EC2 deployment path.

## Executive Summary

Food Checker currently runs well as a single FastAPI container on one EC2 host
with Docker Compose. That setup is understandable and inexpensive, but it also
puts host maintenance, Docker image cleanup, disk pressure, and service
replacement behavior on the project.

Migrating the backend to ECS/Fargate would help with:

- Host maintenance reduction.
- Docker image cache buildup avoidance.
- EC2 disk pressure from images, logs, and local monitoring data.
- Manual host lifecycle concerns.
- Cleaner image-based deployments.
- Managed task health checks and replacement.
- CloudWatch Logs integration.
- A clearer path to scale the backend service later.

The migration should preserve what is already working:

- FastAPI app behavior.
- Existing ECR backend image.
- Supabase as the external database/auth provider.
- Mobile API contract.
- Public API domain: `https://api.foodchecker.zkelder.dev`.
- `/health`, `/status`, and `/analyze` behavior.
- `selected_rules` as the request field used by mobile and backend clients.

## Current Architecture

Current production path:

```text
GitHub Actions
  -> AWS OIDC
  -> Amazon ECR image
  -> AWS SSM Run Command
  -> EC2 host
  -> Docker Compose pull/up
  -> Caddy HTTPS reverse proxy
  -> FastAPI on 127.0.0.1:8000
```

Current responsibilities:

- GitHub Actions builds and pushes the backend image to ECR with commit SHA and
  `latest` tags.
- GitHub Actions authenticates to AWS through OIDC.
- SSM Run Command is the primary no-SSH deploy path.
- Caddy terminates HTTPS and serves public API traffic.
- FastAPI is bound to localhost only on EC2.
- Supabase/PostgreSQL remains external.
- Private Prometheus, Grafana, and node_exporter run on EC2 and are accessed
  through SSH tunnel only.
- Scheduled GitHub synthetic checks validate public `/health`, `/status`, and
  `/analyze`.
- Deploy-time checks validate local `/health` and synthetic `/analyze`.
- Terraform provisions AWS-side resources.
- Ansible configures the EC2 host.
- Legacy SSH/source-build deployment exists only as fallback.

Public raw TCP 8000 is intentionally closed in the Terraform security group.

## Target Architecture

Target ECS/Fargate production path:

```text
GitHub Actions
  -> AWS OIDC
  -> Amazon ECR image
  -> ECS task definition/service update
  -> ECS Fargate task
  -> Application Load Balancer
  -> api.foodchecker.zkelder.dev
```

Target responsibilities:

- GitHub Actions continues to build and push the backend image to ECR.
- ECS Fargate runs the FastAPI task.
- An Application Load Balancer fronts the ECS service.
- The ALB target group health check uses `/health`.
- `api.foodchecker.zkelder.dev` points to the ALB after DNS cutover.
- ECS task logs go to CloudWatch Logs.
- ECS task environment variables and secrets use AWS-managed mechanisms,
  preferably SSM Parameter Store or Secrets Manager for sensitive values.
- Supabase remains external.
- Scheduled synthetic checks continue after DNS cutover.
- EC2 remains online temporarily as rollback/fallback.
- Current private Grafana may remain on EC2 until a replacement monitoring
  approach is selected.

## Service Boundary Decision

Initial ECS migration keeps OCR inside the FastAPI container.

Do not split OCR into a separate service during the first ECS migration.

Reasons:

- Current scan volume does not justify a service split.
- The synchronous mobile scan flow is simpler with one backend service.
- Splitting OCR adds queueing, service discovery, timeouts, retries, and
  possibly mobile polling.
- ECS migration should minimize app behavior changes.
- The current bottleneck has not been proven to require independent OCR
  scaling.

Future OCR split options:

- Synchronous internal OCR service behind private service discovery.
- SQS-backed asynchronous OCR worker.

Trigger conditions for a future OCR split:

- Scan latency regularly exceeds acceptable limits.
- OCR CPU or memory pressure hurts normal API responsiveness.
- Independent OCR scaling becomes necessary.
- A heavier OCR model or engine is added.
- Batch processing, retries, or delayed processing become important.

## Terraform Resources Likely Needed

Planned resources, not implemented in this document:

- ECS cluster.
- ECS task execution role.
- ECS task role, if the app needs AWS API access.
- CloudWatch log group.
- ECS task definition.
- ECS service.
- Application Load Balancer.
- ALB listener.
- ALB target group.
- ALB security group.
- ECS task security group.
- Optional ACM certificate if using AWS-managed TLS termination.
- DNS/CNAME plan through Cloudflare.
- IAM permissions for GitHub Actions to register task definitions and update
  the ECS service.
- SSM Parameter Store or Secrets Manager references/resources for sensitive
  configuration.
- Optional CloudWatch alarms later.

## Networking and Security Design

- Public ingress terminates at the ALB.
- ECS tasks should not be public.
- ECS task security group accepts inbound traffic only from the ALB security
  group.
- ECS tasks need outbound internet access for Supabase and external
  dependencies.
- Sensitive environment variables should not be hardcoded into Terraform state
  if avoidable.
- Current EC2 remains online until ECS is verified.
- Raw public TCP 8000 closure should remain true in ECS.
- Monitoring and admin interfaces should not be exposed publicly.
- Future Grafana public access, if ever needed, should use Cloudflare Access,
  OAuth, or equivalent protection.

## HTTPS and DNS Strategy

Options to confirm before implementation:

- Cloudflare DNS CNAME to the ALB DNS name.
- Cloudflare proxy behavior for the API hostname.
- ACM certificate on the ALB if AWS terminates TLS.
- Cloudflare Full or Full Strict TLS mode.

Recommended initial approach:

- Keep `api.foodchecker.zkelder.dev` stable for mobile clients.
- Stand up ECS behind a temporary ALB DNS name first.
- Validate `/health`, `/status`, and `/analyze` through the ALB before DNS
  cutover.
- Lower DNS TTL before cutover where possible.
- Cut over Cloudflare DNS only after ECS service health and synthetic checks
  pass through the ALB path.

Rollback considerations:

- If ECS cutover fails, point DNS back to the current EC2/Caddy path.
- Keep EC2 deployment intact during and shortly after cutover.
- Avoid changing the mobile app API URL.

Open questions:

- Whether Cloudflare should proxy the ALB hostname or use DNS-only mode.
- Whether TLS terminates at Cloudflare only, at ALB through ACM, or both.
- Whether the final ALB listener should redirect HTTP to HTTPS.

## Secrets and Environment Strategy

Production settings must move into ECS task configuration.

Expected configuration categories:

- `APP_ENVIRONMENT=production`.
- App version/environment metadata.
- CORS origins.
- Supabase URL and auth/JWT configuration.
- Database connection details.
- Upload size limits.
- Any OCR/runtime configuration currently provided through `.env`.

Guidance:

- Store sensitive values in SSM Parameter Store or Secrets Manager.
- Use plain task environment variables only for non-sensitive config.
- Do not commit real production values.
- GitHub Actions should not print secrets.
- Avoid putting sensitive values directly in Terraform state when a safer
  reference pattern is practical.

Supabase/PostgreSQL remains external in this ECS phase.

## Deployment Flow

Current deployment:

```text
GitHub Actions
  -> OIDC
  -> SSM
  -> EC2
  -> docker compose pull/up
  -> /health + /analyze deploy checks
```

Target deployment:

```text
GitHub Actions
  -> OIDC
  -> ECR image push
  -> render/register ECS task definition
  -> update ECS service
  -> wait for service stability
  -> validate /health and /analyze
```

Implementation guidance:

- Keep the existing EC2 deploy workflow while ECS is being built.
- Add a new `deploy-backend-ecs.yml` workflow rather than replacing the EC2
  deploy workflow immediately.
- Prefer explicit commit SHA image tags for ECS deployments.
- Keep `latest` if useful for manual inspection or compatibility, but avoid
  relying on it for production rollback.
- Validate ECS first through the temporary ALB URL or final domain after DNS
  cutover.

## Migration Steps

Phase A: Design/doc only.

Phase B: Add Terraform ECS resources behind clear variables or a separate
module; no DNS cutover.

Phase C: Deploy ECS service reachable through temporary ALB DNS name.

Phase D: Validate `/health`, `/status`, and `/analyze` through ALB DNS.

Phase E: Add GitHub Actions ECS deployment workflow.

Phase F: Run EC2 and ECS in parallel briefly.

Phase G: Cut over `api.foodchecker.zkelder.dev` DNS to ALB.

Phase H: Monitor scheduled synthetic checks and logs.

Phase I: Keep EC2 fallback for a short period.

Phase J: Retire or repurpose EC2/Caddy/Compose when stable.

## Rollback Plan

- Keep EC2 deployment intact during migration.
- If ECS cutover fails, revert DNS to the current EC2/Caddy path.
- Keep previous ECR image tags for rollback.
- Scheduled synthetic checks validate the public API after cutover.
- Do not destroy EC2 resources until ECS has been stable for a defined period.

Rollback decision points:

- ECS task cannot become healthy.
- ALB health checks fail.
- `/health` passes but `/status` or synthetic `/analyze` fails.
- Scheduled synthetic checks fail after DNS cutover.
- CloudWatch Logs show startup/runtime errors that are not present on EC2.

## Monitoring and Logging Plan

Initial ECS monitoring:

- ECS task logs to CloudWatch Logs.
- ALB target health.
- Scheduled GitHub synthetic checks continue.
- Existing private Grafana may remain on EC2 temporarily.

Future options:

- CloudWatch alarms with SNS.
- Grafana alerts.
- Grafana Cloud.
- AWS Managed Prometheus.
- CloudWatch dashboards.

Do not expose raw Prometheus or Grafana publicly. Decide later whether EC2
Grafana is retained, replaced, or moved.

## Database and Rules Rework Placement

Large ingredient/rules database rework should happen after ECS migration unless
product quality requires urgent small updates.

Reasons:

- DB-backed rules need migrations.
- Seed/import tooling needs rollout safety.
- Cached active rules need a clear invalidation strategy.
- It is better to build this on the target runtime than on the old EC2 path.

Small static rule alias additions can happen before ECS if needed.

Preserve the mobile API contract: `selected_rules` remains `selected_rules`.

## Future Rules Database Concept

Possible future tables and workflow:

- `rules` table.
- `rule_aliases` table.
- Category and severity fields.
- Active/inactive flags.
- Source/notes fields if useful.
- Seed/import script.
- Tests for duplicate aliases and expected matches.
- Analyzer uses cached active rules.
- `/rules` returns active rules.
- `/analyze` uses the same canonical rule source.

## Cost Considerations

Practical cost notes:

- ALB has a fixed monthly cost.
- Fargate task cost depends on CPU, memory, and uptime.
- Current EC2 has low fixed cost but requires host maintenance.
- ECS may cost more than the small EC2 host while providing cleaner operations.
- Review expected monthly cost before implementation.
- Do not rely on exact pricing in this document without verifying current AWS
  pricing.

## Risks and Open Questions

- ECS/Fargate cost estimate.
- ALB monthly cost.
- ACM/Cloudflare TLS decision.
- Secrets management choice.
- ECS task CPU/memory sizing with OCR/Tesseract included.
- Whether the current Docker image includes all Tesseract runtime dependencies
  for ECS.
- How to handle private Grafana after EC2 retirement.
- App Store review timing.
- DNS TTL and rollback timing.
- Whether `/health` is enough for ALB target health while `/analyze` remains
  synthetic-only.
- How to run one-off migrations/seeding jobs later for rules DB rework.

## Recommended Next Implementation Step

After this plan is approved:

1. Add Terraform ECS resources without DNS cutover.
2. Keep EC2 production active.
3. Validate ECS through a temporary ALB URL before changing DNS.
4. Add ECS deploy workflow only after the base ECS service is reachable.
5. Keep EC2 until ECS has been stable for an agreed period.

## Non-Goals

- No OCR worker split in the initial ECS migration.
- No Supabase/PostgreSQL migration.
- No mobile app API contract changes.
- No public Grafana exposure.
- No EC2 teardown during the first migration.
- No rules database rework during the first ECS migration.
