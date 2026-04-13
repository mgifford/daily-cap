function round(value) {
  return Number(value.toFixed(2));
}

function normalizeInstitution(value) {
  return value || "Unknown institution";
}

function buildInstitutionSnapshot(report) {
  const grouped = new Map();

  for (const row of report.top_urls || []) {
    const institution = normalizeInstitution(row.institution);
    const current =
      grouped.get(institution) || {
        institution,
        run_date: report.run_date,
        scanned_urls: 0,
        total_page_load_count: 0,
        accessibility_scores: [],
        performance_scores: [],
        missing_french_count: 0,
        missing_statement_count: 0,
        high_gap_pair_count: 0,
        a11y_gap_abs_sum: 0,
        a11y_gap_count: 0,
        perf_gap_abs_sum: 0,
        perf_gap_count: 0
      };

    current.scanned_urls += 1;
    current.total_page_load_count += row.page_load_count || 0;
    if (typeof row.lighthouse?.accessibility_score === "number") {
      current.accessibility_scores.push(row.lighthouse.accessibility_score);
    }
    if (typeof row.lighthouse?.performance_score === "number") {
      current.performance_scores.push(row.lighthouse.performance_score);
    }
    grouped.set(institution, current);
  }

  for (const row of report.bilingual_parity?.missing_counterparts || []) {
    if (row.has_fr) {
      continue;
    }
    const institution = normalizeInstitution(row.institution);
    const current = grouped.get(institution);
    if (current) {
      current.missing_french_count += 1;
    }
  }

  for (const row of report.accessibility_statements?.missing_statement_examples || []) {
    const institution = normalizeInstitution(row.institution);
    const current = grouped.get(institution);
    if (current) {
      current.missing_statement_count += 1;
    }
  }

  for (const row of report.bilingual_parity?.pairs || []) {
    const institution = normalizeInstitution(row.institution);
    const current = grouped.get(institution);
    if (!current) {
      continue;
    }
    if ((row.abs_accessibility_gap || 0) >= 10) {
      current.high_gap_pair_count += 1;
    }
    if (typeof row.abs_accessibility_gap === "number") {
      current.a11y_gap_abs_sum += row.abs_accessibility_gap;
      current.a11y_gap_count += 1;
    }
    if (typeof row.abs_performance_gap === "number") {
      current.perf_gap_abs_sum += row.abs_performance_gap;
      current.perf_gap_count += 1;
    }
  }

  return [...grouped.values()].map((entry) => ({
    institution: entry.institution,
    run_date: entry.run_date,
    scanned_urls: entry.scanned_urls,
    total_page_load_count: entry.total_page_load_count,
    mean_accessibility_score: entry.accessibility_scores.length
      ? round(entry.accessibility_scores.reduce((sum, value) => sum + value, 0) / entry.accessibility_scores.length)
      : null,
    mean_performance_score: entry.performance_scores.length
      ? round(entry.performance_scores.reduce((sum, value) => sum + value, 0) / entry.performance_scores.length)
      : null,
    missing_french_count: entry.missing_french_count,
    missing_statement_count: entry.missing_statement_count,
    high_gap_pair_count: entry.high_gap_pair_count,
    mean_abs_accessibility_gap:
      entry.a11y_gap_count > 0 ? round(entry.a11y_gap_abs_sum / entry.a11y_gap_count) : null,
    mean_abs_performance_gap:
      entry.perf_gap_count > 0 ? round(entry.perf_gap_abs_sum / entry.perf_gap_count) : null
  }));
}

export function slugifyInstitution(value) {
  return String(normalizeInstitution(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function summarizeInstitutionTrends(currentReport, historicalReports = []) {
  const reports = [...historicalReports, currentReport]
    .filter((report) => report?.run_date)
    .sort((a, b) => a.run_date.localeCompare(b.run_date));

  const byInstitution = new Map();

  for (const report of reports) {
    for (const snapshot of buildInstitutionSnapshot(report)) {
      const bucket = byInstitution.get(snapshot.institution) || [];
      bucket.push(snapshot);
      byInstitution.set(snapshot.institution, bucket);
    }
  }

  const institutions = [...byInstitution.entries()]
    .map(([institution, points]) => {
      points.sort((a, b) => a.run_date.localeCompare(b.run_date));
      const latest = points[points.length - 1] || null;

      // Parity trend: compare mean_abs_accessibility_gap of earliest vs latest point
      // that has gap data. Positive delta = worsening (gap grew); negative = improving.
      const gapPoints = points.filter(
        (p) => typeof p.mean_abs_accessibility_gap === "number"
      );
      let parityTrend = "insufficient_data";
      let parityGapDelta = null;
      if (gapPoints.length >= 2) {
        const earliest = gapPoints[0].mean_abs_accessibility_gap;
        const latestGap = gapPoints[gapPoints.length - 1].mean_abs_accessibility_gap;
        parityGapDelta = round(latestGap - earliest);
        if (parityGapDelta > 2) {
          parityTrend = "worsening";
        } else if (parityGapDelta < -2) {
          parityTrend = "improving";
        } else {
          parityTrend = "stable";
        }
      }

      return {
        institution,
        slug: slugifyInstitution(institution),
        days_tracked: points.length,
        parity_trend: parityTrend,
        parity_gap_delta: parityGapDelta,
        latest,
        points
      };
    })
    .sort(
      (a, b) =>
        (b.latest?.total_page_load_count || 0) - (a.latest?.total_page_load_count || 0) ||
        a.institution.localeCompare(b.institution)
    );

  return {
    summary: {
      institutions: institutions.length,
      start_date: reports[0]?.run_date || null,
      end_date: reports[reports.length - 1]?.run_date || null
    },
    institutions
  };
}