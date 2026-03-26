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
        high_gap_pair_count: 0
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
    if ((row.abs_accessibility_gap || 0) < 10) {
      continue;
    }
    const institution = normalizeInstitution(row.institution);
    const current = grouped.get(institution);
    if (current) {
      current.high_gap_pair_count += 1;
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
    high_gap_pair_count: entry.high_gap_pair_count
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

      return {
        institution,
        slug: slugifyInstitution(institution),
        days_tracked: points.length,
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