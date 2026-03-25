# AGENTS.md

This file provides instructions for AI coding agents working on **Daily CAP**.

Daily CAP is a Canada-focused sibling project to Daily DAP. It should reuse proven ideas where useful, but it must remain an independent codebase and must not require changes to the U.S. Daily DAP repository.

## Project overview

Daily CAP benchmarks the quality of high-value Canadian federal digital service entry points.

The project is intended to:

- ingest public Canadian source data
- build a ranked inventory of service entry points
- scan pages with Lighthouse and related tooling
- report accessibility, performance, and quality trends
- compare English and French equivalents where possible
- detect accessibility statement presence and basic quality signals
- publish static daily reports with historical views

Daily CAP is **not** a legal compliance engine and does **not** perform manual accessibility audits. It provides automated signals and trend reporting.

## Core principles

When working on this project, always:

1. Preserve methodological honesty.
2. Prefer stable, explainable outputs over clever but opaque automation.
3. Treat English and French as separate scan targets when both exist.
4. Avoid overclaiming coverage, causality, or compliance.
5. Keep reports readable and similar in structure to Daily DAP reports.
6. Maintain accessibility in all generated HTML and documentation.
7. Keep Daily CAP independent from Daily DAP.

## Repository relationship to Daily DAP

Daily CAP may borrow patterns, ideas, and code from Daily DAP, but with strict constraints:

- Do not modify the Daily DAP repository as part of Daily CAP work.
- Do not introduce architecture that requires synchronized changes in Daily DAP.
- If reusing code, copy and adapt it into Daily CAP.
- If borrowing an idea from Daily DAP, document the adaptation clearly in commit messages or PR notes.
- Do not describe Daily CAP as a shared multi-product monorepo unless the repository explicitly becomes one in the future.

## Scope of the benchmark

Daily CAP should focus on **Canadian federal public digital service entry points**, not generic pages.

The benchmark may include, but is not limited to:

- sign-in pages
- account dashboards
- application forms
- status checkers
- estimators and calculators
- payment pages
- help and contact pages
- major task entry pages
- high-demand pages from public analytics sources

Avoid language that implies full Government of Canada coverage unless that is demonstrably true.

## Source data guidance

Daily CAP may use public Canadian sources such as:

- Canada recent activity pages
- Canada Top Tasks pages
- curated service endpoint inventories
- Statistics Canada prevalence data
- Government of Canada design system and policy guidance

When implementing ingestion:

- preserve source provenance
- store source timestamps where available
- distinguish between raw source records and normalized inventory records
- note when a source is partial or incomplete
- make parsers resilient to minor HTML changes
- isolate scraping/parsing logic so it can be tested independently

Do not invent undocumented APIs.

## Bilingual requirements

Bilingual support is a first-class requirement.

Where possible, inventory records should support:

- `url_en`
- `url_fr`
- language-pair metadata
- parity status

Agent expectations:

- scan English and French separately when both exist
- do not silently collapse both into one score
- report missing language counterparts explicitly
- report parity gaps carefully and factually
- avoid assuming the English and French pages are equivalent unless matched intentionally

## Accessibility statement checks

Daily CAP should detect the presence of accessibility statements and basic statement quality signals.

This is a governance and transparency feature, not proof of accessibility conformance.

Checks may include:

- whether a statement exists
- whether it is linked clearly
- whether contact information is present
- whether compliance status is mentioned
- whether alternatives or support paths are mentioned
- whether a date or freshness marker is present
- whether English and French variants exist

Do not claim that a page is accessible just because it has an accessibility statement.

## Report requirements

Reports should look and feel similar to Daily DAP reports.

Preserve these characteristics where practical:

- static HTML output
- dated report folders
- historical trend views
- summary tables and charts
- common-issues analysis
- readable methodology notes

Daily CAP reports should add Canadian-specific sections where implemented, such as:

- bilingual parity
- accessibility statement coverage
- service-pattern cohorts
- Canadian impact estimates
- design system or CMS breakdowns

Keep the report structure stable over time. Avoid unnecessary visual churn.

## Code style and editing rules

- Use UTF-8 encoding only.
- Never introduce smart quotes, em dashes, or Windows-1252 characters.
- Use absolute or project-relative paths in documentation and agent notes.
- Prefer small, testable modules over large files.
- Preserve existing naming conventions unless there is a strong reason to improve them.
- Avoid broad refactors that are unrelated to the task.
- Keep parsing, normalization, scanning, aggregation, and publishing concerns separated.

If you create heuristics, make them:
- explicit
- testable
- documented
- confidence-aware

## HTML, accessibility, and safety rules

Daily CAP benchmarks accessibility, so generated output must meet a high standard.

At minimum:

- use semantic HTML
- preserve heading order
- ensure tables have appropriate structure
- ensure labels, links, and controls are understandable
- avoid color-only communication
- ensure charts or visuals have text equivalents or summaries
- keep keyboard and screen-reader usability in mind

When rendering any source-derived content into HTML:

- escape user-controlled or source-controlled text
- do not trust scraped content
- sanitize or encode values before inserting into output
- prefer a central escaping utility such as `escapeHtml()`

## Testing instructions

Agents should run relevant checks before finishing work.

Preferred checks:

- install dependencies: `npm install`
- run tests: `npm test`
- run linting if configured: `npm run lint`
- run build/report generation checks if configured: `npm run build`
- run a fixture or mock report generation pass when touching ingest, aggregation, or publishing

If package scripts differ, use the repository’s actual scripts.

When changing code:

- add or update tests for the changed behavior
- add parser tests for ingest changes
- add snapshot or output tests for report changes where practical
- add regression tests for bugs you fix

Do not leave failing tests unaddressed without documenting why.

## Testing priorities

Pay special attention to tests for:

- source parsing
- URL normalization
- ranking logic
- bilingual pairing
- accessibility statement detection
- HTML escaping
- report generation
- historical manifest updates

If a heuristic is weak or probabilistic, test both positive and negative cases.

## Performance and stability

This project may scale to many URLs over time.

When making changes:

- avoid unnecessary network requests
- support caching where practical
- keep scan concurrency configurable
- preserve retry and timeout behavior
- ensure failures degrade gracefully
- make partial runs diagnosable rather than silently incomplete

A smaller, stable benchmark is better than a larger, noisy one.

## Methodology guardrails

Do not overstate what the project can prove.

Be precise in code comments, docs, and reports:

- say "automated signal" rather than "certified accessible"
- say "directional estimate" rather than "measured affected users"
- say "benchmark coverage" rather than "all Government of Canada services"
- say "detected statement" rather than "compliant statement"

When uncertain:
- preserve caveats
- expose confidence levels
- document assumptions

## Commit and PR guidance

When contributing changes:

- keep commits focused
- explain whether code was copied, adapted, or newly implemented
- note any methodology changes clearly
- mention report-facing changes in a way maintainers can verify
- update documentation when behavior changes

If AI was used to make a substantive contribution, update the repository’s AI disclosure section if one exists.

Do not list tools that were not actually used.

## File and path guidance

Use project-relative paths such as:

- `src/ingest/recent-activity.js`
- `src/inventory/build-inventory.js`
- `src/scanners/lighthouse-runner.js`
- `src/publish/render-report.js`
- `docs/reports/daily/2026-03-25/index.html`

Avoid ambiguous references like "the scanner file" or "that report script".

## What not to do

Do not:

- modify Daily DAP as part of Daily CAP work
- hard-code a permanent benchmark size without configuration
- assume every high-traffic URL is a meaningful service entry point
- assume English and French pages are interchangeable
- claim manual auditing happened when it did not
- claim accessibility statement presence equals accessibility compliance
- trust scraped HTML without escaping or sanitizing it
- weaken report accessibility for visual polish

## Recommended workflow for agents

1. Read this file.
2. Read `README.md`.
3. Read `ACCESSIBILITY.md` if the task touches UI, HTML, reports, or templates.
4. Inspect relevant tests before editing behavior.
5. Make the smallest change that fully solves the task.
6. Run tests and any relevant generation commands.
7. Update docs if outputs, methodology, or commands changed.

## Documentation expectations

If you change:

- data sources, update methodology docs
- report structure, update README screenshots or descriptions if needed
- scripts or commands, update setup instructions
- scoring or ranking logic, document the reason and impact
- output fields, update schema docs if present

## Future-oriented note

Daily CAP is expected to grow in phases.

Agents should prefer designs that can later support:

- larger URL inventories
- rotating discovery cohorts
- richer bilingual analysis
- service-pattern groupings
- platform metadata
- stronger trend and regression detection

Do not build speculative complexity too early, but do avoid dead ends that would block obvious next steps.