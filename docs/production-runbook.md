# Production Runbook

## Overview

- API: https://api.foodchecker.zkelder.dev
- Components: FastAPI backend, Expo mobile app, Supabase, and public legal/support pages under `zkelder.dev`.
- Mobile builds are handled manually through EAS/TestFlight for now.

## Public Endpoint Verification

```bash
curl https://api.foodchecker.zkelder.dev/health
curl https://api.foodchecker.zkelder.dev/version
curl -H "X-Request-ID: manual-check-$(date +%s)" https://api.foodchecker.zkelder.dev/health
```

Confirm that responses are successful and include an `X-Request-ID` response
header.

## Local Backend Verification

```bash
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

## Mobile Verification

```bash
cd mobile
npm ci
npx expo config --type public
npm run typecheck
npm run lint
```

## Environment Variables

Do not commit secrets or real production values.

- `DATABASE_URL`: backend database connection string.
- `CORS_ORIGINS`: comma-separated allowed browser origins.
- `APP_VERSION`: public API version metadata.
- `APP_ENVIRONMENT`: public API environment metadata.
- `MAX_IMAGE_UPLOAD_BYTES`: maximum accepted image upload size for OCR.
- `SUPABASE_URL`: backend Supabase project URL for JWT verification.
- `EXPO_PUBLIC_API_BASE_URL`: mobile API base URL.
- `EXPO_PUBLIC_SUPABASE_URL`: mobile Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: mobile Supabase anon key.

## Deployment / Restart Checklist

Use the host's current process manager or service setup.

1. SSH to the backend host.
2. Pull the latest `main`.
3. Activate the backend environment.
4. Install dependencies if `requirements.txt` changed.
5. Restart the backend process or service.
6. Verify `/health` and `/version`.
7. Check logs for request IDs, errors, OCR failures, and database connectivity issues.

## Rollback Checklist

1. Identify the last known good commit.
2. Prefer `git revert` for normal rollback.
3. Restart the backend process or service.
4. Verify `/health` and `/version`.
5. Check logs for request IDs and recurring errors.

## Troubleshooting

- API unreachable: verify DNS, HTTPS termination, host reachability, and backend process status.
- Failed health check: check process logs, environment variables, and database connectivity.
- Database or Supabase issue: verify `DATABASE_URL`, `SUPABASE_URL`, credentials, network access, and token validation errors.
- CORS issue: confirm `CORS_ORIGINS` includes the calling web origin.
- OCR timeout: ask for a clearer, closer image and check backend OCR logs by `request_id`.
- Oversized or unsupported image upload: verify MIME type and `MAX_IMAGE_UPLOAD_BYTES`.
- Mobile cannot reach API: confirm `EXPO_PUBLIC_API_BASE_URL`, device network access, and API `/health`.
- EAS/TestFlight build issue: check EAS build logs, Expo config output, and required public Expo environment variables.

## Operational Notes

- Do not log request bodies, full ingredient text, auth tokens, images, or secrets.
- Use `X-Request-ID` to correlate client reports with backend logs.
- Keep `MAX_IMAGE_UPLOAD_BYTES` in mind when investigating OCR upload failures.
