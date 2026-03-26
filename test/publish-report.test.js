import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { publishReport } from "../src/publish/publish-report.js";

test("publishReport writes detail export files", async () => {
  const outputRoot = await fs.mkdtemp(path.join(os.tmpdir(), "daily-cap-"));
  const report = {
    run_date: "2026-03-26",
    benchmark_summary: { means: {} },
    bilingual_parity: { missing_counterparts: [{ pair_id: "a" }] },
    accessibility_statements: {
      missing_statement_examples: [{ inventory_id: "b" }],
      checks: [{ inventory_id: "c", statement_detected: true }, { inventory_id: "d", statement_detected: false }]
    },
    platform_signals: { cms_url_examples: [{ cms: "drupal", pages: [] }] },
    barrier_history: { summary: { points: 1 }, points: [{ run_date: "2026-03-26" }] },
    priority_issues: { all_issues: [{ issue_key: "a" }], recurring_issues: [{ issue_key: "a" }] },
    institution_scorecards: { all_scorecards: [{ institution: "CRA" }] },
    output_paths: {},
    top_urls: [],
    scan_summary: { total: 0, succeeded: 0, failed: 0 },
    scan_mode: "mock"
  };

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
});