function rankScore(entry) {
  const traffic = Math.log10(Math.max(1, entry.page_load_count || 1));
  const weight = entry.priority_weight || 0.5;
  return Number((traffic * weight).toFixed(4));
}

export function buildInventory(seedEntries, options = {}) {
  const limit = options.limit || 50;

  const ranked = seedEntries
    .map((entry) => ({
      ...entry,
      rank_score: rankScore(entry),
      protected_flag: false
    }))
    .sort((a, b) => {
      if (b.rank_score !== a.rank_score) {
        return b.rank_score - a.rank_score;
      }

      return a.id.localeCompare(b.id);
    })
    .slice(0, limit);

  const scanTargets = [];
  for (const entry of ranked) {
    scanTargets.push({
      inventory_id: `${entry.id}-en`,
      language: "en",
      canonical_url: entry.url_en,
      paired_inventory_id: entry.url_fr ? `${entry.id}-fr` : null,
      ...entry
    });

    if (entry.url_fr) {
      scanTargets.push({
        inventory_id: `${entry.id}-fr`,
        language: "fr",
        canonical_url: entry.url_fr,
        paired_inventory_id: `${entry.id}-en`,
        ...entry
      });
    }
  }

  return scanTargets;
}
