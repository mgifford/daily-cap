# Definition of done

This file defines when a Daily CAP report is complete enough to publish, review, and compare over time.

## Core standard

A report is done only when it is methodologically honest, reproducible, and clear about what it does and does not prove.

The report must describe automated signals, not legal compliance, certification, or manual audit results. It must preserve Daily CAP's independence, Canadian scope, and bilingual expectations.

## Scope and source expectations

A finished report must be based on Canadian federal public digital service entry points rather than generic informational pages.

Before a report is considered done:

- the inventory has been built from supported public Canadian inputs or documented seed data
- source provenance and run date are preserved in the generated data
- English and French counterparts are treated as separate targets when both exist
- missing language counterparts are surfaced rather than hidden
- any partial coverage, fallback mode, or source limitation is made explicit

## Pipeline completion expectations

A finished report must successfully pass through the current Daily CAP flow: ingest, inventory, scan, aggregate, and publish.

Before a report is considered done:

- the run completes without unhandled failures
- scan results are available for the URLs included in the report, or missing data is clearly explained
- aggregation completes for the report-wide summaries and detail exports
- publish steps write the expected dated output folder and report index pages
- historical comparison data is included when prior report data exists

## Required output artifacts

A finished report must publish the core artifacts that make the run reviewable and reusable.

At minimum, the report should include:

- `docs/reports/daily/YYYY-MM-DD/index.html`
- `docs/reports/daily/YYYY-MM-DD/report.json`
- `docs/reports/daily/YYYY-MM-DD/details/` JSON exports for implemented detail sections
- `docs/reports/index.html`

If institution pages, archive pages, or other derived outputs are part of the current pipeline, they must be updated consistently for the same run.

## Required report content

A finished report must contain the sections and signals needed to explain the day's results without overclaiming.

For the current Daily CAP implementation, that means the published report should include, where data is available:

- overall accessibility, performance, and quality summaries
- methodology caveats and clear automated-signal language
- bilingual parity results, including gap reporting and missing counterpart reporting
- accessibility statement detection coverage and statement-quality signals
- priority issue analysis and recurring issue patterns
- trend comparison with the previous report when historical data exists
- directional impact estimates presented as estimates, not measured affected users
- institution-level summaries and trend views for implemented institution reporting
- links to downloadable detail data that support the public HTML summary

## Accessibility and content safety expectations

A finished report must meet the project's own accessibility and trust standards.

Before a report is considered done:

- generated HTML uses semantic structure and a valid heading order
- tables, links, controls, and charts remain understandable and accessible
- source-derived text is escaped before rendering into HTML
- the report does not rely on colour alone to communicate meaning
- the report does not claim that a detected accessibility statement proves accessibility
- the report does not imply full Government of Canada coverage unless that is demonstrably true

## Quality checks

A finished report must be supported by the repository's current validation expectations.

Before sign-off:

- dependencies install successfully with `npm install`
- the test suite passes with `npm test`
- any report-facing documentation changes needed to explain methodology or output changes are included
- known gaps, confidence limits, and incomplete coverage are disclosed rather than silently ignored

## Practical release checklist

A Daily CAP report is done when all of the following are true:

- [ ] The run used supported Canadian federal service-entry inputs and preserved provenance.
- [ ] English and French URLs were handled as separate targets where both exist.
- [ ] The pipeline completed ingest, scan, aggregate, and publish steps successfully.
- [ ] The dated HTML and JSON report artifacts were generated in the expected locations.
- [ ] The public report includes the current core summary, parity, statement, trend, and issue sections.
- [ ] Methodology caveats are visible and use precise automated-signal language.
- [ ] Accessibility and HTML safety requirements were preserved.
- [ ] `npm install` and `npm test` succeeded for the repository state being released.
- [ ] Any partial data, fallback behaviour, or coverage gaps are explicitly disclosed.
- [ ] The result is stable enough to compare with past and future Daily CAP reports without ambiguity.

## Not done

A report is not done if it hides missing bilingual counterparts, drops required artifacts, skips core sections without explanation, fails validation, or overstates what the automated pipeline can prove.
