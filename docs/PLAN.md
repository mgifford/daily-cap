# Daily CAP Implementation Plan

## Constraints

- Daily CAP is independent from Daily DAP.
- No changes are made in the Daily DAP repository.
- Reuse follows copy/adapt/reimplement patterns only.
- Daily CAP is community-run and not an official Government of Canada program.

## Step 1: Reuse Audit (Daily DAP -> Daily CAP)

Reusable patterns identified from Daily DAP FEATURES.md:

1. Pipeline shape

- ingest -> scan -> aggregate -> publish remains the base architecture.

1. Scanner orchestration

- parallel runner model, scanner adapters, normalized per-URL outputs.

1. Report output conventions

- dated daily directories at docs/reports/daily/YYYY-MM-DD/
- top-level dashboard index in docs/reports/index.html

1. CLI execution model

- single command entrypoint with date/limit/mode options.

1. Aggregation framing

- score aggregates and per-URL details in a report.json payload.

Components to replace for Canada:

1. U.S. traffic source (DAP API)

- replaced by Canadian ingest adapters (recent activity, top tasks, curated endpoints).

1. U.S. disability prevalence assumptions

- replaced in later phase with StatsCan-based prevalence map.

1. U.S.-specific policy references

- replaced by Canadian policy framing in report language and methodology.

## Phase Roadmap

### Phase 1 (implemented baseline)

- CAP codebase scaffold created with DAP-like structure.
- seed ingest implemented with bilingual EN/FR Canadian entries.
- scanner orchestration implemented with live/mock adapters.
- report payload + HTML publishing implemented.
- output parity directory structure implemented.

### Phase 2 (next)

- add canada.ca recent activity ingest parser.
- add top tasks parser and task-to-url mapping table.
- add maintained curated endpoints config file.

### Phase 3

- normalize service inventory schema:
  - id, canonical_url, url_en, url_fr
  - source, service_category, service_pattern
  - institution, rank_score, priority_weight, protected_flag
- enforce deterministic explainable ranking.

### Phase 4

- bilingual parity as first-class section:
  - EN/FR divergence flags
  - missing counterpart reporting.

### Phase 5

- accessibility statement detection:
  - statement URL discovery
  - governance signal extraction (contact, date, alternatives, language).

### Phase 6+

- CMS/design system detection.
- StatsCan impact model.
- service-pattern cohorts and trends.
- CI automation and tests.

## Immediate Focus

Keep MVP narrow before scaling:

1. Target 25-50 URLs first.
2. Maintain stable, deduplicated inventory definition.
3. Validate report parity and data model before adding advanced enrichment.
