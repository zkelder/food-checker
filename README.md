# Food Checker

Food Checker is a mobile-first ingredient screening app for reviewing packaged
food labels. Users scan an ingredient label, the backend extracts text with OCR,
and the app highlights selected allergens, dietary conflicts, and additive
concerns.

Food Checker is an informational tool only. It is not medical advice, it is not
a diagnostic product, and users should always verify ingredients directly on the
product label.

## Current Status

- MVP / beta-stage portfolio project, preserved as an engineering case study.
- **The AWS backend is intentionally shut down and the API is not currently available.** Do not interpret a failed request to the former endpoint as evidence of a running service.
- The former deployment used EC2, Docker Compose, Caddy/HTTPS, ECR images,
  GitHub Actions OIDC, and SSM-based no-SSH deploys.
- Expo / React Native mobile release flows, architecture, screenshots, code,
  and operational documentation are preserved for review.
- ECS/Fargate and RDS-style platform changes were plans, not the implemented deployment.

## Portfolio Links

- Case study: `https://zkelder.dev/foodchecker/`
- Public source: `https://github.com/zkelder/food-checker`
- Former API: `https://api.foodchecker.zkelder.dev` (intentionally offline)
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

When deployed, the API was served through Caddy at
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
- A scheduled production synthetic check was designed to verify `/health`, `/status`, and a
  small `/analyze` request while the backend was deployed. It does not establish live
  service availability today.

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

Historical deployment smoke checks (run only after an intentional, reviewed
redeployment; these do not work while AWS is shut down):

```bash
curl https://api.foodchecker.zkelder.dev/health
curl https://api.foodchecker.zkelder.dev/version
curl https://api.foodchecker.zkelder.dev/status
curl -X POST https://api.foodchecker.zkelder.dev/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"milk, wheat flour, soybean oil, red 40, sugar","selected_rules":["milk"]}'
```

## Restart boundary

No restart is currently planned. Before making this a live service again:
review auth behavior for requests without a bearer token, inspect the last
recorded `/analyze` HTTP 500 failure, validate cloud-origin access controls,
confirm the AWS resource and data-retention plan, and run an authenticated
end-to-end smoke test. Restoring hosting without those checks is not a
release-readiness decision.

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
