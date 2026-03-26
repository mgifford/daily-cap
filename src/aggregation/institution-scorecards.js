function round(value) {
  return Number(value.toFixed(2));
}

function normalizeInstitution(value) {
  return value || "Unknown institution";
}

export function summarizeInstitutionScorecards(topUrls, priorityIssues) {
  const grouped = new Map();

  for (const row of topUrls) {
    const institution = normalizeInstitution(row.institution);
    const current =
      grouped.get(institution) || {
        institution,
        scanned_urls: 0,
        total_page_load_count: 0,
        accessibility_scores: [],
        performance_scores: []
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

  const issueGroups = new Map();
  for (const issue of priorityIssues.all_issues || []) {
    const institution = normalizeInstitution(issue.institution);
    const bucket = issueGroups.get(institution) || [];
    bucket.push(issue);
    issueGroups.set(institution, bucket);
  }

  const rows = [...grouped.values()].map((entry) => {
    const issues = issueGroups.get(entry.institution) || [];
    const byType = issues.reduce((acc, issue) => {
      acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1;
      return acc;
    }, {});
    const topIssue = issues.slice().sort((a, b) => b.priority_score - a.priority_score)[0] || null;

    return {
      institution: entry.institution,
      scanned_urls: entry.scanned_urls,
      total_page_load_count: entry.total_page_load_count,
      mean_accessibility_score: entry.accessibility_scores.length
        ? round(entry.accessibility_scores.reduce((sum, value) => sum + value, 0) / entry.accessibility_scores.length)
        : null,
      mean_performance_score: entry.performance_scores.length
        ? round(entry.performance_scores.reduce((sum, value) => sum + value, 0) / entry.performance_scores.length)
        : null,
      priority_issue_count: issues.length,
      recurring_issue_count: issues.filter((issue) => issue.recurrence_days >= 2).length,
      missing_french_count: byType["missing-french-counterpart"] || 0,
      missing_statement_count: byType["missing-accessibility-statement"] || 0,
      high_gap_pair_count: byType["high-bilingual-accessibility-gap"] || 0,
      high_impact_issue_count: byType["high-impact-low-accessibility"] || 0,
      top_priority_issue_score: topIssue?.priority_score || null,
      top_priority_issue: topIssue?.issue_type || null
    };
  });

  rows.sort(
    (a, b) =>
      (b.top_priority_issue_score || 0) - (a.top_priority_issue_score || 0) ||
      b.priority_issue_count - a.priority_issue_count ||
      b.total_page_load_count - a.total_page_load_count ||
      a.institution.localeCompare(b.institution)
  );

  return {
    summary: {
      institutions: rows.length,
      institutions_with_priority_issues: rows.filter((row) => row.priority_issue_count > 0).length
    },
    scorecards: rows.slice(0, 25),
    all_scorecards: rows
  };
}