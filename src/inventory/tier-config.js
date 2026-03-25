/**
 * Tier Configuration
 *
 * Defines how URLs are assigned to tiers based on ranking.
 * Tier 1: Primary benchmark (core high-value endpoints)
 * Tier 2: Pattern cohorts (grouped by service pattern)
 * Tier 3: Discovery/rotation (lower priority, rotating candidates)
 */

export const TIER_CONFIG = {
  // Tier 1: Core benchmark URLs (target 150)
  tier1: {
    target_count: 150,
    description: "Primary benchmark: high-traffic, protected, top-task URLs",
    rules: [
      {
        name: "protected_always",
        description: "URLs flagged as protected always go to Tier 1",
        predicate: (entry) => entry.protected_flag === true
      },
      {
        name: "top_tasks",
        description: "URLs from top-task source with high priority",
        predicate: (entry) => entry.source === "top-task" && entry.priority_weight >= 0.85
      },
      {
        name: "recent_high_traffic",
        description: "Recent activity URLs with > 10k page loads",
        predicate: (entry) =>
          entry.source === "recent" && (entry.page_load_count || 0) > 10000
      },
      {
        name: "curated_high_priority",
        description: "Curated endpoints with priority > 0.8",
        predicate: (entry) =>
          entry.source === "curated" && entry.priority_weight >= 0.8
      }
    ]
  },

  // Tier 2: Pattern cohorts (service pattern grouping)
  tier2: {
    target_count: 100,
    description: "Grouped by service pattern for pattern-specific analysis",
    patterns: [
      "sign-in",
      "dashboard",
      "application",
      "status",
      "estimator",
      "payment",
      "help"
    ],
    rules: [
      {
        name: "pattern_cohort",
        description: "Fill each pattern cohort with top-scoring URLs",
        per_pattern: 15 // up to 15 per pattern
      }
    ]
  },

  // Tier 3: Discovery / rotation
  tier3: {
    target_count: 50,
    description: "Lower-priority discovery URLs, rotated periodically",
    rules: [
      {
        name: "remaining_urls",
        description: "Remaining URLs after T1 and T2 fill"
      }
    ]
  },

  // Protected endpoints (always include, regardless of ranking)
  protected_endpoints: [
    // These can be marked in the seed data with protected_flag: true
  ]
};

/**
 * Get total scannable URLs across all tiers
 */
export function getTotalTierCapacity() {
  return (
    TIER_CONFIG.tier1.target_count +
    TIER_CONFIG.tier2.target_count +
    TIER_CONFIG.tier3.target_count
  );
}

/**
 * Validate tier assignment
 */
export function validateTierAssignment(tieredInventory) {
  const t1 = tieredInventory.filter((e) => e.tier === "tier-1").length;
  const t2 = tieredInventory.filter((e) => e.tier === "tier-2").length;
  const t3 = tieredInventory.filter((e) => e.tier === "tier-3").length;

  return {
    tier1: { assigned: t1, target: TIER_CONFIG.tier1.target_count },
    tier2: { assigned: t2, target: TIER_CONFIG.tier2.target_count },
    tier3: { assigned: t3, target: TIER_CONFIG.tier3.target_count },
    total: t1 + t2 + t3,
    coverage: ((t1 + t2 + t3) / getTotalTierCapacity()) * 100
  };
}
