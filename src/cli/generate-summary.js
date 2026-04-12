#!/usr/bin/env node
/**
 * Generates an accessibility and quality summary for GitHub Actions step summaries
 * and standalone review.
 *
 * Reads report.json from docs/reports/daily/YYYY-MM-DD/ and writes a Markdown
 * narrative to GITHUB_STEP_SUMMARY (when running in Actions) or stdout.
 *
 * Usage:
 *   node src/cli/generate-summary.js [--output-root <dir>] [--date YYYY-MM-DD]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const BASE_REPORT_URL = "https://mgifford.github.io/daily-cap/docs/reports/daily";

function getDefaultRepoRoot() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, "..", "..");
}

function parseArgs(argv) {
  const args = { repoRoot: null, runDate: null };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--output-root") {
      args.repoRoot = argv[++i];
    } else if (argv[i] === "--date") {
      args.runDate = argv[++i];
    }
  }
  return args;
}

/**
 * Format a number with comma separators.
 */
function fmt(n) {
  return Number(n).toLocaleString("en-CA");
}

/**
 * Return a human-readable Canadian date string from a YYYY-MM-DD string.
 */
function humanDate(dateStr) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

/**
 * Return trend arrow and delta string for a metric.
 * direction: "higher_is_better" | "lower_is_better"
 */
function scoreLine(label, current, previous, unit = "") {
  if (previous == null) {
    return `- **${label}**: ${current}${unit ? " " + unit : ""}`;
  }
  const delta = Math.round((current - previous) * 100) / 100;
  const sign = delta >= 0 ? "+" : "";
  return `- **${label}**: ${current}${unit ? " " + unit : ""} (${sign}${delta} vs previous run)`;
}

/**
 * Summarize trend metrics from trend_analysis.metrics.
 */
function buildTrendSection(trendAnalysis) {
  if (!trendAnalysis?.available) {
    return ["### Trend", "", "No previous run available for comparison.", ""];
  }

  const lines = [];
  lines.push("### Trend vs. previous run");
  lines.push("");
  lines.push(`Compared with run date: **${trendAnalysis.previous_run_date}**`);
  lines.push("");

  for (const metric of trendAnalysis.metrics ?? []) {
    const unit = metric.unit === "percent" ? "%" : metric.unit === "points" ? "" : "";
    lines.push(scoreLine(metric.label, metric.current, metric.previous, unit));
  }

  if (trendAnalysis.regressions?.length > 0) {
    lines.push("");
    lines.push("**Regressions detected:**");
    lines.push("");
    for (const reg of trendAnalysis.regressions) {
      lines.push(`- ${reg.label}: ${reg.delta > 0 ? "+" : ""}${reg.delta} (${reg.severity})`);
    }
  }

  lines.push("");
  return lines;
}

/**
 * Summarize bilingual parity signals.
 */
function buildBilingualSection(bilingualParity) {
  const s = bilingualParity?.summary;
  if (!s) return [];

  const lines = [];
  lines.push("### Bilingual parity");
  lines.push("");
  lines.push(`- **Paired services (EN + FR)**: ${s.paired_services ?? 0} of ${s.candidate_pairs ?? 0}`);
  lines.push(`- **Missing French counterpart**: ${s.missing_french ?? 0} URLs`);
  lines.push(`- **Missing English counterpart**: ${s.missing_english ?? 0} URLs`);
  lines.push(
    `- **Average absolute EN/FR accessibility gap**: ${s.average_absolute_accessibility_gap ?? 0} points`
  );
  lines.push(`- **Pairs with accessibility gap >= 10 points**: ${s.high_accessibility_gap_pairs ?? 0}`);
  lines.push("");
  return lines;
}

/**
 * Summarize accessibility statement coverage.
 */
function buildStatementsSection(statements) {
  const s = statements?.summary;
  if (!s) return [];

  const lines = [];
  lines.push("### Accessibility statements");
  lines.push("");
  lines.push(
    `- **Statement coverage**: ${s.statements_detected ?? 0} of ${s.scanned_urls ?? 0} URLs ` +
      `(${s.statement_coverage_percent ?? 0}%)`
  );
  lines.push(`- **With contact information**: ${s.with_contact_info ?? 0} (${s.with_contact_info_percent ?? 0}%)`);
  lines.push(
    `- **With compliance status mentioned**: ${s.with_compliance_status ?? 0} ` +
      `(${s.with_compliance_status_percent ?? 0}%)`
  );
  lines.push(
    `- **With freshness marker (date)**: ${s.with_freshness_marker ?? 0} ` +
      `(${s.with_freshness_marker_percent ?? 0}%)`
  );
  lines.push(
    `- **Bilingual statement pairs (both EN + FR present)**: ` +
      `${s.bilingual_pairs_both_detected ?? 0} of ${s.bilingual_pairs_total ?? 0} pairs`
  );
  lines.push("");
  return lines;
}

/**
 * Summarize top priority issues.
 */
function buildPriorityIssuesSection(priorityIssues, topN = 5) {
  const issues = priorityIssues?.all_issues;
  if (!issues?.length) return [];

  const lines = [];
  lines.push("### Top priority issues");
  lines.push("");
  lines.push(
    `${fmt(issues.length)} priority issues identified. Top ${topN} by priority score:`
  );
  lines.push("");
  lines.push("| Service | Institution | Issue | Priority score |");
  lines.push("|---------|-------------|-------|----------------|");

  for (const issue of issues.slice(0, topN)) {
    const service = (issue.service_name ?? "").replaceAll("|", "\\|");
    const institution = (issue.institution ?? "-").replaceAll("|", "\\|");
    const detail = (issue.issue_detail ?? issue.issue_type ?? "-").replaceAll("|", "\\|");
    lines.push(`| ${service} | ${institution} | ${detail} | ${issue.priority_score ?? "-"} |`);
  }

  lines.push("");
  return lines;
}

/**
 * Build the full Markdown summary from a report object.
 *
 * @param {object} report - Parsed report.json object
 * @param {object} [options]
 * @param {number} [options.topN=5] - Number of top priority issues to list
 * @returns {string} Markdown summary text
 */
export function buildSummary(report, options = {}) {
  const topN = options.topN ?? 5;
  const runDate = report.run_date ?? "";
  const reportUrl = `${BASE_REPORT_URL}/${runDate}/index.html`;

  const scan = report.scan_summary ?? {};
  const means = report.benchmark_summary?.means ?? {};
  const impact = report.impact_model?.summary ?? {};

  const lines = [];

  // Header
  lines.push(`## Daily CAP Summary: ${humanDate(runDate)}`);
  lines.push("");
  lines.push(
    `**Source**: Canada.ca recent activity and top tasks | ` +
      `**Mode**: ${report.scan_mode ?? "unknown"}`
  );
  lines.push(
    `**Scanned**: ${fmt(scan.succeeded ?? 0)} of ${fmt(scan.total ?? 0)} URLs succeeded` +
      (scan.failed ? ` (${scan.failed} failed)` : "")
  );
  lines.push("");

  // Scores
  lines.push("### Aggregate scores");
  lines.push("");
  lines.push(scoreLine("Accessibility", means.accessibility_score));
  lines.push(scoreLine("Performance", means.performance_score));
  lines.push(scoreLine("Best Practices", means.best_practices_score));
  lines.push(scoreLine("SEO", means.seo_score));
  lines.push("");

  // Impact
  if (impact.total_page_load_count) {
    lines.push("### Directional impact estimate");
    lines.push("");
    lines.push(
      `Based on traffic volume and automated barrier signals, an estimated **${fmt(impact.directional_affected_load_estimate ?? 0)} page loads** ` +
        `(${impact.directional_affected_share_percent ?? 0}% of ${fmt(impact.total_page_load_count)} total) ` +
        `may be affected by detected barriers today.`
    );
    lines.push("");
    lines.push(
      "_Directional estimate only. This combines automated quality signals with traffic volume " +
        "and does not represent measured user harm or legal compliance status._"
    );
    lines.push("");
  }

  // Trend
  lines.push(...buildTrendSection(report.trend_analysis));

  // Bilingual parity
  lines.push(...buildBilingualSection(report.bilingual_parity));

  // Accessibility statements
  lines.push(...buildStatementsSection(report.accessibility_statements));

  // Priority issues
  lines.push(...buildPriorityIssuesSection(report.priority_issues, topN));

  // Footer
  lines.push(`[View full report](${reportUrl})`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    `_Generated by [Daily CAP](https://github.com/mgifford/daily-cap) | ` +
      `Methodology: Lighthouse + axe-core | ` +
      `Date: ${runDate}_`
  );

  return lines.join("\n");
}

/**
 * Read report.json for the given date and generate a summary.
 *
 * @param {string} repoRoot - Absolute path to the repository root
 * @param {string|null} runDate - YYYY-MM-DD date string, or null to use latest
 * @returns {Promise<string>} Markdown summary text
 */
export async function generateSummary(repoRoot, runDate) {
  const reportsRoot = path.join(repoRoot, "docs", "reports");

  let reportDate = runDate;
  if (!reportDate) {
    // Find the most recent daily report directory.
    const dailyRoot = path.join(reportsRoot, "daily");
    const entries = await fs.readdir(dailyRoot, { withFileTypes: true });
    const dates = entries
      .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
      .map((e) => e.name)
      .sort((a, b) => b.localeCompare(a));
    reportDate = dates[0] ?? null;
  }

  if (!reportDate) {
    throw new Error(
      "Could not determine report date. Pass --date or ensure a daily report directory exists."
    );
  }

  const dailyDir = path.join(reportsRoot, "daily", reportDate);
  const reportRaw = await fs.readFile(path.join(dailyDir, "report.json"), "utf8");
  const report = JSON.parse(reportRaw);

  return buildSummary(report);
}

async function main() {
  const args = parseArgs(process.argv);
  const repoRoot = path.resolve(args.repoRoot ?? getDefaultRepoRoot());
  const summary = await generateSummary(repoRoot, args.runDate ?? null);

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    await fs.appendFile(summaryPath, `\n${summary}\n`, "utf8");
    console.log("Summary written to GITHUB_STEP_SUMMARY");
  } else {
    console.log(summary);
  }
}

const isDirectExecution =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectExecution) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
