# ACCESSIBILITY.md

> **Daily CAP's commitment to accessibility transparency and inclusive quality benchmarking.**

## Our accessibility mission

Daily CAP exists to benchmark the quality and accessibility of high-traffic Canadian federal digital service entry points. As a project focused on measuring and reporting accessibility, we are committed to ensuring our own tools, reports, and outputs are accessible and follow the same standards we measure in others.

**Core principles:**
- Generate accessible HTML reports that meet WCAG 2.2 AA standards
- Provide transparency on Government of Canada website accessibility through data
- Support accessibility advocates and federal teams with actionable automated signals
- Ensure our tooling and documentation is accessible to all contributors
- Report in a way that respects bilingual obligations — English and French as equals

---

## Conformance status

**Target conformance level**: WCAG 2.2 AA

**Current status**: In development
- HTML report generation includes semantic markup and consistent HTML escaping
- All reports include `lang` attributes, viewport meta tags, and proper HTML structure
- Reports use accessible table markup with scoped column headers
- Dark and light mode support via `prefers-color-scheme` and `[data-theme]` attribute
- Dark/light mode toggle uses SVG icon (moon/sun) with descriptive `aria-label` on the button
- SVG charts include `<title>` and `<desc>` elements with `aria-labelledby`
- FPS icon SVGs in the impact model include `role="img"`, `<title>`, and `<desc>` elements
- Skip-to-content links present on all report pages
- Anchor links on section headings include descriptive `aria-label` attributes
- Published GitHub Pages reports are scanned monthly with axe-core via `github/accessibility-scanner@v3`

---

## Accessibility features of this project

### 1. Accessibility scanning infrastructure

This project integrates multiple accessibility scanning tools to assess scanned pages:

- **Lighthouse accessibility audits**: Automated WCAG checks across four scan contexts (desktop/mobile x light/dark)
- **axe-core integration**: Structured accessibility finding extraction via `@axe-core/playwright`
- **Accessibility statement detection**: Governance and transparency signal checks
- **Bilingual parity analysis**: EN/FR accessibility score gap detection and per-institution gap leaderboard
- **FPS impact modelling**: axe findings mapped to CAN/ASC EN 301 549:2024 Functional Performance Statements

**Key files:**
- `src/scanners/lighthouse-runner.js` — Lighthouse multi-context runner
- `src/scanners/axe-runner.js` — axe-core structured findings extractor
- `src/scanners/accessibility-statement-runner.js` — Statement detection
- `src/aggregation/bilingual-parity.js` — EN/FR score gap analysis and institution gap leaderboard
- `src/aggregation/impact-model.js` — Directional impact estimation using Statistics Canada data
- `src/data/axe-to-fps.js` — Mapping of axe-core rules to Canadian FPS codes
- `src/data/fps-labels.js` — FPS code labels, clauses, descriptions, and accessible SVG icons
- `src/data/statistics-canada-disability-stats.js` — Canonical Statistics Canada CSD 2022 prevalence data with per-category source notes

### 2. Accessible report structure

Generated HTML reports follow accessibility best practices:

- **Semantic HTML**: Proper use of `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, `<td>`
- **Heading hierarchy**: `h1` then `h2` then `h3` in order; no levels skipped
- **Language declaration**: All pages include `lang="en"` or `lang="fr"` as appropriate
- **Viewport meta tag**: Zoom not blocked; `user-scalable=no` and `maximum-scale=1` are prohibited
- **Proper charset**: UTF-8 encoding declared in all HTML documents
- **Skip links**: "Skip to main content" link present at the start of each page
- **Dark/light mode**: CSS custom property token swap via `prefers-color-scheme` and user toggle; toggle button uses accessible SVG moon/sun icons with `aria-label` describing the action
- **Reduced motion**: `prefers-reduced-motion` is respected; transitions are suppressed when set
- **SVG charts**: Each chart has `role="img"`, `<title>`, and `<desc>` linked via `aria-labelledby`
- **FPS SVG icons**: Each icon has `role="img"`, `<title>`, and `<desc>`; verified in CI via `test/fps-mapping.test.js`
- **Colour independence**: Chart series are identified by caption text, not colour alone
- **Focus management**: Focus indicators use `outline: 2px solid var(--accent)` throughout

**Output location**: `docs/reports/daily/YYYY-MM-DD/index.html`

### 3. GitHub Actions step summary

`src/cli/generate-summary.js` produces a Markdown summary for GitHub Actions step summaries and standalone review. The summary includes:

- Aggregate accessibility and performance scores with trend deltas
- Directional impact estimate with explicit methodology caveat
- FPS impact table (top categories by directional estimate, with Statistics Canada vintage citation)
- Bilingual parity signals including institution gap leaderboard (top institutions by EN/FR accessibility gap)
- Accessibility statement coverage
- Top priority issues table

---

## Testing and validation

### Current testing practices

- **Unit tests**: Coverage of core logic functions across all pipeline modules
- **Integration tests**: End-to-end workflow validation with mock scan data
- **Structural HTML tests**: Render function output is checked for correct escaping, structural patterns, and accessible markup via `test/publish-report.test.js`
- **FPS accessibility tests**: Every FPS SVG icon is verified to have `role="img"`, `<title>`, and `<desc>` in `test/fps-mapping.test.js`
- **Self-scan workflow**: Published GitHub Pages reports are scanned monthly with axe-core via `.github/workflows/scan-self-accessibility.yml`

**Run tests**: `npm test`

### Accessibility testing tools used

1. **Lighthouse**: Automated accessibility audits (included in the scan process for target URLs)
2. **axe-core** (via `github/accessibility-scanner@v3`): Monthly automated WCAG 2.2 AA scans of published GitHub Pages reports
3. **Structural render tests** (`test/publish-report.test.js`): Confirm generated HTML maintains correct patterns and no unescaped content

### In-repo HTML accessibility checks

Render functions in `src/publish/render-pages.js` are exercised by tests in `test/publish-report.test.js`. These tests confirm that generated HTML does not contain unescaped content and maintains correct structural patterns.

**Pages covered by render tests:**
- Daily report page
- Report dashboard index
- Institution trend pages
- Individual institution scorecard pages
- Detail pages (priority issues, recurring issues, institution scorecards, bilingual gap leaderboard)

### Self-scan workflow

`.github/workflows/scan-self-accessibility.yml` runs axe-core against the published GitHub Pages site after every daily push and monthly as a baseline. It uses the `self-accessibility` label to track issues and skips the scan when open issues already exist, avoiding duplicate noise. Open issues must be resolved before a new scan is triggered.

---

## Known gaps and future work

### Current limitations

- [ ] No dedicated axe-core test file that runs axe against every rendered HTML page in CI (only structural pattern checks in `publish-report.test.js`)
- [ ] Limited screen reader testing of report pages
- [ ] No automated colour contrast verification for chart SVG inline colours
- [ ] `prefers-contrast` media query not yet implemented
- [ ] `forced-colors` media query not yet implemented

### Planned improvements

- [ ] Add `test/axe-html-accessibility.test.js` that runs axe-core against every render function output in CI
- [ ] Implement keyboard navigation testing for interactive report features
- [ ] Screen reader compatibility testing with NVDA, JAWS, and VoiceOver
- [ ] Implement `prefers-contrast` token swap
- [ ] Implement `forced-colors` stylesheet fallback

---

## Contributing with accessibility in mind

### For developers

When working on this project:

1. **HTML generation**: Always use `escapeHtml()` for dynamic content inserted into HTML
2. **Semantic markup**: Use proper HTML5 semantic elements; avoid `<div>` soup
3. **ARIA**: Only add ARIA attributes when native HTML semantics are insufficient
4. **Tables**: Every data table must use `<th scope="col">` or `<th scope="row">`; never use `<td>` for headers
5. **Charts**: Every SVG chart must have a `<title>`, `<desc>`, and `aria-labelledby`; every chart must have a text caption describing what each series represents
6. **FPS icons**: Every FPS SVG icon must have `role="img"`, `<title>`, and `<desc>`; add tests to verify
7. **Toggle controls**: Icon-only buttons must have a descriptive `aria-label` on the `<button>` element; icons use `aria-hidden="true"` and `focusable="false"`
8. **Testing**: Manually review generated HTML reports for accessibility before submitting changes
9. **Documentation**: Keep this file updated when accessibility features change

### HTML rendering security

- **Always** escape user-controlled or external data before rendering in HTML using `escapeHtml()`
- **Never** insert unescaped URLs, page titles, service names, or scan results directly into HTML
- Scraped content must be treated as untrusted regardless of source

### Data display

- Use `<table>` markup with `<th scope="col">` for column headers
- Include meaningful column header text for screen reader users
- Avoid overly complex nested tables
- On narrow viewports, tables must scroll horizontally rather than overflow clipped

### Report structure

- Maintain document outline with proper heading hierarchy
- Include descriptive `<title>` elements on every page
- Use semantic HTML landmarks: `<header>`, `<main>`, `<footer>`, `<nav>`
- Provide a skip link as the first focusable element on every page

---

## Trusted sources and references

**Primary standards:**
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/) — W3C Web Content Accessibility Guidelines
- [CAN/ASC EN 301 549:2024](https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services) — Canadian adaptation of EN 301 549; governs Functional Performance Statements
- [Government of Canada Standard on Web Accessibility](https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601) — GC accessibility standard
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/) — Accessible Rich Internet Applications

**Canadian government references:**
- [Canada.ca Content Style Guide — Accessibility](https://www.canada.ca/en/treasury-board-secretariat/services/government-communications/canada-content-style-guide.html)
- [Government of Canada Web Accessibility](https://www.canada.ca/en/government/about/web-accessibility.html)
- [Accessibility in the Government of Canada](https://www.canada.ca/en/government/publicservice/wellness-inclusion-diversity-public-service/diversity-inclusion-public-service/accessibility-public-service.html)
- [Accessible Canada Act](https://laws-lois.justice.gc.ca/eng/acts/A-0.6/) — Legislative foundation for GC accessibility obligations

**Tool documentation:**
- [Lighthouse Accessibility Audits](https://developer.chrome.com/docs/lighthouse/accessibility/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [github/accessibility-scanner](https://github.com/github/accessibility-scanner) — Used in self-scan workflow

---

## AI agent instructions

AI coding assistants working on this project must follow accessibility standards.

**See**: [AGENTS.md](./AGENTS.md) and [STYLES.md](./STYLES.md)

**Key requirements for AI agents:**
1. Generate accessible HTML following WCAG 2.2 AA
2. Always escape user-controlled or external content using `escapeHtml()` before inserting into HTML
3. Use semantic HTML markup; maintain heading order; never skip heading levels
4. Every SVG chart needs `<title>`, `<desc>`, and `aria-labelledby`; every chart needs a caption
5. Every FPS icon SVG needs `role="img"`, `<title>`, and `<desc>`; add a test to verify
6. Every data table needs `<th scope="col">` or `<th scope="row">` on all header cells
7. Icon-only buttons (e.g. dark/light mode toggle) must have `aria-label` on the `<button>`; icons use `aria-hidden="true"` and `focusable="false"`
8. Do not add `maximum-scale=1` or `user-scalable=no` to viewport meta tags
9. Include `lang` attribute on all HTML pages
10. Respect `prefers-color-scheme` and `prefers-reduced-motion` media queries
11. Do not convey information by colour alone
12. Use UTF-8 encoding only; no smart quotes, em dashes, or Windows-1252 characters

> **AI agents:** When this file conflicts with STYLES.md on accessibility matters, this file wins.
> When this file conflicts with AGENTS.md, this file wins on HTML and output quality.

---

## Reporting accessibility issues

### Issues in this repository

If you find accessibility issues in our code, reports, or documentation:

1. Search existing issues to check if it has already been reported
2. Open a new issue with the `accessibility` label
3. Include:
   - A clear description of the barrier
   - Steps to reproduce
   - Impact severity (critical, serious, moderate, or minor)
   - Suggested remediation if known

### Issues in scanned Government of Canada websites

Daily CAP generates automated signals about government website accessibility. If you notice barriers on the websites we scan, please report them directly to the responsible institution using their feedback channels or through the [GC accessibility feedback process](https://www.canada.ca/en/government/about/web-accessibility.html).

---

## Maintenance

This document is a living commitment. It should be updated when:
- New accessibility features are added to the report output
- Testing practices change
- Known gaps are addressed
- Conformance status changes
- New scanning tools or integrations are added

**Last updated**: 2026-04-12
