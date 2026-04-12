# STYLES.md: Design and content standards

This file defines how standards are written, designed, and published in this project.
It governs two distinct surfaces and is the authoritative reference for both humans
and AI coding agents contributing to this repository.

---

## Scope: documentation files vs. the website

This project has two surfaces that share the same standards:

| Surface | Files | Audience |
| :--- | :--- | :--- |
| **GitHub Pages site** | `docs/reports/`, `docs/reports/index.html` | Public visitors browsing the report site |
| **Repository documentation** | `README.md`, `AGENTS.md`, `STYLES.md`, `FEATURES.md` | Contributors, adopters, and AI agents reading files directly on GitHub |

**What applies to both surfaces:**
- Section 2 - Content and voice standards (plain language, active voice, sentence-case headings, Canadian English, abbreviations, content structure)
- Section 4 - Accessibility and semantic logic (heading hierarchy, alt text, link text)
- Section 5 - AI agent instructions
- Section 6 - Content governance

**What applies to the website only:**
- Section 3 - Design foundations (color tokens, typography, breakpoints, page layout)

Even though documentation files are rendered as plain Markdown rather than styled HTML,
they share the same voice, tone, and heading conventions as the site. This keeps the
project a unified whole for every reader, regardless of which surface they encounter first.

---

## 1. Core philosophy

We design for the reader, not the institution. The goal is to reduce cognitive load
through consistency, clarity, and radical accessibility.

Daily CAP is an independent community benchmarking project. Its design reflects these values:

- **Transparency**: we publish methods, data, and findings openly.
- **Honesty**: we report what automated tools can and cannot prove.
- **Bilingual respect**: English and French are treated as equals throughout.
- **Accessibility first**: our outputs must meet the same standards we measure in others.

Design and writing principles derived from those values:

1. **Reader-first.** Start with the reader's need, not the data structure.
2. **Plain language.** If a reader unfamiliar with government web work cannot understand it, it is a barrier.
3. **Inclusive by default.** See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for all interaction and visual standards.
4. **Consistency is trust.** AI agents and humans must use the same tokens, patterns, and vocabulary.
5. **Radically open.** Work transparently; share methods, data, and findings openly.

---

## 2. Content and voice standards

Derived from Canada.ca Content Style Guide, GOV.UK GDS, and Digital.gov plain language standards.

### 2.1 Voice and tone

We use an **authoritative peer** tone: professional and knowledgeable, but accessible
and supportive.

| Context | Tone | Strategy |
| :--- | :--- | :--- |
| **Onboarding** | Encouraging | Focus on the benefit to the reader |
| **Technical** | Precise | Be unambiguous; explain "why" if a rule is complex |
| **Error states** | Calm and helpful | Do not blame the reader; provide a clear path forward |
| **Data and impact** | Confident and grounded | Let numbers speak; contextualize without overstating |

### 2.2 Plain language and word choice

AI agents must prioritize these substitutions:

| Avoid | Use instead |
| :--- | :--- |
| Utilize / leverage | Use |
| Facilitate / implement | Help / carry out |
| At this point in time | Now |
| In order to | To |
| Notwithstanding | Despite / even though |
| Requirements | Rules / what you need |

### 2.3 Grammar and mechanics

- **Active voice:** "The scanner checks the link" - not "The link is checked by the scanner."
- **Sentence case:** Use sentence case for all headings and buttons. "Save and continue" - not "Save and Continue."
- **Lists:** Use bullets for unordered items. Use numbered lists only for sequential steps.
- **Oxford comma:** Always use the serial comma in lists of three or more.

### 2.4 Spelling convention

This project uses **Canadian English** as its default spelling standard, consistent with
the Canada.ca Content Style Guide.

| Variant | Example spellings | When to use |
| :--- | :--- | :--- |
| **Canadian English** (default) | colour, centre, optimise, behaviour | All documentation and reports in this project |

> **AI agents:** Always apply Canadian English spelling rules throughout all documents and generated HTML.

### 2.5 Bilingual language

English and French are both official languages of Canada. This shapes how we write about the project:

- Do not describe French as secondary, optional, or a translation.
- Do not describe English as the default or primary language.
- When referencing paired URLs, always list English and French separately.
- When reporting parity gaps, use factual, neutral language.
- Use "English counterpart" and "French counterpart" rather than "original" and "translation."

### 2.6 Abbreviations, numbers, and dates

#### Abbreviations

- Spell out an abbreviation on first use, then use the short form: "Web Content Accessibility
  Guidelines (WCAG)."
- Do not use periods in acronyms: "HTML," "CSS," "GC" - not "H.T.M.L."
- Avoid jargon-only abbreviations without explanation unless writing for a specialist audience.

#### Numbers

| Context | Rule | Example |
| :--- | :--- | :--- |
| **In body text** | Spell out one through nine; use numerals for 10 and above | "three pillars," "12 tokens" |
| **Starts a sentence** | Always spell out | "Twelve steps are required." |
| **Percentages** | Use numerals and the % symbol | "4.5% contrast ratio" |
| **Versions and technical values** | Always use numerals | "WCAG 2.2," "font-size: 1rem" |

#### Dates

- Use **ISO 8601** for machine-readable dates: `2026-04-01`.
- Use **spelled-out months** for human-readable dates: "April 1, 2026."
- Do not use all-numeric dates that could be ambiguous across locales (01/04/2026).

### 2.7 Methodology language

Daily CAP reports automated signals, not compliance judgements. Always use precise language:

| Avoid | Use instead |
| :--- | :--- |
| "certified accessible" | "no automated barriers detected" or "automated signal" |
| "measured affected users" | "directional estimate" |
| "all Government of Canada services" | "benchmark coverage" |
| "compliant statement" | "detected statement" |
| "proven barrier-free" | "no automated barriers detected" |

### 2.8 Attribution and citation

When quoting, adapting, or referencing external work in documentation:

- **Quote directly** only when the original wording matters and cannot be improved.
  Block-quote passages over three lines.
- **Paraphrase** when the idea is what matters. Paraphrasing does not remove the need
  to credit the source.
- **Credit the source** inline or in a references section.
- **Link to the source** rather than reproducing large portions of external content.
- **Do not reproduce** entire copyrighted works, style guides, or specifications.
  Reference them and link to the canonical source.

> **AI agents:** Do not reproduce large passages from external style guides or
> specifications verbatim. Summarize, paraphrase, and link to the canonical source.

### 2.9 Content structure and document types

Different document types follow different patterns.

| Document type | Purpose | Structure pattern |
| :--- | :--- | :--- |
| **Reference** (STYLES.md, ACCESSIBILITY.md) | Authoritative rules; consulted, not read cover-to-cover | Numbered sections, tables, bullet rules |
| **Guide or how-to** (README.md) | Step-by-step walkthrough for a specific audience | Numbered steps, "you" voice, outcome-focused |
| **Feature catalog** (FEATURES.md) | Comprehensive technical inventory | Categorized sections, file paths, option tables |

Rules that apply to all document types:

- Use heading levels in order (`#` then `##` then `###`). Do not skip levels.
- Open each document with a one-sentence purpose statement.
- Keep paragraphs short: three to five sentences is a good maximum.
- Prefer short sentences over long, complex ones.

---

## 3. Design foundations (site surface only)

These rules apply to generated HTML reports (`docs/reports/`) and any page rendered by
`src/publish/render-pages.js`. They do not govern plain Markdown documentation files.

### 3.1 Brand profile

Daily CAP is an independent community project, not an official Government of Canada
product. Its visual identity uses a nature-inspired green palette that is distinct from
Canada.ca brand colours.

**Design personality:** Clean, readable, honest, accessible, calm.

**Design values expressed in visual choices:**
- Use clear hierarchy and ample white space (clean, readable).
- Prefer the green accent for interactive elements, links, and data highlights (distinct from GC red).
- Use accessible colour contrast throughout (accessibility first).
- Keep layouts simple and scannable (honest, calm).

### 3.2 Design tokens

The canonical values live in `docs/reports/assets/report.css` (CSS custom properties).

#### Light mode tokens

| Token | Value | Role |
| :--- | :--- | :--- |
| `--bg` | `#f8faf8` | Base page background |
| `--bg-gradient` | `#e8f4ea` | Radial gradient highlight at top |
| `--fg` | `#0d1b12` | Body text - 4.5:1 contrast on `--bg` required |
| `--card` | `#ffffff` | Card and table background |
| `--line` | `#d7e2d8` | Borders, separators |
| `--accent` | `#1d6b42` | Links, interactive elements, focus rings |
| `--table-header-bg` | `#edf4ee` | Table header row background |

#### Dark mode tokens

Dark mode overrides apply via `[data-theme="dark"]` attribute and `@media (prefers-color-scheme: dark)`.

| Token | Dark value | Role |
| :--- | :--- | :--- |
| `--bg` | `#0d1a12` | Base page background |
| `--bg-gradient` | `#1a2e1e` | Gradient highlight |
| `--fg` | `#e6f4e9` | Body text |
| `--card` | `#131f17` | Card and table background |
| `--line` | `#2a3d2e` | Borders, separators |
| `--accent` | `#4caf70` | Links and interactive elements (lighter for contrast on dark) |
| `--table-header-bg` | `#1a2e1e` | Table header row background |

#### Chart and data colours

SVG chart colours are defined inline in `src/publish/render-pages.js`. These must meet 3:1 contrast against chart backgrounds.

| Usage | Value |
| :--- | :--- |
| Missing French counterparts | `#b5402d` (red) |
| Missing accessibility statements | `#1d6b42` (green) |
| High EN/FR accessibility gap | `#235d8b` (blue) |
| Performance score | `#235d8b` (blue) |
| Accessibility score | `#1d6b42` (green) |
| Best practices score | `#7b4f9e` (purple) |
| SEO score | `#b5402d` (red) |

Do not convey chart meaning by colour alone. Every chart must have a text equivalent
or caption describing what each series represents.

### 3.3 Typography

- **Font stack:** `Georgia, "Times New Roman", serif` (current implementation)
- **Font scaling:** Use `rem` units. Never use `px` for font sizes.
- **Line length:** Constrained by `max-width: 1100px` for the main content area.
- **Text alignment:** Use left-aligned text for body content. Avoid `text-align: justify`.
- **Capitalization:** Use CSS `text-transform` for decorative uppercase styling. Do not write uppercase text directly in HTML source.

### 3.4 Responsive design (mobile-first)

Write base CSS for the smallest screen first, then enhance with `min-width` queries.

| Layer | Breakpoint | Intent |
| :--- | :--- | :--- |
| **Mobile** | `0`-`699px` (base) | Single-column, scrollable tables |
| **Desktop** | `min-width: 700px` | Multi-column, full table layout |

- **Never block zoom.** The viewport meta tag must not include `maximum-scale=1` or `user-scalable=no`. Users must be able to scale the page freely.
- On narrow viewports, tables must scroll horizontally rather than overflow or reflow in ways that break column alignment.

### 3.5 User-preference media queries

| Query | Status | Implementation |
| :--- | :--- | :--- |
| `prefers-color-scheme` | Required | Dark/light token swap via CSS custom properties and `[data-theme]` attribute |
| `prefers-reduced-motion` | Required | Remove or reduce transitions and animations |
| `prefers-contrast` | Planned | Not yet implemented |
| `forced-colors` | Planned | Not yet implemented |
| `print` | Recommended | Hide navigation and decorative elements; render body text at >= 12pt |

---

## 4. Accessibility and semantic logic

These rules apply to **both surfaces**. This project benchmarks accessibility; our own
outputs must meet or exceed the same standards we measure in others.

- Use heading levels in order: `h1` then `h2` then `h3`. Do not skip levels.
- Write descriptive link text. "Read more about bilingual parity" - not "click here."
- Every image needs meaningful alt text. Decorative images use `alt=""`.
- Every SVG chart needs a `<title>` and `<desc>` element with `aria-labelledby`.
- Use `aria-label` on landmark elements when the role is ambiguous.
- Minimum colour contrast: 4.5:1 for body text, 3:1 for large text and UI components.
- Do not convey information by colour alone. Always pair colour with a secondary indicator: an icon, label, pattern, or text.
- Ensure touch and click targets are at least 44x44 pixels for primary interactive elements.
- Use underlines only for links, not for decorative or non-link text.
- Always use `escapeHtml()` when rendering user-controlled or externally sourced data in HTML.
- Provide a "skip to main content" skip link at the start of each page so keyboard users can bypass repeated navigation.
- Tables must use `<th scope="col">` or `<th scope="row">` as appropriate.

See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for the full accessibility commitment and conformance target (WCAG 2.2 AA).

---

## 5. AI agent instructions

These rules apply to both surfaces. Agents editing documentation and agents
generating site content must follow all of them.

- Read [AGENTS.md](./AGENTS.md) before making any change to this repository.
- Identify which surface is being edited (site or documentation) and apply the correct rule set.
- Never override [ACCESSIBILITY.md](./ACCESSIBILITY.md) constraints.
- Use Canadian English spelling throughout.
- Keep changes scoped to the minimum necessary to fulfil the user's request.
- Verify all cross-file references resolve before committing.
- When rendering HTML, always use `escapeHtml()` for any user-controlled or external data.
- Use UTF-8 encoding only. Do not use smart quotes, em dashes, or Windows-1252 characters.
- Use absolute or project-relative paths (e.g., `src/scanners/lighthouse-runner.js`), never bare filenames.
- Do not describe French as secondary, optional, or a translation of English.
- Do not overclaim what automated scans can prove. See Section 2.7 for required language substitutions.

> **AI agents:** Do not silently override or quietly contradict rules in this file.
> If a requested change would conflict with an existing rule, surface the conflict
> and ask for clarification before proceeding.

---

## 6. Content governance

These rules describe how this style guide itself is maintained and updated.

- **Ownership:** The project maintainer is responsible for keeping these standards current. Contributors may propose changes via pull request.
- **Versioning:** Changes to standards that affect existing content should be noted in commit messages.
- **Conflict resolution:** When two rules conflict, the more specific rule takes precedence. When this file conflicts with ACCESSIBILITY.md, ACCESSIBILITY.md wins.
- **Review cycle:** Standards should be reviewed at least once per year.
- **Deprecation:** Remove outdated rules rather than leaving contradictions.
- **Relationship to Daily DAP:** Daily CAP may borrow patterns from Daily DAP's STYLES.md but must remain independent. Do not treat the two projects as sharing a single style guide.

---

## 7. References

- [Canada.ca Content Style Guide](https://www.canada.ca/en/treasury-board-secretariat/services/government-communications/canada-content-style-guide.html)
- [Plain Language Guidelines - Digital.gov](https://www.plainlanguage.gov/guidelines/)
- [GOV.UK Content Design Guide](https://www.gov.uk/guidance/content-design/writing-for-gov-uk)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Government of Canada Web Accessibility](https://www.canada.ca/en/government/about/web-accessibility.html)
- [ACCESSIBILITY.md](./ACCESSIBILITY.md)
- [AGENTS.md](./AGENTS.md)
- [FEATURES.md](./FEATURES.md)
