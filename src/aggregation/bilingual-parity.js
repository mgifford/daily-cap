function getPairKey(row) {
  if (row.inventory_id && row.paired_inventory_id) {
    return [row.inventory_id, row.paired_inventory_id].sort().join("|");
  }

  if (typeof row.inventory_id === "string") {
    const match = row.inventory_id.match(/^(.*)-(en|fr)$/);
    if (match) {
      return match[1];
    }
    return row.inventory_id;
  }

  if (typeof row.id === "string") {
    return row.id;
  }

  return `${row.service_name || "unknown"}:${row.language || "na"}`;
}

function toNumberOrNull(value) {
  return typeof value === "number" ? value : null;
}

function toFindingTotal(scanGov) {
  if (!scanGov || typeof scanGov !== "object") {
    return null;
  }

  const fields = ["critical", "serious", "moderate", "minor"];
  let total = 0;
  for (const field of fields) {
    const value = scanGov[field];
    if (typeof value === "number") {
      total += value;
    }
  }
  return total;
}

function roundOrNull(value) {
  return typeof value === "number" ? Number(value.toFixed(2)) : null;
}

function avgAbsoluteGap(rows, field) {
  if (rows.length === 0) {
    return null;
  }
  return roundOrNull(
    rows.reduce((sum, row) => sum + Math.abs(row[field]), 0) / rows.length
  );
}

export function computeBilingualParity(scanned) {
  const grouped = new Map();

  for (const row of scanned) {
    const key = getPairKey(row);
    const current =
      grouped.get(key) ||
      {
        pair_id: key,
        service_name: row.service_name || "Unknown service",
        en: null,
        fr: null
      };

    if (row.language === "en") {
      current.en = row;
    } else if (row.language === "fr") {
      current.fr = row;
    }

    grouped.set(key, current);
  }

  const pairs = [];
  const missing = [];
  let missingEnglish = 0;
  let missingFrench = 0;

  for (const pair of grouped.values()) {
    if (!pair.en || !pair.fr) {
      if (!pair.en) {
        missingEnglish += 1;
      }
      if (!pair.fr) {
        missingFrench += 1;
      }

      missing.push({
        pair_id: pair.pair_id,
        service_name: pair.service_name,
        has_en: Boolean(pair.en),
        has_fr: Boolean(pair.fr),
        url_en: pair.en?.canonical_url || null,
        url_fr: pair.fr?.canonical_url || null
      });
      continue;
    }

    const enA11y = toNumberOrNull(pair.en.lighthouse?.accessibility_score);
    const frA11y = toNumberOrNull(pair.fr.lighthouse?.accessibility_score);
    const enPerf = toNumberOrNull(pair.en.lighthouse?.performance_score);
    const frPerf = toNumberOrNull(pair.fr.lighthouse?.performance_score);
    const enFindings = toFindingTotal(pair.en.scangov);
    const frFindings = toFindingTotal(pair.fr.scangov);

    const accessibilityGap =
      enA11y === null || frA11y === null ? null : roundOrNull(enA11y - frA11y);
    const performanceGap =
      enPerf === null || frPerf === null ? null : roundOrNull(enPerf - frPerf);
    const findingGap =
      enFindings === null || frFindings === null
        ? null
        : roundOrNull(enFindings - frFindings);

    pairs.push({
      pair_id: pair.pair_id,
      service_name: pair.service_name,
      inventory_id_en: pair.en.inventory_id,
      inventory_id_fr: pair.fr.inventory_id,
      url_en: pair.en.canonical_url,
      url_fr: pair.fr.canonical_url,
      scan_status_en: pair.en.scan_status,
      scan_status_fr: pair.fr.scan_status,
      accessibility_gap: accessibilityGap,
      performance_gap: performanceGap,
      findings_gap: findingGap,
      abs_accessibility_gap:
        accessibilityGap === null ? null : roundOrNull(Math.abs(accessibilityGap)),
      abs_performance_gap:
        performanceGap === null ? null : roundOrNull(Math.abs(performanceGap))
    });
  }

  const completePairs = pairs.filter(
    (row) => row.scan_status_en === "success" && row.scan_status_fr === "success"
  );
  const a11yGapRows = completePairs.filter(
    (row) => typeof row.accessibility_gap === "number"
  );
  const perfGapRows = completePairs.filter(
    (row) => typeof row.performance_gap === "number"
  );

  const highGapPairs = a11yGapRows
    .filter((row) => Math.abs(row.accessibility_gap) >= 10)
    .sort((a, b) => Math.abs(b.accessibility_gap) - Math.abs(a.accessibility_gap));

  return {
    pairs,
    missing_counterparts: missing,
    summary: {
      candidate_pairs: grouped.size,
      paired_services: pairs.length,
      complete_success_pairs: completePairs.length,
      missing_counterpart: missing.length,
      missing_english: missingEnglish,
      missing_french: missingFrench,
      average_absolute_accessibility_gap: avgAbsoluteGap(a11yGapRows, "accessibility_gap"),
      average_absolute_performance_gap: avgAbsoluteGap(perfGapRows, "performance_gap"),
      high_accessibility_gap_pairs: highGapPairs.length
    },
    highlights: {
      largest_accessibility_gaps: highGapPairs.slice(0, 10)
    }
  };
}
