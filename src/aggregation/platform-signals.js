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

function percent(part, total) {
  if (!total) {
    return null;
  }
  return Number(((part / total) * 100).toFixed(2));
}

function groupCmsUrls(rows) {
  const groups = new Map();

  for (const row of rows) {
    const cms = row.cms || "unknown";
    const bucket = groups.get(cms) || [];
    bucket.push({
      service_name: row.service_name,
      language: row.language,
      canonical_url: row.canonical_url
    });
    groups.set(cms, bucket);
  }

  return [...groups.entries()]
    .map(([cms, pages]) => ({
      cms,
      count: pages.length,
      pages: pages.slice(0, 20)
    }))
    .sort((a, b) => b.count - a.count || a.cms.localeCompare(b.cms));
}

export function summarizePlatformSignals(scanned) {
  const rows = scanned.map((row) => ({
    inventory_id: row.inventory_id,
    service_name: row.service_name,
    language: row.language,
    canonical_url: row.canonical_url,
    cms: row.platform_fingerprint?.cms || "unknown",
    design_system: row.platform_fingerprint?.design_system || "unknown",
    hosting_hint: row.platform_fingerprint?.hosting_hint || "unknown",
    confidence: row.platform_fingerprint?.confidence ?? null
  }));

  const total = rows.length;
  const cmsCounts = countBy(rows, (row) => row.cms);
  const dsCounts = countBy(rows, (row) => row.design_system);
  const hostCounts = countBy(rows, (row) => row.hosting_hint);

  const knownCms = rows.filter((row) => row.cms !== "unknown").length;
  const knownDs = rows.filter((row) => row.design_system !== "unknown").length;

  const byLanguage = {
    en: rows.filter((row) => row.language === "en"),
    fr: rows.filter((row) => row.language === "fr")
  };

  return {
    summary: {
      scanned_urls: total,
      known_cms_count: knownCms,
      known_cms_percent: percent(knownCms, total),
      known_design_system_count: knownDs,
      known_design_system_percent: percent(knownDs, total),
      distinct_cms: cmsCounts.length,
      distinct_design_systems: dsCounts.length,
      distinct_hosting_hints: hostCounts.length
    },
    distributions: {
      cms: cmsCounts,
      design_systems: dsCounts,
      hosting_hints: hostCounts
    },
    cms_url_examples: groupCmsUrls(rows),
    by_language: {
      en: {
        total: byLanguage.en.length,
        cms: countBy(byLanguage.en, (row) => row.cms),
        design_systems: countBy(byLanguage.en, (row) => row.design_system)
      },
      fr: {
        total: byLanguage.fr.length,
        cms: countBy(byLanguage.fr, (row) => row.cms),
        design_systems: countBy(byLanguage.fr, (row) => row.design_system)
      }
    },
    samples: rows.slice(0, 25)
  };
}
