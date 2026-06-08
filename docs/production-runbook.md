# Production Runbook

## Overview

- API: https://api.foodchecker.zkelder.dev
- Components: FastAPI backend, Expo mobile app, Supabase, and public legal/support pages under `zkelder.dev`.
- Mobile builds are handled manually through EAS/TestFlight for now.
- Production public API traffic should go through Caddy/HTTPS. The FastAPI
  container binds port 8000 to `127.0.0.1` on the EC2 host for Caddy and local
  health checks only.
- The Terraform security group exposes public HTTP/HTTPS for Caddy and trusted
  SSH only; it does not expose FastAPI's raw TCP 8000 port.
- Monitoring services are private and reachable through SSH tunnels only.

## Public Endpoint Verification

```bash
curl https://api.foodchecker.zkelder.dev/health
curl https://api.foodchecker.zkelder.dev/version
curl https://api.foodchecker.zkelder.dev/status
curl -H "X-Request-ID: manual-check-$(date +%s)" https://api.foodchecker.zkelder.dev/health
curl -X POST https://api.foodchecker.zkelder.dev/analyze -H "Content-Type: application/json" -d '{"text":"milk, wheat flour, soybean oil, red 40, sugar","selected_rules":["milk"]}'
```

Confirm that responses are successful and include an `X-Request-ID` response
header.

`/health` alone is not enough to validate a production deploy. It can pass while
application logic such as ingredient analysis is broken, so include the
synthetic `/analyze` request when verifying a release.

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

## Production Deploy Verification

Primary backend deploys use the manual `Deploy Backend Image` workflow. It
deploys through GitHub Actions OIDC, AWS SSM Run Command, ECR, and Docker
Compose on the EC2 host.

After a deploy, verify:

```bash
curl https://api.foodchecker.zkelder.dev/health
curl -X POST https://api.foodchecker.zkelder.dev/analyze -H "Content-Type: application/json" -d '{"text":"milk, wheat flour, soybean oil, red 40, sugar","selected_rules":["milk"]}'
curl http://127.0.0.1:8000/health
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker inspect food-checker-api --format '{{.Config.Image}}'
df -h
docker system df
```

The synthetic `/analyze` response should include `match_count >= 1`.

From outside the EC2 host, direct Docker access to FastAPI should not be served:

```bash
curl http://54.159.60.186:8000/health
```

That public port 8000 check should fail or not connect. The public supported
path remains `https://api.foodchecker.zkelder.dev/health`.

## Monitoring Verification

Monitoring is deployed by `docker-compose.prod.yml` and bound to localhost on
the EC2 host. Do not expose Grafana, Prometheus, or node_exporter publicly.
Prometheus local retention is 48 hours to keep disk usage small on the current
temporary EC2 host while preserving enough recent data for troubleshooting.
The `Production Synthetic Check` GitHub Actions workflow runs every 30 minutes
and verifies the public API path from outside the EC2 host with `/health`,
`/status`, and a small `/analyze` request.

Run these on the EC2 host:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
curl http://127.0.0.1:8000/metrics
curl http://127.0.0.1:9090/-/healthy
curl http://127.0.0.1:3000/api/health
```

Open Grafana through an SSH tunnel:

```bash
ssh -i ~/.ssh/food-checker-aws -L 3000:127.0.0.1:3000 ubuntu@54.159.60.186
```

Then open `http://localhost:3000`.

Common troubleshooting commands:

```bash
docker logs food-checker-prometheus --tail 80
docker logs food-checker-grafana --tail 80
docker logs food-checker-node-exporter --tail 80
docker system df
df -h
```

See [Monitoring](monitoring.md) for the full private dashboard workflow.

## Disk Cleanup

Safe cleanup commands:

```bash
docker image prune -a -f --filter "until=168h"
docker builder prune -a -f --filter "until=168h"
rm -rf /tmp/aws || true
```

Do not prune Docker volumes unless that action has been intentionally reviewed.
Volumes may contain persistent data or state for services on the host.

## Rollback Checklist

1. Identify the last known good backend image tag in ECR, usually a previous
   commit SHA from the Backend Image workflow.
2. Re-run the `Deploy Backend Image` workflow with that previous SHA as the
   `image_tag` input.
3. Verify `/health` and the synthetic `/analyze` request.
4. Check the running image:

```bash
docker inspect food-checker-api --format '{{.Config.Image}}'
```

5. Check logs for request IDs and recurring errors.

## Troubleshooting

- API unreachable: verify DNS, HTTPS termination, host reachability, and backend process status.
- Failed health check: check process logs, environment variables, and database connectivity.
- Scheduled synthetic check gets 403 while local `curl` succeeds: check
  Cloudflare, WAF, bot protection, or User-Agent blocking. The workflow sends
  `FoodCheckerSyntheticCheck/1.0 (+https://foodchecker.zkelder.dev)` as its
  User-Agent.
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
