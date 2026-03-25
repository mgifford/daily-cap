function percent(part, total) {
  if (!total) {
    return null;
  }

  return Number(((part / total) * 100).toFixed(2));
}

function countBy(items, keyFn) {
  const counts = new Map();

  for (const item of items) {
    const key = keyFn(item) || "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function parseSourceLineage(source) {
  return String(source || "unknown")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .sort();
}

function sourceConfidence(label) {
  switch (label) {
    case "curated":
      return 1;
    case "top-task":
      return 0.9;
    case "recent":
      return 0.8;
    case "discovered":
      return 0.55;
    default:
      return 0.3;
  }
}

function confidenceLabel(score) {
  if (score >= 0.85) {
    return "high";
  }
  if (score >= 0.65) {
    return "medium";
  }
  return "low";
}

export function summarizeCohortQuality(scanned) {
  const rows = scanned.map((row) => {
    const lineage = parseSourceLineage(row.source);
    const confidenceScore = Number(
      (
        lineage.reduce((sum, label) => sum + sourceConfidence(label), 0) /
        Math.max(1, lineage.length)
      ).toFixed(2)
    );

    return {
      inventory_id: row.inventory_id,
      service_name: row.service_name,
      language: row.language,
      canonical_url: row.canonical_url,
      source_lineage: lineage,
      source_count: lineage.length,
      source_confidence_score: confidenceScore,
      source_confidence_label: confidenceLabel(confidenceScore),
      freshness_signal: lineage.includes("recent") ? "recent-activity" : "not-recent",
      page_load_count: row.page_load_count || 0,
      service_pattern: row.service_pattern || "unknown",
      service_category: row.service_category || "unknown",
      institution: row.institution || "unknown"
    };
  });

  const total = rows.length;
  const discoveredOnly = rows.filter(
    (row) => row.source_count === 1 && row.source_lineage.includes("discovered")
  ).length;
  const multiSource = rows.filter((row) => row.source_count > 1).length;
  const unknownSource = rows.filter((row) => row.source_lineage.includes("unknown")).length;
  const recentSignal = rows.filter((row) => row.freshness_signal === "recent-activity").length;
  const withTraffic = rows.filter((row) => row.page_load_count > 0).length;
  const unknownInstitution = rows.filter((row) => row.institution === "unknown").length;

  const averageSourcesPerUrl = Number(
    (
      rows.reduce((sum, row) => sum + row.source_count, 0) /
      Math.max(1, rows.length)
    ).toFixed(2)
  );

  const averageSourceConfidence = Number(
    (
      rows.reduce((sum, row) => sum + row.source_confidence_score, 0) /
      Math.max(1, rows.length)
    ).toFixed(2)
  );

  const sourceDistribution = countBy(rows, (row) => row.source_lineage.join(","));
  const languageDistribution = countBy(rows, (row) => row.language);
  const patternDistribution = countBy(rows, (row) => row.service_pattern);
  const categoryDistribution = countBy(rows, (row) => row.service_category);

  const warnings = [];
  if (percent(discoveredOnly, total) > 55) {
    warnings.push("discovered-only share is above 55%; consider broadening high-confidence sources");
  }
  if (percent(unknownInstitution, total) > 20) {
    warnings.push("institution coverage has more than 20% unknown values");
  }

  return {
    summary: {
      scanned_urls: total,
      unique_services: new Set(rows.map((row) => row.service_name)).size,
      multi_source_urls: multiSource,
      multi_source_percent: percent(multiSource, total),
      average_sources_per_url: averageSourcesPerUrl,
      source_confidence_average: averageSourceConfidence,
      discovered_only_urls: discoveredOnly,
      discovered_only_percent: percent(discoveredOnly, total),
      unknown_source_urls: unknownSource,
      unknown_source_percent: percent(unknownSource, total),
      with_recent_signal_urls: recentSignal,
      with_recent_signal_percent: percent(recentSignal, total),
      with_traffic_data_urls: withTraffic,
      with_traffic_data_percent: percent(withTraffic, total),
      unknown_institution_urls: unknownInstitution,
      unknown_institution_percent: percent(unknownInstitution, total)
    },
    distributions: {
      source_lineage: sourceDistribution,
      language: languageDistribution,
      service_pattern: patternDistribution,
      service_category: categoryDistribution
    },
    warnings,
    provenance_examples: rows.slice(0, 25)
  };
}