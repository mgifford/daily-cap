function safePercent(part, total) {
  if (!total) {
    return null;
  }
  return Number(((part / total) * 100).toFixed(2));
}

function toBool(value) {
  return value === true;
}

function groupedByPair(scanned) {
  const groups = new Map();

  for (const row of scanned) {
    const key = row.paired_inventory_id
      ? [row.inventory_id, row.paired_inventory_id].sort().join("|")
      : row.inventory_id;

    const current =
      groups.get(key) || {
        pair_id: key,
        service_name: row.service_name,
        en: null,
        fr: null
      };

    if (row.language === "en") {
      current.en = row;
    } else if (row.language === "fr") {
      current.fr = row;
    }

    groups.set(key, current);
  }

  return groups;
}

export function summarizeAccessibilityStatements(scanned) {
  const checks = scanned.map((row) => ({
    inventory_id: row.inventory_id,
    service_name: row.service_name,
    institution: row.institution || null,
    language: row.language,
    canonical_url: row.canonical_url,
    source: row.source,
    tier: row.tier,
    page_load_count: row.page_load_count || 0,
    service_pattern: row.service_pattern || null,
    statement_detected: toBool(row.accessibility_statement?.statement_detected),
    statement_link_text: row.accessibility_statement?.statement_link_text || null,
    statement_link_url: row.accessibility_statement?.statement_link_url || null,
    has_contact_info: toBool(row.accessibility_statement?.has_contact_info),
    mentions_compliance_status: toBool(
      row.accessibility_statement?.mentions_compliance_status
    ),
    mentions_alternative_support: toBool(
      row.accessibility_statement?.mentions_alternative_support
    ),
    has_freshness_marker: toBool(row.accessibility_statement?.has_freshness_marker)
  }));

  const total = checks.length;
  const detected = checks.filter((row) => row.statement_detected);

  const withContactInfo = detected.filter((row) => row.has_contact_info).length;
  const withComplianceStatus = detected.filter(
    (row) => row.mentions_compliance_status
  ).length;
  const withAlternativeSupport = detected.filter(
    (row) => row.mentions_alternative_support
  ).length;
  const withFreshnessMarker = detected.filter(
    (row) => row.has_freshness_marker
  ).length;

  const byLanguage = {
    en: {
      total: checks.filter((row) => row.language === "en").length,
      detected: checks.filter(
        (row) => row.language === "en" && row.statement_detected
      ).length
    },
    fr: {
      total: checks.filter((row) => row.language === "fr").length,
      detected: checks.filter(
        (row) => row.language === "fr" && row.statement_detected
      ).length
    }
  };

  const pairGroups = groupedByPair(scanned);
  let fullyPaired = 0;
  let bothDetected = 0;
  let parityMismatch = 0;

  for (const pair of pairGroups.values()) {
    if (!pair.en || !pair.fr) {
      continue;
    }

    fullyPaired += 1;
    const enDetected = toBool(pair.en.accessibility_statement?.statement_detected);
    const frDetected = toBool(pair.fr.accessibility_statement?.statement_detected);

    if (enDetected && frDetected) {
      bothDetected += 1;
    }
    if (enDetected !== frDetected) {
      parityMismatch += 1;
    }
  }

  const gaps = checks
    .filter((row) => !row.statement_detected)
    .map((row) => ({
      inventory_id: row.inventory_id,
      service_name: row.service_name,
      institution: row.institution,
      language: row.language,
      canonical_url: row.canonical_url,
      tier: row.tier,
      source: row.source,
      page_load_count: row.page_load_count,
      service_pattern: row.service_pattern
    }));

  return {
    summary: {
      scanned_urls: total,
      statements_detected: detected.length,
      statement_coverage_percent: safePercent(detected.length, total),
      with_contact_info: withContactInfo,
      with_contact_info_percent: safePercent(withContactInfo, detected.length),
      with_compliance_status: withComplianceStatus,
      with_compliance_status_percent: safePercent(
        withComplianceStatus,
        detected.length
      ),
      with_alternative_support: withAlternativeSupport,
      with_alternative_support_percent: safePercent(
        withAlternativeSupport,
        detected.length
      ),
      with_freshness_marker: withFreshnessMarker,
      with_freshness_marker_percent: safePercent(withFreshnessMarker, detected.length),
      bilingual_pairs_total: fullyPaired,
      bilingual_pairs_both_detected: bothDetected,
      bilingual_pairs_both_detected_percent: safePercent(bothDetected, fullyPaired),
      bilingual_parity_mismatch_pairs: parityMismatch
    },
    by_language: {
      en: {
        ...byLanguage.en,
        coverage_percent: safePercent(byLanguage.en.detected, byLanguage.en.total)
      },
      fr: {
        ...byLanguage.fr,
        coverage_percent: safePercent(byLanguage.fr.detected, byLanguage.fr.total)
      }
    },
    missing_statement_examples: gaps,
    checks
  };
}
