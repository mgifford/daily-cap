function round(value) {
  return Number(value.toFixed(2));
}

function normalizeInstitution(value) {
  return value || "Unknown";
}

function reachScore(pageLoadCount) {
  const load = pageLoadCount || 0;
  if (load >= 1000000) return 30;
  if (load >= 100000) return 24;
  if (load >= 10000) return 16;
  if (load >= 1000) return 8;
  return 3;
}

function tierBonus(tier) {
  if (tier === "tier-1") return 10;
  if (tier === "tier-2") return 5;
  return 0;
}

function servicePatternBonus(pattern) {
  return ["sign-in", "application", "payment", "status", "dashboard"].includes(pattern)
    ? 8
    : 0;
}

function issueAction(type) {
  switch (type) {
    case "missing-french-counterpart":
      return "Add or link the French counterpart for this service entry point.";
    case "missing-english-counterpart":
      return "Add or link the English counterpart for this service entry point.";
    case "high-bilingual-accessibility-gap":
      return "Review EN and FR implementations together and align accessibility fixes across both variants.";
    case "missing-accessibility-statement":
      return "Publish an accessibility statement with contact, support path, and freshness details.";
    case "high-impact-low-accessibility":
      return "Prioritize accessibility remediation on this high-demand service entry point.";
    default:
      return "Review and remediate this issue.";
  }
}

function buildIssue(type, payload) {
  const severityBase = payload.severity_base || 0;
  const recurrenceBonus = Math.max(0, (payload.recurrence_days || 1) - 1) * 6;
  const priorityScore = round(
    severityBase +
      reachScore(payload.page_load_count) +
      tierBonus(payload.tier) +
      servicePatternBonus(payload.service_pattern) +
      recurrenceBonus
  );

  return {
    issue_key: payload.issue_key,
    issue_type: type,
    service_name: payload.service_name,
    institution: normalizeInstitution(payload.institution),
    language: payload.language || null,
    pair_id: payload.pair_id || null,
    inventory_id: payload.inventory_id || null,
    canonical_url: payload.canonical_url || null,
    page_load_count: payload.page_load_count || 0,
    tier: payload.tier || null,
    service_pattern: payload.service_pattern || null,
    severity_score: round(severityBase),
    recurrence_days: payload.recurrence_days || 1,
    first_seen: payload.first_seen || null,
    last_seen: payload.last_seen || null,
    priority_score: priorityScore,
    issue_detail: payload.issue_detail,
    recommended_action: issueAction(type)
  };
}

function extractIssueKeys(report) {
  const keys = new Set();
  const missing = report.bilingual_parity?.missing_counterparts || [];
  for (const row of missing) {
    keys.add(`${row.has_fr ? "missing-english-counterpart" : "missing-french-counterpart"}:${row.pair_id}`);
  }

  const gapPairs = report.bilingual_parity?.pairs || [];
  for (const row of gapPairs) {
    if ((row.abs_accessibility_gap || 0) >= 10) {
      keys.add(`high-bilingual-accessibility-gap:${row.pair_id}`);
    }
  }

  const missingStatements = report.accessibility_statements?.missing_statement_examples || [];
  for (const row of missingStatements) {
    keys.add(`missing-accessibility-statement:${row.inventory_id}`);
  }

  const topUrls = report.top_urls || [];
  for (const row of topUrls) {
    const a11y = row.lighthouse?.accessibility_score;
    if (row.scan_status === "success" && typeof a11y === "number" && a11y <= 75 && (row.page_load_count || 0) >= 10000) {
      keys.add(`high-impact-low-accessibility:${row.inventory_id}`);
    }
  }

  return keys;
}

function buildRecurrenceMap(currentReport, historicalReports) {
  const occurrences = new Map();
  const reports = [...historicalReports, currentReport].filter((report) => report?.run_date);

  for (const report of reports) {
    const keys = extractIssueKeys(report);
    for (const key of keys) {
      const bucket = occurrences.get(key) || [];
      bucket.push(report.run_date);
      occurrences.set(key, bucket);
    }
  }

  return occurrences;
}

export function summarizePriorityIssues(currentReport, historicalReports = []) {
  const recurrenceMap = buildRecurrenceMap(currentReport, historicalReports);
  const issues = [];

  for (const row of currentReport.bilingual_parity?.missing_counterparts || []) {
    const issueType = row.has_fr ? "missing-english-counterpart" : "missing-french-counterpart";
    const issueKey = `${issueType}:${row.pair_id}`;
    const dates = recurrenceMap.get(issueKey) || [currentReport.run_date];
    issues.push(
      buildIssue(issueType, {
        issue_key: issueKey,
        pair_id: row.pair_id,
        service_name: row.service_name,
        institution: row.institution,
        canonical_url: row.url_en || row.url_fr,
        page_load_count: row.page_load_count,
        tier: row.tier,
        service_pattern: row.service_pattern,
        severity_base: issueType === "missing-french-counterpart" ? 72 : 68,
        recurrence_days: dates.length,
        first_seen: dates[0],
        last_seen: dates[dates.length - 1],
        issue_detail: issueType === "missing-french-counterpart" ? "French counterpart missing" : "English counterpart missing"
      })
    );
  }

  for (const row of currentReport.bilingual_parity?.pairs || []) {
    if ((row.abs_accessibility_gap || 0) < 10) {
      continue;
    }
    const issueKey = `high-bilingual-accessibility-gap:${row.pair_id}`;
    const dates = recurrenceMap.get(issueKey) || [currentReport.run_date];
    issues.push(
      buildIssue("high-bilingual-accessibility-gap", {
        issue_key: issueKey,
        pair_id: row.pair_id,
        service_name: row.service_name,
        institution: row.institution,
        canonical_url: row.url_en,
        page_load_count: row.page_load_count,
        tier: row.tier,
        service_pattern: row.service_pattern,
        severity_base: Math.min(84, 30 + (row.abs_accessibility_gap || 0) * 2),
        recurrence_days: dates.length,
        first_seen: dates[0],
        last_seen: dates[dates.length - 1],
        issue_detail: `EN ${row.accessibility_score_en} vs FR ${row.accessibility_score_fr} (${row.abs_accessibility_gap} point gap)`
      })
    );
  }

  for (const row of currentReport.accessibility_statements?.missing_statement_examples || []) {
    const issueKey = `missing-accessibility-statement:${row.inventory_id}`;
    const dates = recurrenceMap.get(issueKey) || [currentReport.run_date];
    issues.push(
      buildIssue("missing-accessibility-statement", {
        issue_key: issueKey,
        inventory_id: row.inventory_id,
        service_name: row.service_name,
        institution: row.institution,
        language: row.language,
        canonical_url: row.canonical_url,
        page_load_count: row.page_load_count,
        tier: row.tier,
        service_pattern: row.service_pattern,
        severity_base: 58,
        recurrence_days: dates.length,
        first_seen: dates[0],
        last_seen: dates[dates.length - 1],
        issue_detail: `No accessibility statement detected for ${String(row.language || "unknown").toUpperCase()} variant`
      })
    );
  }

  for (const row of currentReport.top_urls || []) {
    const a11y = row.lighthouse?.accessibility_score;
    if (row.scan_status !== "success" || typeof a11y !== "number" || a11y > 75 || (row.page_load_count || 0) < 10000) {
      continue;
    }
    const issueKey = `high-impact-low-accessibility:${row.inventory_id}`;
    const dates = recurrenceMap.get(issueKey) || [currentReport.run_date];
    issues.push(
      buildIssue("high-impact-low-accessibility", {
        issue_key: issueKey,
        inventory_id: row.inventory_id,
        service_name: row.service_name,
        institution: row.institution,
        language: row.language,
        canonical_url: row.canonical_url,
        page_load_count: row.page_load_count,
        tier: row.tier,
        service_pattern: row.service_pattern,
        severity_base: Math.min(88, 20 + (100 - a11y)),
        recurrence_days: dates.length,
        first_seen: dates[0],
        last_seen: dates[dates.length - 1],
        issue_detail: `Accessibility score ${a11y} on a high-demand page`
      })
    );
  }

  const deduped = new Map();
  for (const issue of issues) {
    const existing = deduped.get(issue.issue_key);
    if (!existing || issue.priority_score > existing.priority_score) {
      deduped.set(issue.issue_key, issue);
    }
  }

  const ranked = [...deduped.values()].sort(
    (a, b) => b.priority_score - a.priority_score || b.page_load_count - a.page_load_count || a.issue_key.localeCompare(b.issue_key)
  );

  const recurring = ranked.filter((issue) => issue.recurrence_days >= 2);
  const byType = ranked.reduce((acc, issue) => {
    acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      total_issues: ranked.length,
      recurring_issues: recurring.length,
      highest_priority_score: ranked[0]?.priority_score || null,
      by_type: byType
    },
    top_priority_issues: ranked.slice(0, 20),
    recurring_issues: recurring.slice(0, 20),
    all_issues: ranked
  };
}
