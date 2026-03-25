import test from "node:test";
import assert from "node:assert/strict";

import { computeDirectionalImpact } from "../src/aggregation/impact-model.js";

test("computeDirectionalImpact returns directional summaries and top impacted rows", () => {
  const scanned = [
    {
      inventory_id: "svc-1-en",
      service_name: "Service 1",
      language: "en",
      canonical_url: "https://example.com/en",
      tier: "tier-1",
      source: "top-task",
      service_category: "benefits",
      page_load_count: 100000,
      lighthouse: { accessibility_score: 60 },
      scangov: { critical: 1, serious: 2, moderate: 1, minor: 0 },
      accessibility_statement: { statement_detected: false }
    },
    {
      inventory_id: "svc-1-fr",
      service_name: "Service 1",
      language: "fr",
      canonical_url: "https://example.com/fr",
      tier: "tier-1",
      source: "top-task",
      service_category: "benefits",
      page_load_count: 90000,
      lighthouse: { accessibility_score: 80 },
      scangov: { critical: 0, serious: 1, moderate: 0, minor: 1 },
      accessibility_statement: { statement_detected: true }
    }
  ];

  const result = computeDirectionalImpact(scanned);

  assert.equal(result.summary.scanned_urls, 2);
  assert.ok(result.summary.total_page_load_count > 0);
  assert.ok(result.summary.directional_affected_load_estimate > 0);
  assert.ok(result.top_directional_impact_urls.length > 0);
  assert.equal(result.by_tier.length, 3);
  assert.equal(result.by_language.length, 2);
});
