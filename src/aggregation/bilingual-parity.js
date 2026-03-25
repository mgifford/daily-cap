export function computeBilingualParity(scanned) {
  const grouped = new Map();

  for (const row of scanned) {
    const baseId = row.id;
    const current = grouped.get(baseId) || { en: null, fr: null, id: baseId };
    current[row.language] = row;
    grouped.set(baseId, current);
  }

  const pairs = [];
  let missingCounterpart = 0;
  for (const pair of grouped.values()) {
    if (!pair.en || !pair.fr) {
      missingCounterpart += 1;
      continue;
    }

    const enScore = pair.en.lighthouse?.accessibility_score;
    const frScore = pair.fr.lighthouse?.accessibility_score;
    if (typeof enScore === "number" && typeof frScore === "number") {
      pairs.push({
        id: pair.id,
        url_en: pair.en.canonical_url,
        url_fr: pair.fr.canonical_url,
        accessibility_gap: Number((enScore - frScore).toFixed(2))
      });
    }
  }

  const avgGap =
    pairs.length === 0
      ? null
      : Number((pairs.reduce((sum, row) => sum + Math.abs(row.accessibility_gap), 0) / pairs.length).toFixed(2));

  return {
    pairs,
    summary: {
      paired_services: pairs.length,
      missing_counterpart: missingCounterpart,
      average_absolute_accessibility_gap: avgGap
    }
  };
}
