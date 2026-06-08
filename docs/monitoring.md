# Monitoring

Food Checker has a lightweight private monitoring stack for the EC2 backend
host. It is intended for operational troubleshooting and sanitized portfolio
dashboard screenshots, not public access.

## Architecture

- FastAPI exposes `/metrics`.
- Prometheus scrapes FastAPI, node_exporter, and Prometheus itself.
- node_exporter exposes host CPU, memory, filesystem, and system metrics.
- Grafana reads from Prometheus and provisions the `Food Checker Overview`
  dashboard.

Grafana, Prometheus, and node_exporter are bound to `127.0.0.1` on the EC2
host. Do not add public security group ingress or Caddy routes for monitoring.

Prometheus keeps 48 hours of local metrics. This is intentionally lightweight
for the current small EC2 host and temporary single-host setup, while preserving
enough recent data for troubleshooting and dashboard screenshots.

## Access

Open a private Grafana tunnel:

```bash
ssh -i ~/.ssh/food-checker-aws -L 3000:127.0.0.1:3000 ubuntu@54.159.60.186
```

Then open:

```text
http://localhost:3000
```

Open a private Prometheus tunnel when needed:

```bash
ssh -i ~/.ssh/food-checker-aws -L 9090:127.0.0.1:9090 ubuntu@54.159.60.186
```

Then open:

```text
http://localhost:9090
```

Grafana uses its default login behavior in this first pass. Keep access private
through SSH tunneling.

## EC2 Verification

Run these on the EC2 host:

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
curl http://127.0.0.1:8000/metrics
curl http://127.0.0.1:9090/-/healthy
curl http://127.0.0.1:3000/api/health
```

Public API verification still goes through Caddy/HTTPS:

```bash
curl https://api.foodchecker.zkelder.dev/health
curl https://api.foodchecker.zkelder.dev/status
```

Monitoring ports should not respond publicly:

```bash
curl http://54.159.60.186:3000
curl http://54.159.60.186:9090
curl http://54.159.60.186:9100
```

Those public checks should fail or not connect.

## Dashboard Notes

The starter dashboard is provisioned from:

```text
monitoring/grafana/dashboards/food-checker-overview.json
```

It includes panels for API request rate, status/error rate, latency, analyze and
image-scan activity, host CPU, memory, disk usage, and Prometheus target health.

The FastAPI panel queries use the app's `food_checker_*` Prometheus metrics. If
a panel is empty after first scrape, check the exact metric names at `/metrics`
and adjust the query.

Do not expose raw Grafana or Prometheus publicly. If public dashboard access is
ever required, put it behind Cloudflare Access, OAuth, or equivalent protection.
Public portfolio pages should use sanitized screenshots or summary cards, not
live Grafana or Prometheus URLs.

## Troubleshooting

- Prometheus target down: open Prometheus through the SSH tunnel, check
  `Status -> Targets`, then verify the target from the EC2 host with `curl`.
- Grafana datasource missing: check the provisioning file under
  `monitoring/grafana/provisioning/datasources/` and restart the Grafana
  container.
- Dashboard has no data: wait for the first scrape interval, then confirm
  Prometheus has samples for the relevant metric.
- EC2 memory or disk pressure: run `free -h`, `df -h`, and
  `docker system df`. Use the production runbook cleanup commands when needed.
- `/metrics` unreachable from Prometheus: verify the API container is healthy
  and Prometheus can resolve `food-checker-api:8000` on the Compose network.
- SSH tunnel issues: confirm SSH access works, the local port is free, and the
  service is listening on `127.0.0.1` on the EC2 host.
