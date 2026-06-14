# Food Checker Roadmap

This roadmap summarizes project status for portfolio review. The current
production backend is EC2 + Docker Compose + Caddy, deployed through GitHub
Actions, AWS OIDC, ECR, and SSM. ECS/Fargate remains future planning work.

## Completed

- FastAPI backend with OCR, ingredient analysis, request IDs, health/status
  endpoints, and Prometheus metrics.
- Expo / React Native mobile app with Supabase authentication, preferences,
  scan flow, history, and beta diagnostics.
- Backend and mobile CI workflows.
- AWS OIDC, ECR image publishing, and SSM-based no-SSH backend deployment.
- Terraform-managed AWS foundation and Ansible-managed EC2 host prerequisites.
- Private Prometheus/Grafana monitoring and scheduled production synthetic
  checks.
- EAS/TestFlight release documentation.

## In Progress / Pending

- TestFlight/App Store polish and review support.
- Operational runbook refinement around deploy verification, rollback, and
  monitoring response.
- Secrets and environment handling cleanup, especially moving public Expo build
  values into EAS-managed environment configuration when convenient.
- Ingredient rule quality improvements and clearer result explanations.

## Future Work

- CloudWatch log shipping, metrics, and alerts for production operations.
- ECS/Fargate migration behind an Application Load Balancer if the single-host
  architecture becomes limiting.
- Centralized secrets through AWS Secrets Manager or SSM Parameter Store.
- Terraform remote state with locking.
- EAS release automation after manual release habits are stable.
- Larger curated ingredient database with aliases, categories, and
  false-positive reduction.

## Nice-To-Have Improvements

- Portfolio screenshots using sanitized monitoring and mobile flows.
- More guided scan feedback for blurry, cropped, or low-light labels.
- Broader end-to-end smoke tests for authenticated mobile workflows.
- Lightweight admin tooling for ingredient rule review.
