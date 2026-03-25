import { rankAndTier } from "./ranking-engine.js";
import { TIER_CONFIG, validateTierAssignment } from "./tier-config.js";

/**
 * Build inventory from seed or ingested entries
 *
 * Process:
 * 1. Apply ranking algorithm (deterministic score)
 * 2. Assign entries to tiers (T1/T2/T3)
 * 3. Expand bilingual pairs
 * 4. Return scan targets with language-specific metadata
 *
 * Options:
 * - limit: max scan targets (default 50; usually filtered by tier)
 * - tier: which tier(s) to include default: "tier-1,tier-2,tier-3"
 */
export function buildInventory(seedEntries, options = {}) {
  const limit = options.limit || 50;
  const requestedTiers = (options.tier || "tier-1,tier-2,tier-3").split(",").map((t) => t.trim());

  // Apply ranking and tier assignment
  const ranked = rankAndTier(seedEntries);

  // Filter to requested tiers
  const tieredEntries = ranked.entries.filter((entry) =>
    requestedTiers.includes(entry.tier)
  );

  // Limit results
  const selected = tieredEntries.slice(0, limit);

  // Expand bilingual pairs for scanning
  const scanTargets = [];
  for (const entry of selected) {
    // English variant
    if (entry.url_en) {
      scanTargets.push({
        inventory_id: `${entry.id}-en`,
        language: "en",
        canonical_url: entry.url_en,
        paired_inventory_id: entry.url_fr ? `${entry.id}-fr` : null,
        service_name: entry.service_name,
        institution: entry.institution,
        rank_score: entry.rank_score,
        rank_components: entry.rank_components,
        rank_explanation: entry.rank_explanation,
        tier: entry.tier,
        source: entry.source,
        service_pattern: entry.service_pattern || "unclassified",
        service_category: entry.service_category || "other",
        page_load_count: entry.page_load_count || 0,
        priority_weight: entry.priority_weight || 0.5
      });
    }

    // French variant (if present)
    if (entry.url_fr) {
      scanTargets.push({
        inventory_id: `${entry.id}-fr`,
        language: "fr",
        canonical_url: entry.url_fr,
        paired_inventory_id: entry.url_en ? `${entry.id}-en` : null,
        service_name: entry.service_name,
        institution: entry.institution,
        rank_score: entry.rank_score,
        rank_components: entry.rank_components,
        rank_explanation: entry.rank_explanation,
        tier: entry.tier,
        source: entry.source,
        service_pattern: entry.service_pattern || "unclassified",
        service_category: entry.service_category || "other",
        page_load_count: entry.page_load_count || 0,
        priority_weight: entry.priority_weight || 0.5
      });
    }
  }

  return {
    scan_targets: scanTargets,
    ranking_summary: ranked.ranking,
    tier_validation: validateTierAssignment(selected),
    selected_count: selected.length,
    scan_target_count: scanTargets.length,
    source_distribution: getSourceDistribution(selected)
  };
}

function getSourceDistribution(entries) {
  const dist = {};
  for (const entry of entries) {
    dist[entry.source] = (dist[entry.source] || 0) + 1;
  }
  return dist;
}
