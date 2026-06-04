# Roadmap

This roadmap separates what is already working from the best next investments.
The current EC2 + Docker Compose + ECR + SSM architecture is a good MVP
deployment platform; the next work should make it more observable and easier to
operate before moving to heavier orchestration.

## Completed

- FastAPI backend with OCR, ingredient analysis, request IDs, `/health`, and
  `/version`.
- Expo / React Native mobile app with EAS/TestFlight pipeline support.
- Backend CI and mobile CI.
- GitHub Actions OIDC authentication to AWS.
- Backend image build and push to ECR.
- Terraform-managed AWS infrastructure, IAM, ECR, OIDC, EC2 instance profile,
  and SSM permissions.
- Ansible-managed EC2 host prerequisites: Docker, Docker Compose plugin, AWS CLI
  v2, SSM Agent, and app host checks.
- No-SSH backend image deployment through GitHub Actions -> OIDC -> SSM -> EC2
  -> ECR image pull -> Docker Compose restart.
- Local SSH deploy scripts retained as fallback paths.

## Recommended Priorities

1. Observability, logging, alerts, and runbook polish.
2. Secrets and environment hardening.
3. Ingredient database/rules quality and mobile results UX polish.
4. App Store/TestFlight release polish.
5. ECS migration only after the current single-host platform is observable and
   well documented.

Do not prioritize automated start/stop workflows unless EC2 cost control becomes
annoying. They add operational edge cases and are less valuable than visibility
into health, errors, deploys, and recovery.

## Near-Term Polish

- Add CloudWatch log shipping for backend/container logs.
- Add basic CloudWatch metrics and alarms for instance health, disk pressure,
  API health, and deploy failures where practical.
- Tighten the production runbook around deploy verification, rollback, SSM
  troubleshooting, and fallback SSH usage.
- Review production environment variables and secrets handling.
- Keep dependency files and Docker build context clean.

Best next DevOps step: observability plus runbook polish. The deployment path is
now strong enough; the next question is whether failures are visible, actionable,
and easy to recover from.

## Best Next DevOps Options

- Observability/monitoring with CloudWatch logs, metrics, and alarms.
  Recommended next because it improves every future deploy and incident.
- Production runbook polish.
  Recommended alongside observability so alerts map to concrete actions.
- Secrets/env hardening.
  Important soon; confirm where app, Supabase, database, and Expo values live,
  and reduce ad hoc host state.
- Terraform remote state.
  Useful later when multiple operators or CI-driven Terraform become real.
- Automated start/stop workflows.
  Optional only if EC2 costs become a recurring annoyance.
- ECS migration.
  Good later if single-host Docker Compose becomes limiting.
- Kubernetes/EKS.
  Stretch goal much later; currently too much platform for this app.

## Product/App Options

- Ingredient database and rules quality.
  Best next product investment. Better aliases, explanations, false-positive
  reduction, and curated categories improve the core value immediately.
- Mobile results UX polish.
  Keep making results clearer, calmer, and easier to verify against product
  labels.
- OCR quality and scan guidance.
  Improve user feedback when images are blurry, incomplete, or poorly framed.
- App Store readiness.
  Continue tightening legal/support links, screenshots, review notes, and
  TestFlight feedback before broader release.

## Later / Resume Stretch Goals

- ECS service behind an Application Load Balancer.
- Centralized secrets through AWS Secrets Manager or SSM Parameter Store.
- Blue/green or canary deployment flow.
- Terraform remote backend with locking.
- EAS release automation after manual release habits are stable.
- EKS only if the product grows into multiple services or needs Kubernetes
  primitives.

## Decision Rationale

- EC2 + Docker Compose now instead of ECS/EKS immediately:
  it keeps the MVP deploy path understandable, inexpensive, and easy to debug.
  The app has one backend container, so orchestration complexity would not pay
  for itself yet.
- SSM instead of SSH deploy:
  SSM lets GitHub Actions deploy without SSH keys and without making SSH the
  normal operational path.
- Ansible instead of package installs in deploy scripts:
  host setup is durable configuration, while deploy scripts should only deploy.
- GitHub OIDC instead of long-lived AWS keys:
  OIDC provides short-lived credentials scoped by IAM trust policy and avoids
  storing AWS access keys in GitHub secrets.
- SSH scripts as fallback instead of primary deploy:
  keeping them helps recovery and debugging, but the normal path is now the
  no-SSH SSM workflow.

## Operating Model

- Infra changes: Terraform.
- Host config changes: Ansible.
- Backend changes: Backend CI -> Backend Image -> Deploy Backend Image.
- Mobile changes: Mobile CI -> EAS/TestFlight process.
- Troubleshooting: start with GitHub workflow logs, SSM command output,
  container logs, `/health`, `/version`, and the production runbook.

Related docs:

- [CI/CD](ci-cd.md)
- [Production runbook](production-runbook.md)
- [Mobile release pipeline](mobile-release-pipeline.md)
- [TestFlight checklist](testflight-checklist.md)
