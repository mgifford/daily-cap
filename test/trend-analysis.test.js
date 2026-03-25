import test from "node:test";
import assert from "node:assert/strict";

import { computeTrendAnalysis } from "../src/aggregation/trend-analysis.js";

test("computeTrendAnalysis returns unavailable state when no previous report", () => {
  const current = {
    run_date: "2026-03-25",
    scan_summary: { total: 10, failed: 0 },
    benchmark_summary: { means: { accessibility_score: 80 } },
    accessibility_statements: { summary: { statement_coverage_percent: 75 } },
    bilingual_parity: { summary: { average_absolute_accessibility_gap: 4 } },
    impact_model: { summary: { directional_affected_share_percent: 35 } }
  };

  const result = computeTrendAnalysis(current, null);

  assert.equal(result.available, false);
  assert.equal(result.metrics.length, 0);
  assert.equal(result.regressions.length, 0);
});

test("computeTrendAnalysis detects configured regressions", () => {
  const previous = {
    run_date: "2026-03-24",
    scan_summary: { total: 100, failed: 1 },
    benchmark_summary: { means: { accessibility_score: 82 } },
    accessibility_statements: { summary: { statement_coverage_percent: 80 } },
    bilingual_parity: { summary: { average_absolute_accessibility_gap: 2 } },
    impact_model: { summary: { directional_affected_share_percent: 30 } }
  };

  const current = {
    run_date: "2026-03-25",
    scan_summary: { total: 100, failed: 9 },
    benchmark_summary: { means: { accessibility_score: 76 } },
    accessibility_statements: { summary: { statement_coverage_percent: 72 } },
    bilingual_parity: { summary: { average_absolute_accessibility_gap: 7 } },
    impact_model: { summary: { directional_affected_share_percent: 38 } }
  };

  const result = computeTrendAnalysis(current, previous);

  assert.equal(result.available, true);
  assert.equal(result.previous_run_date, "2026-03-24");
  assert.ok(result.metrics.length >= 5);
  assert.ok(result.regressions.length >= 4);

  const labels = result.regressions.map((row) => row.label);
  assert.ok(labels.includes("Mean Accessibility Score"));
  assert.ok(labels.includes("Accessibility Statement Coverage"));
  assert.ok(labels.includes("Average Absolute EN/FR Accessibility Gap"));
});
