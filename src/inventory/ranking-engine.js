/**
 * Deterministic Ranking Engine
 *
 * Produces explainable, reproducible rankings of service URLs.
 * Used for tier assignment and URL selection.
 */

import { TIER_CONFIG } from "./tier-config.js";

/**
 * Compute ranking score for a single entry
 * Score is deterministic based on: traffic, priority, source, protection flag
 *
 * Algorithm:
 * 1. Base score from traffic (log scale 0-100)
 * 2. Multiply by priority weight (0-1)
 * 3. Add source bonus (top-task > protected > curated > recent)
 * 4. Protected entries get guaranteed inclusion
 */
export function computeRankScore(entry) {
  // Base score from traffic: log(page_loads) * 10, clamped 0-100
  const trafficScore = Math.min(
    100,
    Math.max(0, Math.log10(Math.max(1, entry.page_load_count || 1)) * 20)
  );

  // Priority multiplier (0-1)
  const priorityMultiplier = entry.priority_weight || 0.5;

  // Source bonus
  const sourceBonus = getSourceBonus(entry.source);

  // Combined score
  const baseScore = trafficScore * priorityMultiplier + sourceBonus;

  // Protected entries get extra priority
  const protectionBonus = entry.protected_flag ? 50 : 0;

  const finalScore = baseScore + protectionBonus;

  return {
    score: Number(finalScore.toFixed(2)),
    components: {
      traffic_score: Number(trafficScore.toFixed(2)),
      priority_multiplier: priorityMultiplier,
      source_bonus: sourceBonus,
      protection_bonus: protectionBonus
    },
    explanation: buildScoreExplanation(entry, {
      traffic: trafficScore,
      priority: priorityMultiplier,
      source: sourceBonus,
      protection: protectionBonus
    })
  };
}

function getSourceBonus(source) {
  const bonuses = {
    "top-task": 15,
    "curated": 10,
    "recent": 5,
    "discovered": 0
  };
  return bonuses[source] || 0;
}

function buildScoreExplanation(entry, scores) {
  const parts = [];

  parts.push(
    `Traffic: ${Math.log10(Math.max(1, entry.page_load_count || 1)).toFixed(2)} (log10 of ${entry.page_load_count || 0} loads)`
  );
  parts.push(`Priority weight: ${scores.priority}x`);
  parts.push(`Source bonus: +${scores.source} (${entry.source})`);

  if (scores.protection > 0) {
    parts.push(`Protection bonus: +${scores.protection} (flagged protected)`);
  }

  return parts.join("; ");
}

/**
 * Rank and assign entries to tiers
 * Returns tiered inventory with t1/t2/t3 assignments
 */
export function rankAndTier(entries) {
  // Compute scores for all entries
  const scored = entries.map((entry) => {
    const rankResult = computeRankScore(entry);
    return {
      ...entry,
      rank_score: rankResult.score,
      rank_components: rankResult.components,
      rank_explanation: rankResult.explanation
    };
  });

  // Sort by score descending, then by ID for deterministic tie-breaking
  const sorted = scored.sort((a, b) => {
    if (b.rank_score !== a.rank_score) {
      return b.rank_score - a.rank_score;
    }
    return a.id.localeCompare(b.id);
  });

  // Assign tiers
  const tiered = assignTiers(sorted);

  return {
    entries: tiered,
    ranking: {
      total_entries: tiered.length,
      tier_summary: getTierSummary(tiered),
      top_10: tiered.slice(0, 10).map((e) => ({
        id: e.id,
        service_name: e.service_name,
        score: e.rank_score,
        tier: e.tier
      }))
    }
  };
}

function assignTiers(scored) {
  const tiered = [...scored];
  let t1Count = 0;
  let t2Count = 0;
  let t3Count = 0;

  // First pass: assign based on rules
  for (const entry of tiered) {
    if (t1Count < TIER_CONFIG.tier1.target_count) {
      // Check Tier 1 rules
      const meetsT1 = TIER_CONFIG.tier1.rules.some((rule) =>
        rule.predicate(entry)
      );
      if (meetsT1) {
        entry.tier = "tier-1";
        t1Count += 1;
        continue;
      }
    }
  }

  // Second pass: fill Tier 2 by pattern cohort
  const patternBuckets = {};
  for (const pattern of TIER_CONFIG.tier2.patterns) {
    patternBuckets[pattern] = [];
  }

  for (const entry of tiered) {
    if (entry.tier) continue; // Already assigned
    if (t2Count >= TIER_CONFIG.tier2.target_count) break;

    const pattern = entry.service_pattern;
    if (
      patternBuckets[pattern] &&
      patternBuckets[pattern].length < 15
    ) {
      entry.tier = "tier-2";
      patternBuckets[pattern].push(entry);
      t2Count += 1;
    }
  }

  // Third pass: assign remaining to Tier 3
  for (const entry of tiered) {
    if (!entry.tier) {
      if (t3Count < TIER_CONFIG.tier3.target_count) {
        entry.tier = "tier-3";
        t3Count += 1;
      }
    }
  }

  return tiered;
}

function getTierSummary(tiered) {
  const t1 = tiered.filter((e) => e.tier === "tier-1");
  const t2 = tiered.filter((e) => e.tier === "tier-2");
  const t3 = tiered.filter((e) => e.tier === "tier-3");

  return {
    tier1: {
      count: t1.length,
      target: TIER_CONFIG.tier1.target_count,
      utilization: (t1.length / TIER_CONFIG.tier1.target_count * 100).toFixed(1) + "%"
    },
    tier2: {
      count: t2.length,
      target: TIER_CONFIG.tier2.target_count,
      utilization: (t2.length / TIER_CONFIG.tier2.target_count * 100).toFixed(1) + "%"
    },
    tier3: {
      count: t3.length,
      target: TIER_CONFIG.tier3.target_count,
      utilization: (t3.length / TIER_CONFIG.tier3.target_count * 100).toFixed(1) + "%"
    },
    total: t1.length + t2.length + t3.length
  };
}
