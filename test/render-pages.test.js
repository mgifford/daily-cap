/**
 * Unit tests for src/publish/render-pages.js
 *
 * Tests each exported render function in isolation against minimal fixture data.
 * Covers:
 *   - Structural HTML presence (landmarks, headings, skip link, lang attribute)
 *   - Dark/light mode toggle: SVG icon present, aria-label on button
 *   - escapeHtml() applied to external data (XSS probe)
 *   - Conditional rendering (leaderboard, parity trend arrows, regression alerts)
 *   - Empty/minimal data does not throw
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  renderDailyReportPage,
  renderInstitutionScorecardsPage,
  renderInstitutionTrendsIndexPage,
  renderInstitutionTrendPage,
  renderPriorityIssuesPage,
  renderRecurringIssuesPage,
  renderDashboardPage,
  renderHomePage,
  renderArchiveIndexPage,
} from "../src/publish/render-pages.js";

// ---------------------------------------------------------------------------
// Shared minimal fixtures
// ---------------------------------------------------------------------------

const MINIMAL_REPORT = {
  run_date: "2026-04-10",
  run_id: "cap-2026-04-10",
  scan_mode: "mock",
  scan_summary: { total: 10, succeeded: 9, failed: 1 },
  benchmark_summary: { means: { accessibility_score: 78, performance_score: 62 } },
  bilingual_parity: {
    summary: {
      candidate_pairs: 5,
      paired_services: 3,
      complete_success_pairs: 3,
      missing_french: 2,
      missing_english: 0,
      paired_from_switcher: 0,
      average_absolute_accessibility_gap: 4.5,
      high_accessibility_gap_pairs: 1,
    },
    highlights: { largest_accessibility_gaps: [] },
    missing_counterparts: [],
    by_institution: [],
  },
  accessibility_statements: {
    summary: {
      scanned_urls: 10,
      statements_detected: 2,
      statement_coverage_percent: 20,
      with_contact_info: 1,
      with_contact_info_percent: 50,
      with_compliance_status: 0,
      with_compliance_status_percent: 0,
      with_freshness_marker: 1,
      with_freshness_marker_percent: 50,
      bilingual_pairs_total: 3,
      bilingual_pairs_both_detected: 0,
    },
    missing_statement_examples: [],
    checks: [],
  },
  platform_signals: { summary: {}, distributions: { cms: [] }, cms_url_examples: [] },
  impact_model: { summary: {}, by_fps: [], top_directional_impact_urls: [], data_provenance: {} },
  cohort_quality: { summary: {}, distributions: { source_lineage: [] }, warnings: [], provenance_examples: [] },
  lighthouse_contexts: { summary: {}, by_context: {}, deltas: [], highlights: {} },
  barrier_history: { points: [] },
  trend_analysis: { available: false, metrics: [], regressions: [] },
  priority_issues: { summary: {}, top_priority_issues: [], all_issues: [], recurring_issues: [] },
  institution_scorecards: { summary: {}, scorecards: [], all_scorecards: [] },
  institution_trends: { summary: { institutions: 0 }, institutions: [] },
  output_paths: { details: {} },
  top_urls: [],
};

const MINIMAL_INSTITUTION_TREND = {
  institution: "Test Agency",
  slug: "test-agency",
  days_tracked: 1,
  parity_trend: "insufficient_data",
  parity_gap_delta: null,
  latest: {
    mean_accessibility_score: 80,
    mean_abs_accessibility_gap: null,
    missing_french_count: 0,
    missing_statement_count: 0,
    high_gap_pair_count: 0,
  },
  points: [],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertStructural(html, label) {
  assert.ok(html.includes('lang="en"'), `${label}: lang="en" present`);
  assert.ok(html.includes("<h1"), `${label}: h1 present`);
  assert.ok(html.includes("<main"), `${label}: main landmark present`);
  assert.ok(html.includes("<header"), `${label}: header landmark present`);
}

function assertThemeToggle(html, label) {
  assert.ok(
    html.includes('id="theme-toggle"'),
    `${label}: theme-toggle button present`
  );
  assert.ok(
    html.includes("aria-label="),
    `${label}: aria-label on theme toggle`
  );
  assert.ok(
    html.includes("<svg") && html.includes("<title>Moon</title>"),
    `${label}: moon SVG in initial toggle`
  );
}

// ---------------------------------------------------------------------------
// renderDailyReportPage
// ---------------------------------------------------------------------------

describe("renderDailyReportPage", () => {
  it("renders without throwing on minimal report", () => {
    assert.doesNotThrow(() => renderDailyReportPage(MINIMAL_REPORT));
  });

  it("includes structural landmarks", () => {
    const html = renderDailyReportPage(MINIMAL_REPORT);
    assertStructural(html, "renderDailyReportPage");
  });

  it("includes theme toggle button with SVG icon and aria-label", () => {
    const html = renderDailyReportPage(MINIMAL_REPORT);
    assertThemeToggle(html, "renderDailyReportPage");
  });

  it("escapes XSS in service_name", () => {
    const report = {
      ...MINIMAL_REPORT,
      top_urls: [
        {
          inventory_id: "x-en",
          language: "en",
          canonical_url: "https://example.com",
          service_name: "<script>alert(1)</script>",
          institution: "TBS",
          tier: "tier-1",
          page_load_count: 1000,
          scan_status: "success",
          lighthouse: { accessibility_score: 80, performance_score: 70 },
        },
      ],
    };
    const html = renderDailyReportPage(report);
    assert.ok(!html.includes("<script>alert(1)</script>"), "raw script tag not present");
    assert.ok(html.includes("&lt;script&gt;"), "script tag escaped");
  });

  it("shows run date and scan mode", () => {
    const html = renderDailyReportPage(MINIMAL_REPORT);
    assert.ok(html.includes("2026-04-10"), "run date present");
    assert.ok(html.includes("mock"), "scan mode present");
  });

  it("includes bilingual parity section heading", () => {
    const html = renderDailyReportPage(MINIMAL_REPORT);
    assert.ok(html.includes("Bilingual Parity"), "bilingual parity heading present");
  });

  it("renders institution gap leaderboard when by_institution has entries", () => {
    const report = {
      ...MINIMAL_REPORT,
      bilingual_parity: {
        ...MINIMAL_REPORT.bilingual_parity,
        by_institution: [
          {
            institution: "Canada Revenue Agency",
            pair_count: 3,
            mean_abs_accessibility_gap: 18,
            high_gap_pair_count: 2,
            mean_abs_performance_gap: 5,
          },
        ],
      },
    };
    const html = renderDailyReportPage(report);
    assert.ok(html.includes("Institution Bilingual Gap Leaderboard"), "leaderboard heading present");
    assert.ok(html.includes("Canada Revenue Agency"), "institution name rendered");
    assert.ok(html.includes("18"), "gap value rendered");
  });

  it("omits institution gap leaderboard when by_institution is empty", () => {
    const html = renderDailyReportPage(MINIMAL_REPORT);
    assert.ok(!html.includes("Institution Bilingual Gap Leaderboard") || html.includes("No institution gap data"), "empty leaderboard handled");
  });

  it("shows regression alert when regressions present", () => {
    const report = {
      ...MINIMAL_REPORT,
      trend_analysis: {
        available: true,
        previous_run_date: "2026-04-09",
        metrics: [],
        regressions: [
          { metric: "accessibility_mean", label: "Mean Accessibility Score", delta: -5, severity: "warning" },
        ],
      },
    };
    const html = renderDailyReportPage(report);
    assert.ok(html.includes("Mean Accessibility Score"), "regression metric label present");
  });

  it("shows download link for bilingual-gap-leaderboard.json", () => {
    const html = renderDailyReportPage(MINIMAL_REPORT);
    assert.ok(html.includes("bilingual-gap-leaderboard.json"), "download link present");
  });

  it("explains directional load units and interpretation", () => {
    const html = renderDailyReportPage(MINIMAL_REPORT);
    assert.ok(html.includes("Units: Load values are estimated page loads"), "units note present");
    assert.ok(html.includes("not cumulative time spent"), "time interpretation note present");
    assert.ok(html.includes("Load (estimated page loads)"), "directional impact table load header clarified");
  });
});

// ---------------------------------------------------------------------------
// renderInstitutionScorecardsPage
// ---------------------------------------------------------------------------

describe("renderInstitutionScorecardsPage", () => {
  it("renders without throwing on minimal report", () => {
    assert.doesNotThrow(() => renderInstitutionScorecardsPage(MINIMAL_REPORT));
  });

  it("includes structural elements", () => {
    const html = renderInstitutionScorecardsPage(MINIMAL_REPORT);
    assertStructural(html, "renderInstitutionScorecardsPage");
    assertThemeToggle(html, "renderInstitutionScorecardsPage");
  });

  it("renders institution rows with correct columns", () => {
    const report = {
      ...MINIMAL_REPORT,
      institution_scorecards: {
        summary: { institutions: 1 },
        all_scorecards: [
          {
            institution: "IRCC",
            scanned_urls: 4,
            total_page_load_count: 50000,
            mean_accessibility_score: 82,
            mean_performance_score: 65,
            missing_french_count: 1,
            missing_statement_count: 2,
            high_gap_pair_count: 0,
            recurring_issue_count: 1,
            top_priority_issue_score: 120,
            top_priority_issue: "missing-french",
          },
        ],
      },
    };
    const html = renderInstitutionScorecardsPage(report);
    assert.ok(html.includes("IRCC"), "institution name rendered");
    assert.ok(html.includes("missing-french"), "top issue type rendered");
  });

  it("escapes XSS in institution name", () => {
    const report = {
      ...MINIMAL_REPORT,
      institution_scorecards: {
        summary: {},
        all_scorecards: [
          {
            institution: '<img src=x onerror="alert(1)">',
            scanned_urls: 1,
            total_page_load_count: 0,
            mean_accessibility_score: null,
            mean_performance_score: null,
            missing_french_count: 0,
            missing_statement_count: 0,
            high_gap_pair_count: 0,
            recurring_issue_count: 0,
            top_priority_issue_score: null,
            top_priority_issue: null,
          },
        ],
      },
    };
    const html = renderInstitutionScorecardsPage(report);
    assert.ok(!html.includes('<img src=x onerror="alert(1)">'), "raw XSS not present");
    assert.ok(html.includes("&lt;img"), "img tag escaped");
  });

  it("includes link to institution trends page", () => {
    const html = renderInstitutionScorecardsPage(MINIMAL_REPORT);
    assert.ok(html.includes("institution-trends.html"), "trends index link present");
  });
});

// ---------------------------------------------------------------------------
// renderInstitutionTrendsIndexPage
// ---------------------------------------------------------------------------

describe("renderInstitutionTrendsIndexPage", () => {
  it("renders without throwing on minimal report", () => {
    assert.doesNotThrow(() => renderInstitutionTrendsIndexPage(MINIMAL_REPORT));
  });

  it("includes structural elements and theme toggle", () => {
    const html = renderInstitutionTrendsIndexPage(MINIMAL_REPORT);
    assertStructural(html, "renderInstitutionTrendsIndexPage");
    assertThemeToggle(html, "renderInstitutionTrendsIndexPage");
  });

  it("shows placeholder row when no institution data", () => {
    const html = renderInstitutionTrendsIndexPage(MINIMAL_REPORT);
    assert.ok(html.includes("No institution trend data available"), "placeholder present");
  });

  it("renders parity trend arrow for worsening institution", () => {
    const report = {
      ...MINIMAL_REPORT,
      institution_trends: {
        summary: { institutions: 1 },
        institutions: [
          {
            institution: "CRA",
            slug: "cra",
            days_tracked: 5,
            parity_trend: "worsening",
            parity_gap_delta: 12,
            latest: {
              mean_accessibility_score: 75,
              mean_abs_accessibility_gap: 15,
              missing_french_count: 2,
              missing_statement_count: 1,
              high_gap_pair_count: 1,
            },
            points: [],
          },
        ],
      },
    };
    const html = renderInstitutionTrendsIndexPage(report);
    assert.ok(html.includes("CRA"), "institution name rendered");
    assert.ok(html.includes("↑ worsening"), "worsening arrow rendered");
  });

  it("renders improving trend arrow", () => {
    const report = {
      ...MINIMAL_REPORT,
      institution_trends: {
        summary: { institutions: 1 },
        institutions: [
          {
            institution: "ESDC",
            slug: "esdc",
            days_tracked: 3,
            parity_trend: "improving",
            parity_gap_delta: -8,
            latest: {
              mean_accessibility_score: 88,
              mean_abs_accessibility_gap: 3,
              missing_french_count: 0,
              missing_statement_count: 0,
              high_gap_pair_count: 0,
            },
            points: [],
          },
        ],
      },
    };
    const html = renderInstitutionTrendsIndexPage(report);
    assert.ok(html.includes("↓ improving"), "improving arrow rendered");
  });

  it("renders stable trend arrow", () => {
    const report = {
      ...MINIMAL_REPORT,
      institution_trends: {
        summary: { institutions: 1 },
        institutions: [
          {
            institution: "TBS",
            slug: "tbs",
            days_tracked: 4,
            parity_trend: "stable",
            parity_gap_delta: 1,
            latest: {
              mean_accessibility_score: 82,
              mean_abs_accessibility_gap: 4,
              missing_french_count: 0,
              missing_statement_count: 0,
              high_gap_pair_count: 0,
            },
            points: [],
          },
        ],
      },
    };
    const html = renderInstitutionTrendsIndexPage(report);
    assert.ok(html.includes("→ stable"), "stable arrow rendered");
  });

  it("includes Mean A11y Gap column header", () => {
    const html = renderInstitutionTrendsIndexPage(MINIMAL_REPORT);
    assert.ok(html.includes("Mean A11y Gap"), "gap column header present");
  });

  it("includes Parity Trend column header", () => {
    const html = renderInstitutionTrendsIndexPage(MINIMAL_REPORT);
    assert.ok(html.includes("Parity Trend"), "parity trend column header present");
  });
});

// ---------------------------------------------------------------------------
// renderInstitutionTrendPage
// ---------------------------------------------------------------------------

describe("renderInstitutionTrendPage", () => {
  it("renders without throwing on minimal data", () => {
    assert.doesNotThrow(() => renderInstitutionTrendPage(MINIMAL_REPORT, MINIMAL_INSTITUTION_TREND));
  });

  it("includes institution name in heading", () => {
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, MINIMAL_INSTITUTION_TREND);
    assert.ok(html.includes("Test Agency"), "institution name in page");
  });

  it("includes structural elements and theme toggle", () => {
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, MINIMAL_INSTITUTION_TREND);
    assertStructural(html, "renderInstitutionTrendPage");
    assertThemeToggle(html, "renderInstitutionTrendPage");
  });

  it("shows parity trend label in summary cards", () => {
    const trend = { ...MINIMAL_INSTITUTION_TREND, parity_trend: "worsening", parity_gap_delta: 10 };
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, trend);
    assert.ok(html.includes("↑ worsening"), "worsening label in cards");
  });

  it("shows improving trend label", () => {
    const trend = { ...MINIMAL_INSTITUTION_TREND, parity_trend: "improving", parity_gap_delta: -5 };
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, trend);
    assert.ok(html.includes("↓ improving"), "improving label in cards");
  });

  it("shows Insufficient data label for insufficient_data trend", () => {
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, MINIMAL_INSTITUTION_TREND);
    assert.ok(html.includes("Insufficient data"), "insufficient_data label shown");
  });

  it("includes EN/FR gap trend chart when points have gap data", () => {
    const trend = {
      ...MINIMAL_INSTITUTION_TREND,
      points: [
        {
          run_date: "2026-04-09",
          scanned_urls: 1,
          total_page_load_count: 1000,
          mean_accessibility_score: 80,
          mean_abs_accessibility_gap: 8,
          mean_performance_score: 65,
          missing_french_count: 0,
          missing_statement_count: 0,
          high_gap_pair_count: 0,
        },
        {
          run_date: "2026-04-10",
          scanned_urls: 1,
          total_page_load_count: 1100,
          mean_accessibility_score: 81,
          mean_abs_accessibility_gap: 6,
          mean_performance_score: 66,
          missing_french_count: 0,
          missing_statement_count: 0,
          high_gap_pair_count: 0,
        },
      ],
    };
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, trend);
    assert.ok(html.includes("EN/FR accessibility gap over time"), "gap trend chart present");
  });

  it("includes Mean A11y Gap column in history table", () => {
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, MINIMAL_INSTITUTION_TREND);
    assert.ok(html.includes("Mean A11y Gap"), "gap column in table");
  });

  it("renders history rows for each point", () => {
    const trend = {
      ...MINIMAL_INSTITUTION_TREND,
      points: [
        {
          run_date: "2026-04-08",
          scanned_urls: 2,
          total_page_load_count: 5000,
          mean_accessibility_score: 79,
          mean_abs_accessibility_gap: 6,
          mean_performance_score: 65,
          missing_french_count: 1,
          missing_statement_count: 0,
          high_gap_pair_count: 0,
        },
      ],
    };
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, trend);
    assert.ok(html.includes("2026-04-08"), "point date rendered");
    assert.ok(html.includes("79"), "accessibility score rendered");
    assert.ok(html.includes("6"), "gap value rendered");
  });

  it("escapes XSS in institution name", () => {
    const trend = { ...MINIMAL_INSTITUTION_TREND, institution: '<script>evil()</script>' };
    const html = renderInstitutionTrendPage(MINIMAL_REPORT, trend);
    assert.ok(!html.includes("<script>evil()"), "raw script not present");
    assert.ok(html.includes("&lt;script&gt;"), "script tag escaped");
  });
});

// ---------------------------------------------------------------------------
// renderPriorityIssuesPage
// ---------------------------------------------------------------------------

describe("renderPriorityIssuesPage", () => {
  it("renders without throwing on minimal report", () => {
    assert.doesNotThrow(() => renderPriorityIssuesPage(MINIMAL_REPORT));
  });

  it("includes structural elements and theme toggle", () => {
    const html = renderPriorityIssuesPage(MINIMAL_REPORT);
    assertStructural(html, "renderPriorityIssuesPage");
    assertThemeToggle(html, "renderPriorityIssuesPage");
  });

  it("shows placeholder when no priority issues", () => {
    const html = renderPriorityIssuesPage(MINIMAL_REPORT);
    assert.ok(html.includes("No priority issues"), "placeholder present");
  });

  it("renders issue rows", () => {
    const report = {
      ...MINIMAL_REPORT,
      priority_issues: {
        summary: {},
        top_priority_issues: [],
        all_issues: [
          {
            service_name: "My Account",
            institution: "CRA",
            issue_type: "missing-french",
            issue_detail: "No French counterpart found",
            recommended_action: "Add French URL",
            priority_score: 200,
            recurrence_days: 3,
          },
        ],
        recurring_issues: [],
      },
    };
    const html = renderPriorityIssuesPage(report);
    assert.ok(html.includes("My Account"), "service name rendered");
    assert.ok(html.includes("CRA"), "institution rendered");
    assert.ok(html.includes("200"), "priority score rendered");
  });

  it("escapes XSS in service name", () => {
    const report = {
      ...MINIMAL_REPORT,
      priority_issues: {
        summary: {},
        top_priority_issues: [],
        all_issues: [
          {
            service_name: '<img src=x onerror=alert(1)>',
            institution: "TBS",
            issue_type: "test",
            issue_detail: "detail",
            recommended_action: "action",
            priority_score: 50,
            recurrence_days: 1,
          },
        ],
        recurring_issues: [],
      },
    };
    const html = renderPriorityIssuesPage(report);
    assert.ok(!html.includes('<img src=x onerror=alert(1)>'), "raw XSS not present");
    assert.ok(html.includes("&lt;img"), "img escaped");
  });
});

// ---------------------------------------------------------------------------
// renderRecurringIssuesPage
// ---------------------------------------------------------------------------

describe("renderRecurringIssuesPage", () => {
  it("renders without throwing on minimal report", () => {
    assert.doesNotThrow(() => renderRecurringIssuesPage(MINIMAL_REPORT));
  });

  it("includes structural elements", () => {
    const html = renderRecurringIssuesPage(MINIMAL_REPORT);
    assertStructural(html, "renderRecurringIssuesPage");
    assertThemeToggle(html, "renderRecurringIssuesPage");
  });

  it("shows placeholder when no recurring issues", () => {
    const html = renderRecurringIssuesPage(MINIMAL_REPORT);
    assert.ok(html.includes("No recurring issues"), "placeholder present");
  });
});

// ---------------------------------------------------------------------------
// renderHomePage
// ---------------------------------------------------------------------------

describe("renderHomePage", () => {
  it("renders without throwing", () => {
    assert.doesNotThrow(() => renderHomePage(MINIMAL_REPORT));
  });

  it("includes site title and h1", () => {
    const html = renderHomePage(MINIMAL_REPORT);
    assert.ok(html.includes("Daily CAP"), "site title present");
    assert.ok(html.includes("<h1"), "h1 present");
    assert.ok(html.includes('lang="en"'), "lang attribute present");
  });

  it("includes theme toggle with SVG icon and aria-label", () => {
    const html = renderHomePage(MINIMAL_REPORT);
    assert.ok(html.includes('id="theme-toggle"'), "theme toggle present");
    assert.ok(html.includes("aria-label="), "aria-label on toggle");
    assert.ok(html.includes("<svg"), "SVG icon present");
  });

  it("shows latest scores", () => {
    const html = renderHomePage(MINIMAL_REPORT);
    assert.ok(html.includes("78"), "accessibility score shown");
    assert.ok(html.includes("62"), "performance score shown");
  });

  it("lists recent report links", () => {
    const recentReports = [
      { run_date: "2026-04-09", run_id: "cap-2026-04-09" },
      { run_date: "2026-04-08", run_id: "cap-2026-04-08" },
    ];
    const html = renderHomePage(MINIMAL_REPORT, recentReports);
    assert.ok(html.includes("2026-04-09"), "recent report date present");
    assert.ok(html.includes("cap-2026-04-09"), "recent report run id present");
  });

  it("escapes XSS in run_date", () => {
    const report = { ...MINIMAL_REPORT, run_date: '"><script>evil()</script>' };
    const html = renderHomePage(report);
    assert.ok(!html.includes("<script>evil()"), "raw script not present");
  });
});

// ---------------------------------------------------------------------------
// renderDashboardPage
// ---------------------------------------------------------------------------

describe("renderDashboardPage", () => {
  it("renders landing links with discernible text and explicit labels", () => {
    const html = renderDashboardPage(MINIMAL_REPORT);
    assert.ok(html.includes(">View the Daily CAP home page</a>"), "home link has visible text");
    assert.ok(html.includes(">latest report (2026-04-10)</a>"), "latest report link has visible text");
    assert.ok(html.includes('aria-label="View the Daily CAP home page"'), "home link has aria-label");
    assert.ok(html.includes('aria-label="latest report (2026-04-10)"'), "latest report link has aria-label");
  });

  it("includes exactly one main landmark", () => {
    const html = renderDashboardPage(MINIMAL_REPORT);
    const mainCount = (html.match(/<main\b/g) || []).length;
    assert.equal(mainCount, 1, "dashboard has exactly one main landmark");
  });
});

// ---------------------------------------------------------------------------
// renderArchiveIndexPage (already partially covered in publish-report.test.js,
// extended here for completeness)
// ---------------------------------------------------------------------------

describe("renderArchiveIndexPage", () => {
  it("lists zip links when archives exist", () => {
    const html = renderArchiveIndexPage(["2026-01-01", "2026-02-01"]);
    assert.ok(html.includes("2026-01-01.zip"), "zip link present");
    assert.ok(html.includes("2026-02-01.zip"), "second zip link present");
    assert.ok(html.includes("<li") || html.includes("<a"), "list or link element present");
  });

  it("escapes XSS in archive date", () => {
    const html = renderArchiveIndexPage(['"><script>x()</script>']);
    assert.ok(!html.includes("<script>x()"), "raw script not present");
  });
});
