import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { publishReport } from "../src/publish/publish-report.js";
import { renderArchiveIndexPage } from "../src/publish/render-pages.js";

const BASE_REPORT = {
  run_date: "2026-03-26",
  run_id: "cap-2026-03-26",
  benchmark_summary: { means: { performance_score: 80, accessibility_score: 85, best_practices_score: 75, seo_score: 90 } },
  bilingual_parity: { missing_counterparts: [{ pair_id: "a" }] },
  accessibility_statements: {
    missing_statement_examples: [{ inventory_id: "b" }],
    checks: [{ inventory_id: "c", statement_detected: true }, { inventory_id: "d", statement_detected: false }]
  },
  platform_signals: { cms_url_examples: [{ cms: "drupal", pages: [] }] },
  barrier_history: { summary: { points: 1 }, points: [{ run_date: "2026-03-26" }] },
  priority_issues: { all_issues: [{ issue_key: "a" }], recurring_issues: [{ issue_key: "a" }] },
  institution_scorecards: { all_scorecards: [{ institution: "CRA" }] },
  institution_trends: {
    summary: { institutions: 1, start_date: "2026-03-25", end_date: "2026-03-26" },
    institutions: [
      {
        institution: "CRA",
        slug: "cra",
        days_tracked: 2,
        latest: {
          mean_accessibility_score: 84,
          missing_french_count: 1,
          missing_statement_count: 1,
          high_gap_pair_count: 0
        },
        points: [
          {
            run_date: "2026-03-25",
            scanned_urls: 1,
            total_page_load_count: 100,
            mean_accessibility_score: 82,
            mean_performance_score: 70,
            missing_french_count: 1,
            missing_statement_count: 1,
            high_gap_pair_count: 0
          },
          {
            run_date: "2026-03-26",
            scanned_urls: 1,
            total_page_load_count: 120,
            mean_accessibility_score: 84,
            mean_performance_score: 72,
            missing_french_count: 1,
            missing_statement_count: 1,
            high_gap_pair_count: 0
          }
        ]
      }
    ]
  },
  output_paths: {},
  top_urls: [],
  scan_summary: { total: 0, succeeded: 0, failed: 0 },
  scan_mode: "mock"
};

test("publishReport writes detail export files", async () => {
  const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "daily-cap-"));
  const report = { ...BASE_REPORT };

  await publishReport({ report, outputRoot });

  const detailsDir = path.join(outputRoot, "docs", "reports", "daily", "2026-03-26", "details");
  const files = await fs.readdir(detailsDir);

  assert.ok(files.includes("missing-counterparts.json"));
  assert.ok(files.includes("missing-statements.json"));
  assert.ok(files.includes("detected-statements.json"));
  assert.ok(files.includes("cms-buckets.json"));
  assert.ok(files.includes("barrier-history.json"));
  assert.ok(files.includes("priority-issues.json"));
  assert.ok(files.includes("recurring-issues.json"));
  assert.ok(files.includes("institution-scorecards.json"));
  assert.ok(files.includes("institution-trends.json"));
  assert.ok(files.includes("priority-issues.html"));
  assert.ok(files.includes("recurring-issues.html"));
  assert.ok(files.includes("institution-scorecards.html"));
  assert.ok(files.includes("institution-trends.html"));

  const institutionFiles = await fs.readdir(path.join(detailsDir, "institutions"));
  assert.ok(institutionFiles.includes("cra.html"));
});

test("publishReport writes docs/index.html with latest scores and recent report", async () => {
  const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "daily-cap-"));
  const report = { ...BASE_REPORT };

  await publishReport({ report, outputRoot });

  const homePath = path.join(outputRoot, "docs", "index.html");
  const html = await fs.readFile(homePath, "utf8");

  assert.ok(html.includes("Daily CAP"), "home page has site title");
  assert.ok(html.includes("2026-03-26"), "home page shows run date");
  assert.ok(html.includes("80"), "home page shows performance score");
  assert.ok(html.includes("85"), "home page shows accessibility score");
  assert.ok(html.includes("Open latest report"), "home page has open latest report link");
  assert.ok(html.includes("Recent Reports"), "home page has recent reports section");
  assert.ok(html.includes("cap-2026-03-26"), "home page shows run id");
  assert.ok(html.includes("Report Archive"), "home page has report archive section");
  assert.ok(html.includes("Browse report archives"), "home page has browse archives link");
  assert.ok(html.includes("reports/archive/index.html"), "home page links to archive index page");
});

test("publishReport writes docs/reports/archive/index.html", async () => {
  const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "daily-cap-"));
  const report = { ...BASE_REPORT };

  await publishReport({ report, outputRoot });

  const archivePath = path.join(outputRoot, "docs", "reports", "archive", "index.html");
  const html = await fs.readFile(archivePath, "utf8");

  assert.ok(html.includes("Report Archive"), "archive index has page title");
  assert.ok(html.includes("14 days"), "archive index describes 14-day threshold");
  assert.ok(html.includes("Back to Daily CAP"), "archive index has back link");
});

test("publishReport writes docs/reports/index.html as redirect", async () => {
  const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "daily-cap-"));
  const report = { ...BASE_REPORT };

  await publishReport({ report, outputRoot });

  const dashPath = path.join(outputRoot, "docs", "reports", "index.html");
  const html = await fs.readFile(dashPath, "utf8");

  assert.ok(html.includes("<main>"), "dashboard content is contained by main landmark");
  assert.ok(html.includes("<h1>Daily CAP Reports</h1>"), "dashboard has a page heading");
  assert.ok(!html.includes("http-equiv"), "dashboard does not use meta refresh redirect");
  assert.ok(html.includes("moved"), "dashboard mentions page has moved");
});

test("renderArchiveIndexPage with no archives shows placeholder message", () => {
  const html = renderArchiveIndexPage([]);

  assert.ok(html.includes("Report Archive"), "page has title");
  assert.ok(html.includes("No archives are available yet"), "shows no-archives message");
  assert.ok(html.includes("Back to Daily CAP"), "has back link");
  assert.ok(!html.includes(".zip"), "no zip links when empty");
});

test("renderArchiveIndexPage with archived dates lists zip links", () => {
  const html = renderArchiveIndexPage(["2026-01-01", "2026-01-02"]);

  assert.ok(html.includes("2026-01-01.zip"), "links to first archive zip");
  assert.ok(html.includes("2026-01-02.zip"), "links to second archive zip");
  assert.ok(!html.includes("No archives are available yet"), "no placeholder when archives exist");
});
