import test from "node:test";
import assert from "node:assert/strict";

import { summarizeInstitutionTrends, slugifyInstitution } from "../src/aggregation/institution-trends.js";

function makeReport(runDate, pairs = [], topUrls = []) {
  return {
    run_date: runDate,
    top_urls: topUrls,
    bilingual_parity: { pairs, missing_counterparts: [] },
    accessibility_statements: { missing_statement_examples: [] }
  };
}

function makePair(institution, absGap) {
  return {
    institution,
    abs_accessibility_gap: absGap,
    abs_performance_gap: null,
    scan_status_en: "success",
    scan_status_fr: "success"
  };
}

function makeUrl(institution) {
  return {
    institution,
    page_load_count: 1000,
    lighthouse: { accessibility_score: 80, performance_score: 70 }
  };
}

test("slugifyInstitution converts name to URL-safe slug", () => {
  assert.equal(slugifyInstitution("Canada Revenue Agency"), "canada-revenue-agency");
  assert.equal(slugifyInstitution("IRCC / Immigration"), "ircc-immigration");
  assert.equal(slugifyInstitution(null), "unknown-institution");
});

test("summarizeInstitutionTrends returns summary with institution count", () => {
  const report = makeReport("2026-04-01", [], [makeUrl("CRA"), makeUrl("IRCC")]);
  const result = summarizeInstitutionTrends(report, []);
  assert.equal(result.summary.institutions, 2);
  assert.equal(result.summary.start_date, "2026-04-01");
  assert.equal(result.summary.end_date, "2026-04-01");
});

test("each institution point includes mean_abs_accessibility_gap", () => {
  const pairs = [makePair("CRA", 15), makePair("CRA", 5)];
  const report = makeReport("2026-04-01", pairs, [makeUrl("CRA")]);
  const result = summarizeInstitutionTrends(report, []);
  const cra = result.institutions.find((i) => i.institution === "CRA");
  assert.ok(cra, "CRA should be in institutions");
  assert.equal(cra.latest.mean_abs_accessibility_gap, 10, "mean of 15 and 5 is 10");
});

test("parity_trend is insufficient_data with only one report", () => {
  const pairs = [makePair("CRA", 12)];
  const report = makeReport("2026-04-01", pairs, [makeUrl("CRA")]);
  const result = summarizeInstitutionTrends(report, []);
  const cra = result.institutions.find((i) => i.institution === "CRA");
  assert.equal(cra.parity_trend, "insufficient_data");
  assert.equal(cra.parity_gap_delta, null);
});

test("parity_trend is worsening when gap grows by more than 2", () => {
  const hist = makeReport("2026-03-01", [makePair("CRA", 5)], [makeUrl("CRA")]);
  const curr = makeReport("2026-04-01", [makePair("CRA", 20)], [makeUrl("CRA")]);
  const result = summarizeInstitutionTrends(curr, [hist]);
  const cra = result.institutions.find((i) => i.institution === "CRA");
  assert.equal(cra.parity_trend, "worsening");
  assert.equal(cra.parity_gap_delta, 15);
});

test("parity_trend is improving when gap shrinks by more than 2", () => {
  const hist = makeReport("2026-03-01", [makePair("CRA", 20)], [makeUrl("CRA")]);
  const curr = makeReport("2026-04-01", [makePair("CRA", 3)], [makeUrl("CRA")]);
  const result = summarizeInstitutionTrends(curr, [hist]);
  const cra = result.institutions.find((i) => i.institution === "CRA");
  assert.equal(cra.parity_trend, "improving");
  assert.equal(cra.parity_gap_delta, -17);
});

test("parity_trend is stable when gap changes by 2 or less", () => {
  const hist = makeReport("2026-03-01", [makePair("CRA", 10)], [makeUrl("CRA")]);
  const curr = makeReport("2026-04-01", [makePair("CRA", 11)], [makeUrl("CRA")]);
  const result = summarizeInstitutionTrends(curr, [hist]);
  const cra = result.institutions.find((i) => i.institution === "CRA");
  assert.equal(cra.parity_trend, "stable");
  assert.equal(cra.parity_gap_delta, 1);
});

test("institutions are sorted by total_page_load_count descending", () => {
  const topUrls = [
    { institution: "Small", page_load_count: 100, lighthouse: { accessibility_score: 80, performance_score: 70 } },
    { institution: "Large", page_load_count: 999999, lighthouse: { accessibility_score: 80, performance_score: 70 } }
  ];
  const report = makeReport("2026-04-01", [], topUrls);
  const result = summarizeInstitutionTrends(report, []);
  assert.equal(result.institutions[0].institution, "Large");
  assert.equal(result.institutions[1].institution, "Small");
});

test("institution points accumulate across historical reports", () => {
  const hist1 = makeReport("2026-02-01", [makePair("CRA", 8)], [makeUrl("CRA")]);
  const hist2 = makeReport("2026-03-01", [makePair("CRA", 12)], [makeUrl("CRA")]);
  const curr = makeReport("2026-04-01", [makePair("CRA", 6)], [makeUrl("CRA")]);
  const result = summarizeInstitutionTrends(curr, [hist1, hist2]);
  const cra = result.institutions.find((i) => i.institution === "CRA");
  assert.equal(cra.days_tracked, 3);
  assert.equal(cra.points.length, 3);
  // parity_trend compares first (8) vs last (6): delta = -2, stable (not > 2 drop)
  assert.equal(cra.parity_trend, "stable");
});
