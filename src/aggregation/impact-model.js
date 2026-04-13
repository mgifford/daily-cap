import { STATISTICS_CANADA_DISABILITY_STATS, isStatsDataStale } from "../data/statistics-canada-disability-stats.js";
import { AXE_TO_FPS } from "../data/axe-to-fps.js";
import { FPS_LABELS } from "../data/fps-labels.js";

function round(value) {
  return Number(value.toFixed(2));
}

function safePercent(part, total) {
  if (!total) {
    return null;
  }
  return round((part / total) * 100);
}

function severityWeight(lighthouseA11y, scangov) {
  const a11yPenalty = Math.max(0, 100 - (lighthouseA11y || 0));
  const findings =
    (scangov?.critical || 0) * 4 +
    (scangov?.serious || 0) * 2 +
    (scangov?.moderate || 0) +
    (scangov?.minor || 0) * 0.5;

  return {
    a11y_penalty: a11yPenalty,
    findings_weight: findings,
    blended_weight: a11yPenalty + findings
  };
}

/**
 * Derive the set of FPS codes implicated by a scanned row's axe findings.
 * Returns a Set of FPS code strings.
 */
function impliedFpsCodes(row) {
  const codes = new Set();
  for (const finding of row.axe_findings ?? []) {
    for (const code of AXE_TO_FPS.get(finding.id) ?? []) {
      codes.add(code);
    }
  }
  // If no axe findings, fall back to all FPS codes that relate to
  // the accessibility score deficit (broad signal only).
  return codes;
}

/**
 * Compute directional impact estimates per CAN/ASC EN 301 549:2024 FPS category
 * and in aggregate.
 *
 * All figures are directional estimates only. They combine automated quality signals
 * with Statistics Canada disability prevalence data to produce rough indicators of
 * scale. They do not represent measured user harm or legal compliance status.
 *
 * @param {object[]} scanned - Array of scanned URL result objects.
 * @returns {object} Impact summary with per-FPS breakdown and top impacted URLs.
 */
export function computeDirectionalImpact(scanned) {
  const fpsRates = STATISTICS_CANADA_DISABILITY_STATS.fps_rates;

  const rows = scanned.map((row) => {
    const traffic = row.page_load_count || 0;
    const a11y = row.lighthouse?.accessibility_score ?? null;
    const statementDetected = row.accessibility_statement?.statement_detected === true;

    const sev = severityWeight(a11y, row.scangov);
    const statementMultiplier = statementDetected ? 1 : 1.15;

    // Directional estimate: higher when traffic is high and automated signals are poor.
    const affectedLoadEstimate = round((traffic * (sev.blended_weight / 100)) * statementMultiplier);

    return {
      inventory_id: row.inventory_id,
      service_name: row.service_name,
      language: row.language,
      canonical_url: row.canonical_url,
      tier: row.tier,
      source: row.source,
      service_category: row.service_category,
      page_load_count: traffic,
      accessibility_score: a11y,
      statement_detected: statementDetected,
      blended_severity_weight: round(sev.blended_weight),
      directional_affected_load_estimate: affectedLoadEstimate,
      implied_fps_codes: [...impliedFpsCodes(row)]
    };
  });

  const totalLoad = rows.reduce((sum, row) => sum + row.page_load_count, 0);
  const totalAffectedDirectional = rows.reduce(
    (sum, row) => sum + row.directional_affected_load_estimate,
    0
  );

  // Per-FPS directional impact breakdown.
  const byFps = Object.entries(fpsRates).map(([code, data]) => {
    // URLs with an implied FPS match contribute their full affected load estimate.
    // URLs with no axe findings contribute a proportional share based on a11y score deficit.
    const fpsRows = rows.filter(
      (row) => row.implied_fps_codes.includes(code) || row.implied_fps_codes.length === 0
    );
    const affectedLoad = fpsRows.reduce(
      (sum, row) => sum + row.directional_affected_load_estimate,
      0
    );
    const canadianPopulation = STATISTICS_CANADA_DISABILITY_STATS.canada_population;
    const directionalEstimate = round(affectedLoad * data.rate);

    return {
      fps_code: code,
      fps_label: FPS_LABELS[code] ?? code,
      prevalence_rate: data.rate,
      estimated_population: data.estimated_population,
      affected_load: round(affectedLoad),
      directional_canadian_estimate: directionalEstimate,
      directional_canadian_estimate_per_million: round(
        (directionalEstimate / canadianPopulation) * 1_000_000
      ),
      source_note: data.source_note
    };
  });

  const byTier = ["tier-1", "tier-2", "tier-3"].map((tier) => {
    const subset = rows.filter((row) => row.tier === tier);
    const load = subset.reduce((sum, row) => sum + row.page_load_count, 0);
    const affected = subset.reduce(
      (sum, row) => sum + row.directional_affected_load_estimate,
      0
    );
    return {
      tier,
      scanned_urls: subset.length,
      page_load_count: load,
      directional_affected_load_estimate: affected,
      affected_share_percent: safePercent(affected, totalAffectedDirectional)
    };
  });

  const byLanguage = ["en", "fr"].map((language) => {
    const subset = rows.filter((row) => row.language === language);
    const load = subset.reduce((sum, row) => sum + row.page_load_count, 0);
    const affected = subset.reduce(
      (sum, row) => sum + row.directional_affected_load_estimate,
      0
    );
    return {
      language,
      scanned_urls: subset.length,
      page_load_count: load,
      directional_affected_load_estimate: affected,
      affected_share_percent: safePercent(affected, totalAffectedDirectional)
    };
  });

  const topImpacted = [...rows]
    .sort(
      (a, b) =>
        b.directional_affected_load_estimate - a.directional_affected_load_estimate ||
        a.inventory_id.localeCompare(b.inventory_id)
    )
    .slice(0, 15);

  return {
    summary: {
      scanned_urls: rows.length,
      total_page_load_count: totalLoad,
      directional_affected_load_estimate: totalAffectedDirectional,
      directional_affected_share_percent: safePercent(
        totalAffectedDirectional,
        totalLoad
      )
    },
    by_fps: byFps,
    by_tier: byTier,
    by_language: byLanguage,
    top_directional_impact_urls: topImpacted,
    data_provenance: {
      source: STATISTICS_CANADA_DISABILITY_STATS.source,
      source_url: STATISTICS_CANADA_DISABILITY_STATS.source_url,
      vintage_year: STATISTICS_CANADA_DISABILITY_STATS.vintage_year,
      next_review_date: STATISTICS_CANADA_DISABILITY_STATS.next_review_date,
      is_stale: isStatsDataStale()
    },
    note:
      "Directional estimate only. Combines automated quality signals with Statistics Canada " +
      "disability prevalence data (CSD 2022). Does not represent measured user harm or " +
      "legal compliance status. FPS codes reference CAN/ASC EN 301 549:2024 clauses 4.2.1-4.2.10."
  };
}
