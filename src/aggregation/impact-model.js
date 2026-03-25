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

export function computeDirectionalImpact(scanned) {
  const rows = scanned.map((row) => {
    const traffic = row.page_load_count || 0;
    const a11y = row.lighthouse?.accessibility_score ?? null;
    const statementDetected = row.accessibility_statement?.statement_detected === true;

    const sev = severityWeight(a11y, row.scangov);
    const statementMultiplier = statementDetected ? 1 : 1.15;

    // Directional estimate only: higher when traffic is high and automated signals are poor.
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
      directional_affected_load_estimate: affectedLoadEstimate
    };
  });

  const totalLoad = rows.reduce((sum, row) => sum + row.page_load_count, 0);
  const totalAffectedDirectional = rows.reduce(
    (sum, row) => sum + row.directional_affected_load_estimate,
    0
  );

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
    by_tier: byTier,
    by_language: byLanguage,
    top_directional_impact_urls: topImpacted,
    note:
      "Directional estimate only. This combines automated quality signals with traffic volume and does not represent measured user harm or legal compliance status."
  };
}
