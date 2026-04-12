import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildSummary } from "../src/cli/generate-summary.js";

const BASE_REPORT = {
  run_id: "cap-2026-04-09",
  run_date: "2026-04-09",
  scan_mode: "mock",
  scan_summary: { total: 150, succeeded: 140, failed: 10, excluded: 0 },
  benchmark_summary: {
    means: {
      performance_score: 60.46,
      accessibility_score: 76.97,
      best_practices_score: 72.94,
      seo_score: 82.75
    }
  },
  impact_model: {
    summary: {
      scanned_urls: 150,
      total_page_load_count: 133380179,
      directional_affected_load_estimate: 50976714,
      directional_affected_share_percent: 38.22
    }
  },
  trend_analysis: {
    available: true,
    previous_run_date: "2026-04-08",
    compared_run_date: "2026-04-08",
    metrics: [
      {
        metric: "accessibility_mean",
        label: "Mean Accessibility Score",
        direction: "higher_is_better",
        unit: "points",
        current: 76.97,
        previous: 75.5,
        delta: 1.47,
        is_regression: false,
        severity: null
      }
    ],
    regressions: []
  },
  bilingual_parity: {
    summary: {
      candidate_pairs: 130,
      paired_services: 20,
      complete_success_pairs: 19,
      missing_counterpart: 110,
      missing_english: 0,
      missing_french: 110,
      average_absolute_accessibility_gap: 3.2,
      high_accessibility_gap_pairs: 2
    }
  },
  accessibility_statements: {
    summary: {
      scanned_urls: 150,
      statements_detected: 4,
      statement_coverage_percent: 2.67,
      with_contact_info: 4,
      with_contact_info_percent: 100,
      with_compliance_status: 1,
      with_compliance_status_percent: 25,
      with_freshness_marker: 2,
      with_freshness_marker_percent: 50,
      bilingual_pairs_total: 20,
      bilingual_pairs_both_detected: 0,
      bilingual_pairs_both_detected_percent: 0,
      bilingual_parity_mismatch_pairs: 2
    }
  },
  priority_issues: {
    all_issues: [
      {
        issue_key: "missing-accessibility-statement:curated-002-en",
        issue_type: "missing-accessibility-statement",
        service_name: "Check my Service Canada Account",
        institution: "ESDC",
        language: "en",
        canonical_url: "https://www.canada.ca/en/employment-social-development/services/my-account.html",
        page_load_count: 170000,
        priority_score: 190,
        issue_detail: "No accessibility statement detected for EN variant",
        recommended_action: "Publish an accessibility statement."
      },
      {
        issue_key: "missing-french:curated-010-en",
        issue_type: "missing-french",
        service_name: "CRA My Account",
        institution: "CRA",
        language: "en",
        canonical_url: "https://www.canada.ca/en/revenue-agency/services/e-services/cra-login-services.html",
        page_load_count: 95000,
        priority_score: 145,
        issue_detail: "No French counterpart found",
        recommended_action: "Add French equivalent URL."
      }
    ]
  }
};

describe("buildSummary", () => {
  it("includes the run date in the heading", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(md.includes("2026-04-09"), "run date present");
    assert.ok(md.includes("April 9, 2026"), "human-readable date present");
  });

  it("includes scan summary counts", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(md.includes("140"), "succeeded count");
    assert.ok(md.includes("150"), "total count");
  });

  it("includes aggregate scores", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(md.includes("76.97"), "accessibility score");
    assert.ok(md.includes("60.46"), "performance score");
    assert.ok(md.includes("72.94"), "best practices score");
    assert.ok(md.includes("82.75"), "SEO score");
  });

  it("includes directional impact estimate", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(md.includes("38.22%"), "affected share percent");
    assert.ok(md.includes("Directional estimate only"), "disclaimer present");
  });

  it("includes trend section when available", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(md.includes("2026-04-08"), "previous run date");
    assert.ok(md.includes("Mean Accessibility Score"), "metric label");
    assert.ok(md.includes("+1.47"), "positive delta");
  });

  it("shows no previous run message when trend unavailable", () => {
    const report = { ...BASE_REPORT, trend_analysis: { available: false } };
    const md = buildSummary(report);
    assert.ok(md.includes("No previous run available"), "unavailable message");
  });

  it("includes bilingual parity section", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(md.includes("Bilingual parity"), "section heading");
    assert.ok(md.includes("110"), "missing French count");
    assert.ok(md.includes("3.2"), "accessibility gap");
  });

  it("includes accessibility statements section", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(md.includes("Accessibility statements"), "section heading");
    assert.ok(md.includes("2.67%"), "coverage percent");
    assert.ok(md.includes("50%"), "freshness marker percent");
  });

  it("includes top priority issues table", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(md.includes("Top priority issues"), "section heading");
    assert.ok(md.includes("Check my Service Canada Account"), "service name");
    assert.ok(md.includes("ESDC"), "institution");
    assert.ok(md.includes("190"), "priority score");
  });

  it("limits priority issues to topN", () => {
    const report = {
      ...BASE_REPORT,
      priority_issues: {
        all_issues: Array.from({ length: 10 }, (_, i) => ({
          service_name: `Service ${i}`,
          institution: "TBS",
          issue_detail: `Issue ${i}`,
          priority_score: 100 - i
        }))
      }
    };
    const md = buildSummary(report, { topN: 3 });
    assert.ok(md.includes("Service 0"), "first issue present");
    assert.ok(md.includes("Service 2"), "third issue present");
    assert.ok(!md.includes("Service 3"), "fourth issue absent");
  });

  it("escapes pipe characters in table cells", () => {
    const report = {
      ...BASE_REPORT,
      priority_issues: {
        all_issues: [
          {
            service_name: "Service | with pipe",
            institution: "TBS",
            issue_detail: "Some issue",
            priority_score: 50
          }
        ]
      }
    };
    const md = buildSummary(report);
    assert.ok(md.includes("Service \\| with pipe"), "pipe escaped in table cell");
  });

  it("includes report link in footer", () => {
    const md = buildSummary(BASE_REPORT);
    assert.ok(
      md.includes("https://mgifford.github.io/daily-cap/docs/reports/daily/2026-04-09/index.html"),
      "report URL present"
    );
  });

  it("handles missing optional sections gracefully", () => {
    const minimal = {
      run_date: "2026-01-01",
      scan_mode: "mock",
      scan_summary: { total: 0, succeeded: 0, failed: 0 },
      benchmark_summary: { means: {} }
    };
    assert.doesNotThrow(() => buildSummary(minimal));
    const md = buildSummary(minimal);
    assert.ok(md.includes("2026-01-01"), "date present in minimal report");
  });
});
