/**
 * Axe Top Issues Aggregation
 *
 * Identifies the most frequently occurring axe accessibility violations
 * across all scanned pages, weighted by severity and impact.
 */

export function computeTopAxeIssues(scanned, options = {}) {
  const limit = options.limit || 10;

  // Group violations by ID and track occurrences
  const issueMap = new Map();

  for (const row of scanned) {
    if (row.scan_status !== "success" || !row.scangov) {
      continue;
    }

    // scangov structure: { critical: N, serious: N, moderate: N, minor: N }
    const { critical = 0, serious = 0, moderate = 0, minor = 0 } = row.scangov;
    const total = critical + serious + moderate + minor;

    if (total === 0) {
      continue;
    }

    // For now, we aggregate by severity level since we don't have detailed axe rule IDs
    // In future, if axe-core results include rule metadata, we can break this down further
    const severities = [
      { level: "critical", count: critical, weight: 4 },
      { level: "serious", count: serious, weight: 3 },
      { level: "moderate", count: moderate, weight: 2 },
      { level: "minor", count: minor, weight: 1 }
    ];

    for (const { level, count } of severities) {
      if (count > 0) {
        const key = level;
        const entry = issueMap.get(key) || {
          severity: level,
          occurrence_count: 0,
          page_count: 0,
          pages: []
        };

        entry.occurrence_count += count;
        entry.page_count += 1;
        entry.pages.push({
          canonical_url: row.canonical_url,
          language: row.language,
          service_name: row.service_name,
          count
        });

        issueMap.set(key, entry);
      }
    }
  }

  // Sort by occurrence count and prepare output
  const issues = Array.from(issueMap.values())
    .sort((a, b) => b.occurrence_count - a.occurrence_count)
    .slice(0, limit)
    .map((issue) => ({
      severity: issue.severity,
      total_occurrences: issue.occurrence_count,
      affected_pages: issue.page_count,
      average_per_page: Math.round(issue.occurrence_count / issue.page_count * 10) / 10,
      sample_pages: issue.pages
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((page) => ({
          canonical_url: page.canonical_url,
          language: page.language,
          service_name: page.service_name,
          count: page.count
        }))
    }));

  const scannedCount = scanned.filter((r) => r.scan_status === "success").length;

  return {
    summary: {
      scanned_urls: scannedCount,
      urls_with_violations: issueMap.get("critical")?.page_count || 0 +
        issueMap.get("serious")?.page_count || 0 +
        issueMap.get("moderate")?.page_count || 0 +
        issueMap.get("minor")?.page_count || 0,
      total_violations: Array.from(issueMap.values()).reduce((sum, issue) => sum + issue.occurrence_count, 0)
    },
    top_issues: issues
  };
}
