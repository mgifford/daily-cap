import test from "node:test";
import assert from "node:assert/strict";

import { summarizeCohortQuality } from "../src/aggregation/cohort-quality.js";

test("summarizeCohortQuality computes provenance and confidence summaries", () => {
  const scanned = [
    {
      inventory_id: "svc-1-en",
      service_name: "Service 1",
      language: "en",
      canonical_url: "https://example.com/en",
      source: "recent,top-task",
      page_load_count: 100,
      service_pattern: "application",
      service_category: "benefits",
      institution: "ESDC"
    },
    {
      inventory_id: "svc-2-en",
      service_name: "Service 2",
      language: "en",
      canonical_url: "https://example.com/2",
      source: "discovered",
      page_load_count: 0,
      service_pattern: "help",
      service_category: "service",
      institution: null
    }
  ];

  const result = summarizeCohortQuality(scanned);

  assert.equal(result.summary.scanned_urls, 2);
  assert.equal(result.summary.multi_source_urls, 1);
  assert.equal(result.summary.discovered_only_urls, 1);
  assert.equal(result.summary.with_recent_signal_urls, 1);
  assert.equal(result.summary.with_traffic_data_urls, 1);
  assert.equal(result.summary.unknown_institution_urls, 1);
  assert.equal(result.provenance_examples.length, 2);
  assert.ok(result.distributions.source_lineage.length >= 2);
});