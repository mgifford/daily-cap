import test from "node:test";
import assert from "node:assert/strict";

import { summarizeAccessibilityStatements } from "../src/aggregation/accessibility-statements.js";

test("summarizeAccessibilityStatements calculates coverage and parity mismatch", () => {
  const scanned = [
    {
      inventory_id: "svc-1-en",
      paired_inventory_id: "svc-1-fr",
      service_name: "Service 1",
      language: "en",
      canonical_url: "https://example.com/en",
      source: "top-task",
      tier: "tier-1",
      accessibility_statement: {
        statement_detected: true,
        has_contact_info: true,
        mentions_compliance_status: true,
        mentions_alternative_support: true,
        has_freshness_marker: false
      }
    },
    {
      inventory_id: "svc-1-fr",
      paired_inventory_id: "svc-1-en",
      service_name: "Service 1",
      language: "fr",
      canonical_url: "https://example.com/fr",
      source: "top-task",
      tier: "tier-1",
      accessibility_statement: {
        statement_detected: false,
        has_contact_info: false,
        mentions_compliance_status: false,
        mentions_alternative_support: false,
        has_freshness_marker: false
      }
    }
  ];

  const result = summarizeAccessibilityStatements(scanned);

  assert.equal(result.summary.scanned_urls, 2);
  assert.equal(result.summary.statements_detected, 1);
  assert.equal(result.summary.statement_coverage_percent, 50);
  assert.equal(result.summary.bilingual_pairs_total, 1);
  assert.equal(result.summary.bilingual_parity_mismatch_pairs, 1);
  assert.equal(result.by_language.en.coverage_percent, 100);
  assert.equal(result.by_language.fr.coverage_percent, 0);
  assert.equal(result.missing_statement_examples.length, 1);
});
