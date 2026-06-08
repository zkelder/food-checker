# Food Checker

Food Checker is a mobile-first ingredient scanning app that helps users review
ingredient labels for potential allergens, dietary conflicts, and additive
concerns. It is an informational screening tool, not a medical diagnosis tool.

## Status

- MVP / public beta style project.
- Backend CI and mobile CI are in place under `.github/workflows/`.
- Backend images build and deploy through GitHub Actions, AWS OIDC, ECR, SSM,
  and Docker Compose.
- TestFlight / EAS mobile builds are configured and still run manually.
- Production hardening is incremental; observability and runbook polish are the
  next DevOps priorities.

## Live URLs

- API: https://api.foodchecker.zkelder.dev
- Privacy: https://zkelder.dev/foodchecker/privacy.html
- Support: https://zkelder.dev/foodchecker/support.html
- Terms: https://zkelder.dev/foodchecker/terms.html

## What It Does

- Scans ingredient label images with OCR.
- Analyzes ingredient text against ingredient screening rules.
- Highlights potential allergens, dietary conflicts, and additive concerns.
- Saves scan history and user profile data where supported.
- Shows OCR quality warnings when extracted text may be incomplete or noisy.

Ingredient rules are curated and expandable. They are not a complete medical
ingredient database, and matches should be treated as review prompts.

## Tech Stack

- FastAPI / Python
- Expo / React Native
- Supabase
- SQLAlchemy with PostgreSQL in deployed environments and SQLite for local/test defaults
- Tesseract OCR / `pytesseract`
- GitHub Actions
- EAS for manual mobile builds

## Architecture Overview

The Expo mobile app talks to the FastAPI API at
`https://api.foodchecker.zkelder.dev`. The API handles image upload validation,
OCR, ingredient analysis, user profile data, and scan history. Supabase supports
authentication and deployed data storage. Public privacy, support, and terms
pages are hosted under `zkelder.dev`.

## DevOps Architecture

- Terraform owns AWS infrastructure, IAM, ECR, GitHub OIDC, EC2 instance
  profile, and SSM permissions.
- Ansible owns EC2 host configuration: baseline packages, Docker, Docker Compose
  plugin, AWS CLI v2, SSM Agent, and app directory checks.
- GitHub Actions owns backend CI, mobile CI, backend image publishing, and
  manual no-SSH backend image deployment.
- ECR stores backend API images tagged by commit SHA and `latest`.
- SSM is the no-SSH deployment channel from GitHub Actions to EC2.
- Docker Compose runs the single-host backend container on EC2.
- Private Prometheus/Grafana monitoring runs through Docker Compose and is
  accessed by SSH tunnel only.

## Backend Local Development

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m pytest -q
uvicorn app.main:app --reload
```

In another terminal:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/version
```

## Mobile Local Development

```bash
cd mobile
npm ci
npx expo config --type public
npm run typecheck
npm run lint
npm start
```

## CI Checks

- Backend CI runs dependency install, a backend import check, and `python -m pytest -q`.
- Mobile CI runs Expo config validation, TypeScript typecheck, and lint.
- Backend image deployment is manual through GitHub Actions after CI/image
  publishing passes.
- Workflows live under `.github/workflows/`.

## API Observability

- `GET /health` returns a basic API health status.
- `GET /version` returns public service metadata.
- `GET /status` returns public-safe service status metadata.
- `GET /metrics` exposes Prometheus metrics for private scraping.
- Every API response includes an `X-Request-ID` header.
- Clients may send `X-Request-ID` to correlate client reports with backend logs.
- Backend logging should avoid request bodies, full ingredient text, images, auth tokens, and secrets.

## Documentation

- [CI/CD](docs/ci-cd.md)
- [Monitoring](docs/monitoring.md)
- [Roadmap](docs/roadmap.md)
- [Production runbook](docs/production-runbook.md)
- [Mobile release pipeline](docs/mobile-release-pipeline.md)
- [TestFlight checklist](docs/testflight-checklist.md)

## Disclaimer

Food Checker is an informational tool. OCR and ingredient matching can be
imperfect. Users should verify labels directly and consult appropriate
professionals for medical, allergy, or dietary decisions.
