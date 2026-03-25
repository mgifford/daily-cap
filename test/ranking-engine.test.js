import test from "node:test";
import assert from "node:assert/strict";

import { computeRankScore, rankAndTier } from "../src/inventory/ranking-engine.js";

test("computeRankScore is deterministic for identical input", () => {
  const entry = {
    id: "svc-1",
    service_name: "Service One",
    source: "top-task",
    page_load_count: 100000,
    priority_weight: 0.9,
    protected_flag: false
  };

  const a = computeRankScore(entry);
  const b = computeRankScore(entry);

  assert.equal(a.score, b.score);
  assert.deepEqual(a.components, b.components);
});

test("computeRankScore applies protection bonus", () => {
  const base = {
    id: "svc-2",
    service_name: "Service Two",
    source: "recent",
    page_load_count: 50000,
    priority_weight: 0.8,
    protected_flag: false
  };

  const unprotected = computeRankScore(base);
  const protectedScore = computeRankScore({ ...base, protected_flag: true });

  assert.equal(protectedScore.score, Number((unprotected.score + 50).toFixed(2)));
});

test("rankAndTier sorts by rank score then id for ties", () => {
  const entries = [
    {
      id: "b-id",
      service_name: "B",
      source: "discovered",
      page_load_count: 1000,
      priority_weight: 0.5,
      protected_flag: false,
      service_pattern: "unknown"
    },
    {
      id: "a-id",
      service_name: "A",
      source: "discovered",
      page_load_count: 1000,
      priority_weight: 0.5,
      protected_flag: false,
      service_pattern: "unknown"
    }
  ];

  const result = rankAndTier(entries);

  assert.equal(result.entries[0].id, "a-id");
  assert.equal(result.entries[1].id, "b-id");
});

test("rankAndTier assigns tier-1 when tier-1 predicates match", () => {
  const entries = [
    {
      id: "t1",
      service_name: "Tier One",
      source: "top-task",
      page_load_count: 120000,
      priority_weight: 0.9,
      protected_flag: false,
      service_pattern: "application"
    }
  ];

  const result = rankAndTier(entries);

  assert.equal(result.entries[0].tier, "tier-1");
  assert.equal(result.ranking.tier_summary.tier1.count, 1);
});
