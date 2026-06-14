# Food Checker

Food Checker is a mobile-first ingredient screening app for reviewing packaged
food labels. Users scan an ingredient label, the backend extracts text with OCR,
and the app highlights selected allergens, dietary conflicts, and additive
concerns.

Food Checker is an informational tool only. It is not medical advice, it is not
a diagnostic product, and users should always verify ingredients directly on the
product label.

## Current Status

- MVP / beta-stage portfolio project.
- FastAPI backend is deployed at `https://api.foodchecker.zkelder.dev`.
- Expo / React Native mobile app is configured for EAS and TestFlight-style
  manual release flows.
- Current production backend runs on EC2 with Docker Compose, Caddy/HTTPS, ECR
  images, GitHub Actions OIDC, and SSM-based no-SSH deploys.
- ECS/Fargate and RDS-style platform changes are future planning items, not the
  current production architecture.

## Live Links

- API: `https://api.foodchecker.zkelder.dev`
- Privacy: `https://zkelder.dev/foodchecker/privacy.html`
- Support: `https://zkelder.dev/foodchecker/support.html`
- Terms: `https://zkelder.dev/foodchecker/terms.html`

## Product Capabilities

- OCR-based label scanning for JPG, PNG, and WEBP images.
- Ingredient matching against curated user-selected screening rules.
- Supabase email/password authentication for the mobile app.
- User preference and scan history support.
- OCR quality warnings when extracted text may be incomplete or noisy.
- Public-safe health, version, status, and metrics endpoints for operations.

Ingredient rules are curated and expandable, but they are not a complete medical
ingredient database. Matches should be treated as review prompts.

## Architecture

```text
Expo mobile app
  -> FastAPI backend
  -> OCR + ingredient analysis
  -> Supabase auth/data

GitHub Actions
  -> AWS OIDC
  -> ECR backend image
  -> SSM Run Command
  -> EC2 + Docker Compose
  -> Caddy HTTPS reverse proxy
```

The production API is served through Caddy at
`https://api.foodchecker.zkelder.dev`. The FastAPI container is bound to
`127.0.0.1:8000` on the EC2 host, so raw port 8000 is not intended to be public.
Private Prometheus and Grafana monitoring run on the same host and are accessed
through SSH tunnels only.

## Tech Stack

- Backend: FastAPI, Python, SQLAlchemy, Tesseract OCR, Prometheus metrics.
- Mobile: Expo, React Native, TypeScript, Expo Router, EAS.
- Auth/data: Supabase.
- Cloud: AWS EC2, ECR, IAM/OIDC, SSM.
- DevOps: GitHub Actions, Docker Compose, Terraform, Ansible.
- Local/test defaults: SQLite for backend tests and local development.

## Backend Highlights

- Image upload validation and OCR extraction pipeline.
- Ingredient analysis API with selected rule matching.
- Request ID middleware and structured operational logging.
- Public `/health`, `/version`, and `/status` endpoints.
- Private `/metrics` endpoint for Prometheus scraping.
- Pytest coverage for API smoke tests, authentication, analyzer behavior, and
  OCR upload handling.

## Mobile Highlights

- Native mobile app built with Expo Router.
- Supabase sign-in/sign-up flow.
- Preference selection for ingredient concerns.
- Scan flow with camera/library image selection.
- Account, history, beta diagnostics, legal/support links, and data deletion
  request affordances.
- Manual EAS/TestFlight release process documented in `docs/`.

## Cloud And DevOps Highlights

- GitHub Actions backend CI and mobile CI.
- AWS OIDC instead of long-lived AWS access keys.
- ECR image publishing with commit SHA and `latest` tags.
- Primary backend deploy path uses SSM Run Command, ECR image pull, and Docker
  Compose restart on EC2.
- Legacy SSH/source deploy paths are retained only as fallbacks.
- Terraform owns AWS infrastructure; Ansible owns EC2 host prerequisites.
- Scheduled production synthetic checks verify `/health`, `/status`, and a
  small `/analyze` request.

## Local Development

Backend:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt -r requirements-dev.txt
python -m pytest -q
uvicorn app.main:app --reload
```

Mobile:

```bash
cd mobile
npm ci
npx expo config --type public
npm run typecheck
npm run lint
npm start
```

Optional Vite frontend:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

## Verification Commands

```bash
git diff --check
python -m pytest -q
python -c "from app.main import app; print(app.title)"
cd mobile && npx expo config --type public && npm run typecheck && npm run lint
```

Production smoke checks:

```bash
curl https://api.foodchecker.zkelder.dev/health
curl https://api.foodchecker.zkelder.dev/version
curl https://api.foodchecker.zkelder.dev/status
curl -X POST https://api.foodchecker.zkelder.dev/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"milk, wheat flour, soybean oil, red 40, sugar","selected_rules":["milk"]}'
```

## Deployment And Release Notes

- Backend CI runs automatically on pushes and pull requests to `main`.
- Backend images are published manually with the `Backend Image` workflow.
- Production backend deploys use the manual `Deploy Backend Image` workflow.
- Mobile CI validates Expo config, TypeScript, and lint checks.
- iOS production builds are manual through EAS/TestFlight.
- EAS Update is documented for future JavaScript/style/copy updates that do not
  require a native rebuild.

## Documentation

- [Roadmap](ROADMAP.md)
- [Detailed platform roadmap](docs/roadmap.md)
- [CI/CD](docs/ci-cd.md)
- [Production runbook](docs/production-runbook.md)
- [Monitoring](docs/monitoring.md)
- [Mobile release pipeline](docs/mobile-release-pipeline.md)
- [TestFlight checklist](docs/testflight-checklist.md)
- [ECS/Fargate migration plan](docs/ecs-migration-plan.md)

## Disclaimer

Food Checker may miss, misread, or misclassify ingredients because OCR and rule
matching are imperfect. The app is designed to support label review, not replace
direct label reading or professional medical, allergy, nutrition, or dietary
guidance.
