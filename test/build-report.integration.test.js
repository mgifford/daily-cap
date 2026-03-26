import test from "node:test";
import assert from "node:assert/strict";

import { buildDailyReport } from "../src/aggregation/build-report.js";

test("buildDailyReport includes phase 9 sections in payload", () => {
  const inventory = {
    scan_target_count: 2,
    scan_targets: [],
    selected_count: 1,
    source_distribution: { "top-task": 1 },
    tier_validation: { tier1: { assigned: 1, target: 150 } },
    ranking_summary: { top_10: [] }
  };

  const scanned = [
    {
      inventory_id: "svc-1-en",
      paired_inventory_id: "svc-1-fr",
      language: "en",
      canonical_url: "https://example.com/en",
      service_name: "Service 1",
      institution: "Dept",
      source: "top-task",
      tier: "tier-1",
      service_pattern: "application",
      service_category: "benefits",
      page_load_count: 100000,
      rank_score: 90,
      scan_status: "success",
      failure_reason: null,
      lighthouse: {
        performance_score: 70,
        accessibility_score: 70,
        best_practices_score: 75,
        seo_score: 82,
        by_context: {
          desktop_light: { performance_score: 70, accessibility_score: 70, best_practices_score: 75, seo_score: 82 },
          desktop_dark: { performance_score: 68, accessibility_score: 67, best_practices_score: 75, seo_score: 82 },
          mobile_light: { performance_score: 64, accessibility_score: 70, best_practices_score: 73, seo_score: 81 },
          mobile_dark: { performance_score: 61, accessibility_score: 66, best_practices_score: 72, seo_score: 80 }
        }
      },
      scangov: { critical: 1, serious: 0, moderate: 1, minor: 0 },
      accessibility_statement: {
        statement_detected: true,
        has_contact_info: true,
        mentions_compliance_status: true,
        mentions_alternative_support: true,
        has_freshness_marker: true
      },
      platform_fingerprint: {
        cms: "drupal",
        design_system: "gcweb-wet",
        hosting_hint: "azure",
        confidence: 0.8
      }
    },
    {
      inventory_id: "svc-1-fr",
      paired_inventory_id: "svc-1-en",
      language: "fr",
      canonical_url: "https://example.com/fr",
      service_name: "Service 1",
      institution: "Dept",
      source: "top-task",
      tier: "tier-1",
      service_pattern: "application",
      service_category: "benefits",
      page_load_count: 90000,
      rank_score: 88,
      scan_status: "success",
      failure_reason: null,
      lighthouse: {
        performance_score: 68,
        accessibility_score: 79,
        best_practices_score: 74,
        seo_score: 80,
        by_context: {
          desktop_light: { performance_score: 68, accessibility_score: 79, best_practices_score: 74, seo_score: 80 },
          desktop_dark: { performance_score: 66, accessibility_score: 76, best_practices_score: 74, seo_score: 80 },
          mobile_light: { performance_score: 62, accessibility_score: 79, best_practices_score: 72, seo_score: 79 },
          mobile_dark: { performance_score: 59, accessibility_score: 75, best_practices_score: 71, seo_score: 78 }
        }
      },
      scangov: { critical: 0, serious: 1, moderate: 0, minor: 1 },
      accessibility_statement: {
        statement_detected: true,
        has_contact_info: true,
        mentions_compliance_status: false,
        mentions_alternative_support: true,
        has_freshness_marker: false
      },
      platform_fingerprint: {
        cms: "drupal",
        design_system: "gcweb-wet",
        hosting_hint: "azure",
        confidence: 0.8
      }
    }
  ];

  const report = buildDailyReport({
    runDate: "2026-03-25",
    runId: "cap-2026-03-25",
    mode: "mock",
    inventory,
    scanned,
    historicalReports: [
      {
        run_date: "2026-03-23",
        scan_summary: { total: 2 },
        accessibility_statements: { summary: { statements_detected: 1 } },
        bilingual_parity: { summary: { missing_french: 1, missing_english: 0, high_accessibility_gap_pairs: 0, average_absolute_accessibility_gap: 1 } },
        impact_model: { summary: { directional_affected_share_percent: 20 } }
      }
    ],
    previousReport: {
      run_date: "2026-03-24",
      scan_summary: { total: 2, failed: 0 },
      benchmark_summary: { means: { accessibility_score: 85 } },
      accessibility_statements: { summary: { statement_coverage_percent: 95 } },
      bilingual_parity: {
        summary: { average_absolute_accessibility_gap: 2 }
      },
      impact_model: {
        summary: { directional_affected_share_percent: 22 }
      }
    }
  });

  assert.equal(report.methodology.status, "phase-11");
  assert.ok(report.bilingual_parity);
  assert.ok(report.accessibility_statements);
  assert.ok(report.platform_signals);
  assert.ok(report.impact_model);
  assert.ok(report.cohort_quality);
  assert.ok(report.lighthouse_contexts);
  assert.ok(report.barrier_history);
  assert.ok(report.priority_issues);
  assert.ok(report.institution_scorecards);
  assert.equal(report.barrier_history.summary.points, 2);
  assert.ok(report.priority_issues.top_priority_issues.length >= 1);
  assert.ok(report.institution_scorecards.scorecards.length >= 1);
  assert.equal(report.lighthouse_contexts.summary.scanned_urls_with_context_data, 2);
  assert.equal(report.lighthouse_contexts.highlights.mobile_dark_vs_desktop_light.performance_score, -9);
  assert.equal(report.cohort_quality.summary.scanned_urls, 2);
  assert.equal(report.cohort_quality.summary.with_traffic_data_percent, 100);
  assert.ok(report.trend_analysis);
  assert.equal(report.trend_analysis.available, true);
  assert.equal(report.top_urls.length, 2);
  assert.equal(report.scan_summary.total, 2);
});
