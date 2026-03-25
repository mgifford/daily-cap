import test from "node:test";
import assert from "node:assert/strict";

import { computeBilingualParity } from "../src/aggregation/bilingual-parity.js";

test("computeBilingualParity returns pair gaps and missing counterparts", () => {
  const scanned = [
    {
      inventory_id: "svc-1-en",
      paired_inventory_id: "svc-1-fr",
      service_name: "Service 1",
      language: "en",
      canonical_url: "https://example.com/en",
      scan_status: "success",
      lighthouse: { accessibility_score: 80, performance_score: 70 },
      scangov: { critical: 1, serious: 2, moderate: 0, minor: 1 }
    },
    {
      inventory_id: "svc-1-fr",
      paired_inventory_id: "svc-1-en",
      service_name: "Service 1",
      language: "fr",
      canonical_url: "https://example.com/fr",
      scan_status: "success",
      lighthouse: { accessibility_score: 75, performance_score: 65 },
      scangov: { critical: 0, serious: 1, moderate: 2, minor: 1 }
    },
    {
      inventory_id: "svc-2-en",
      paired_inventory_id: "svc-2-fr",
      service_name: "Service 2",
      language: "en",
      canonical_url: "https://example.com/en-2",
      scan_status: "success",
      lighthouse: { accessibility_score: 90, performance_score: 88 },
      scangov: { critical: 0, serious: 0, moderate: 0, minor: 0 }
    }
  ];

  const result = computeBilingualParity(scanned);

  assert.equal(result.summary.candidate_pairs, 2);
  assert.equal(result.summary.paired_services, 1);
  assert.equal(result.summary.missing_counterpart, 1);
  assert.equal(result.summary.missing_french, 1);
  assert.equal(result.summary.average_absolute_accessibility_gap, 5);
  assert.equal(result.pairs[0].accessibility_gap, 5);
});
