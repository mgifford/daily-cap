# Daily CAP

Daily CAP (Canadian Analytics Project) is an independent daily quality
benchmarking pipeline for Canadian federal digital service entry points.

Daily CAP is not a Government of Canada program, service, or official product.
It is a community-run benchmarking project.

This repository is intentionally separate from Daily DAP. It borrows proven
pipeline patterns while using Canadian inputs and CAP-specific reporting.

## Current status

Phase 12 reporting is implemented:

- ingest -> scan -> aggregate -> publish pipeline
- static Canadian seed inventory with bilingual pairs where available
- mock and live scan modes
- deterministic ranking and tiered inventory selection
- bilingual parity analysis (EN/FR pairing and gap metrics)
- accessibility statement detection and statement quality signals
- CMS/design-system/platform fingerprint signals
- directional impact modeling from traffic and automated quality signals
- day-over-day trend comparison with regression alerts
- multi-context quality snapshots (desktop/mobile x light/dark)
- barrier-history trend tracking across daily runs
- prioritized issue tracking and institution scorecards
- institution trend pages and JSON exports for department-level history
- output parity path: `docs/reports/daily/YYYY-MM-DD/`

## Run

Runtime requirement: Node.js 24 or newer.

```bash
npm install
node run.js --date 2026-03-25 --limit 25 --mode mock
```

Key options:

- `--date YYYY-MM-DD`
- `--limit N`
- `--mode live|mock`
- `--output-root PATH`

## Output

- `docs/reports/daily/YYYY-MM-DD/report.json`
- `docs/reports/daily/YYYY-MM-DD/index.html`
- `docs/reports/daily/YYYY-MM-DD/details/*.json`
- `docs/reports/daily/YYYY-MM-DD/details/institution-trends.html`
- `docs/reports/daily/YYYY-MM-DD/details/institutions/*.html`
- `docs/reports/index.html`

## Structure

- `src/config/`
- `src/ingest/`
- `src/inventory/`
- `src/scanners/`
- `src/aggregation/`
- `src/enrichment/`
- `src/publish/`
- `src/utils/`
