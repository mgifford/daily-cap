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
  const urlByCanonical = new Map(scanned.map((row) => [row.canonical_url, row]));

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
        institution: pair.en?.institution || pair.fr?.institution || null,
        has_en: Boolean(pair.en),
        has_fr: Boolean(pair.fr),
        url_en: pair.en?.canonical_url || null,
        url_fr: pair.fr?.canonical_url || null,
        tier: pair.en?.tier || pair.fr?.tier || null,
        service_pattern: pair.en?.service_pattern || pair.fr?.service_pattern || null,
        page_load_count: Math.max(pair.en?.page_load_count || 0, pair.fr?.page_load_count || 0)
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
      pair_source: "inventory",
      service_name: pair.service_name,
      inventory_id_en: pair.en.inventory_id,
      inventory_id_fr: pair.fr.inventory_id,
      url_en: pair.en.canonical_url,
      url_fr: pair.fr.canonical_url,
      scan_status_en: pair.en.scan_status,
      scan_status_fr: pair.fr.scan_status,
      institution: pair.en.institution || pair.fr.institution || null,
      tier: pair.en.tier || pair.fr.tier || null,
      service_pattern: pair.en.service_pattern || pair.fr.service_pattern || null,
      page_load_count: Math.max(pair.en.page_load_count || 0, pair.fr.page_load_count || 0),
      accessibility_score_en: enA11y,
      accessibility_score_fr: frA11y,
      performance_score_en: enPerf,
      performance_score_fr: frPerf,
      findings_total_en: enFindings,
      findings_total_fr: frFindings,
      accessibility_gap: accessibilityGap,
      performance_gap: performanceGap,
      findings_gap: findingGap,
      abs_accessibility_gap:
        accessibilityGap === null ? null : roundOrNull(Math.abs(accessibilityGap)),
      abs_performance_gap:
        performanceGap === null ? null : roundOrNull(Math.abs(performanceGap))
    });
  }

  // Second pass: try to pair "missing" entries using in-page language switcher links.
  // This reduces false-positive "missing French" counts for pages with header language toggles.
  const switcherUsedUrls = new Set();
  const switcherResolvedPairIds = new Set();
  let pairedFromSwitcher = 0;

  for (const entry of missing) {
    const existingUrl = entry.url_en || entry.url_fr;
    if (!existingUrl || switcherUsedUrls.has(existingUrl)) {
      continue;
    }

    const existingSide = urlByCanonical.get(existingUrl);
    if (!existingSide) {
      continue;
    }

    const switcherHref = existingSide.accessibility_statement?.language_switcher_url;
    if (!switcherHref) {
      continue;
    }

    let switcherUrl;
    try {
      switcherUrl = new URL(switcherHref, existingSide.canonical_url).href;
    } catch {
      continue;
    }

    if (switcherUsedUrls.has(switcherUrl)) {
      continue;
    }

    const otherSide = urlByCanonical.get(switcherUrl);
    if (!otherSide || otherSide.language === existingSide.language) {
      continue;
    }

    const enSide = existingSide.language === "en" ? existingSide : otherSide;
    const frSide = existingSide.language === "fr" ? existingSide : otherSide;

    switcherUsedUrls.add(existingUrl);
    switcherUsedUrls.add(switcherUrl);
    switcherResolvedPairIds.add(entry.pair_id);
    pairedFromSwitcher++;

    const enA11y = toNumberOrNull(enSide.lighthouse?.accessibility_score);
    const frA11y = toNumberOrNull(frSide.lighthouse?.accessibility_score);
    const enPerf = toNumberOrNull(enSide.lighthouse?.performance_score);
    const frPerf = toNumberOrNull(frSide.lighthouse?.performance_score);
    const enFindings = toFindingTotal(enSide.scangov);
    const frFindings = toFindingTotal(frSide.scangov);
    const accessibilityGap =
      enA11y === null || frA11y === null ? null : roundOrNull(enA11y - frA11y);
    const performanceGap =
      enPerf === null || frPerf === null ? null : roundOrNull(enPerf - frPerf);
    const findingGap =
      enFindings === null || frFindings === null
        ? null
        : roundOrNull(enFindings - frFindings);

    pairs.push({
      pair_id: entry.pair_id,
      pair_source: "switcher",
      service_name: entry.service_name,
      inventory_id_en: enSide.inventory_id,
      inventory_id_fr: frSide.inventory_id,
      url_en: enSide.canonical_url,
      url_fr: frSide.canonical_url,
      scan_status_en: enSide.scan_status,
      scan_status_fr: frSide.scan_status,
      institution: enSide.institution || frSide.institution || null,
      tier: enSide.tier || frSide.tier || null,
      service_pattern: enSide.service_pattern || frSide.service_pattern || null,
      page_load_count: Math.max(enSide.page_load_count || 0, frSide.page_load_count || 0),
      accessibility_score_en: enA11y,
      accessibility_score_fr: frA11y,
      performance_score_en: enPerf,
      performance_score_fr: frPerf,
      findings_total_en: enFindings,
      findings_total_fr: frFindings,
      accessibility_gap: accessibilityGap,
      performance_gap: performanceGap,
      findings_gap: findingGap,
      abs_accessibility_gap:
        accessibilityGap === null ? null : roundOrNull(Math.abs(accessibilityGap)),
      abs_performance_gap:
        performanceGap === null ? null : roundOrNull(Math.abs(performanceGap))
    });
  }

  // Remove entries resolved via switcher OR whose URL was absorbed into a switcher pair.
  const resolvedMissing = missing.filter(
    (entry) =>
      !switcherResolvedPairIds.has(entry.pair_id) &&
      !(entry.url_en && switcherUsedUrls.has(entry.url_en)) &&
      !(entry.url_fr && switcherUsedUrls.has(entry.url_fr))
  );

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

  // Per-institution bilingual gap leaderboard.
  // Group complete pairs by institution and compute mean gap scores.
  const institutionGapMap = new Map();
  for (const row of a11yGapRows) {
    const inst = row.institution || "Unknown institution";
    const entry = institutionGapMap.get(inst) || {
      institution: inst,
      pair_count: 0,
      high_gap_count: 0,
      a11y_gap_sum: 0,
      perf_gap_sum: 0,
      perf_gap_count: 0
    };
    entry.pair_count += 1;
    entry.a11y_gap_sum += Math.abs(row.accessibility_gap);
    if (Math.abs(row.accessibility_gap) >= 10) {
      entry.high_gap_count += 1;
    }
    if (typeof row.performance_gap === "number") {
      entry.perf_gap_sum += Math.abs(row.performance_gap);
      entry.perf_gap_count += 1;
    }
    institutionGapMap.set(inst, entry);
  }

  const byInstitution = [...institutionGapMap.values()]
    .map((entry) => ({
      institution: entry.institution,
      pair_count: entry.pair_count,
      high_gap_pair_count: entry.high_gap_count,
      mean_abs_accessibility_gap: roundOrNull(entry.a11y_gap_sum / entry.pair_count),
      mean_abs_performance_gap:
        entry.perf_gap_count > 0
          ? roundOrNull(entry.perf_gap_sum / entry.perf_gap_count)
          : null
    }))
    .sort(
      (a, b) =>
        (b.mean_abs_accessibility_gap ?? 0) - (a.mean_abs_accessibility_gap ?? 0) ||
        a.institution.localeCompare(b.institution)
    );

  return {
    pairs,
    missing_counterparts: resolvedMissing,
    summary: {
      candidate_pairs: grouped.size,
      paired_services: pairs.length,
      complete_success_pairs: completePairs.length,
      missing_counterpart: resolvedMissing.length,
      missing_english: resolvedMissing.filter((m) => !m.has_en).length,
      missing_french: resolvedMissing.filter((m) => !m.has_fr).length,
      paired_from_switcher: pairedFromSwitcher,
      average_absolute_accessibility_gap: avgAbsoluteGap(a11yGapRows, "accessibility_gap"),
      average_absolute_performance_gap: avgAbsoluteGap(perfGapRows, "performance_gap"),
      high_accessibility_gap_pairs: highGapPairs.length
    },
    highlights: {
      largest_accessibility_gaps: highGapPairs.slice(0, 10)
    },
    by_institution: byInstitution
  };
}
