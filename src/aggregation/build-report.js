import { aggregateScores } from "./score-aggregation.js";
import { computeBilingualParity } from "./bilingual-parity.js";
import { summarizeAccessibilityStatements } from "./accessibility-statements.js";
import { summarizePlatformSignals } from "./platform-signals.js";
import { computeDirectionalImpact } from "./impact-model.js";
import { computeTrendAnalysis } from "./trend-analysis.js";
import { summarizeCohortQuality } from "./cohort-quality.js";
import { summarizeLighthouseContexts } from "./lighthouse-context-analysis.js";
import { summarizeBarrierHistory } from "./barrier-history.js";
import { summarizeLighthouseHistory } from "./lighthouse-history.js";
import { summarizePriorityIssues } from "./priority-issues.js";
import { summarizeInstitutionScorecards } from "./institution-scorecards.js";
import { summarizeInstitutionTrends } from "./institution-trends.js";
import { computeTopAxeIssues } from "./axe-top-issues.js";
import { computeInstitutionAxeInsights, computeInstitutionLighthouseInsights } from "./institution-insights.js";

function summarizeScan(scanned) {
  const succeeded = scanned.filter((row) => row.scan_status === "success").length;
  const failed = scanned.filter((row) => row.scan_status === "failed").length;

  return {
    total: scanned.length,
    succeeded,
    failed,
    excluded: 0
  };
}

export function buildDailyReport({
  runDate,
  runId,
  mode,
  inventory,
  scanned,
  previousReport = null,
  historicalReports = []
}) {
  const scoreAggregates = aggregateScores(scanned);
  const bilingualParity = computeBilingualParity(scanned);
  const accessibilityStatements = summarizeAccessibilityStatements(scanned);
  const platformSignals = summarizePlatformSignals(scanned);
  const impactModel = computeDirectionalImpact(scanned);
  const cohortQuality = summarizeCohortQuality(scanned);
  const lighthouseContexts = summarizeLighthouseContexts(scanned);
  const topAxeIssues = computeTopAxeIssues(scanned);
  const institutionAxeInsights = computeInstitutionAxeInsights(scanned);
  const institutionLighthouseInsights = computeInstitutionLighthouseInsights(scanned);

  // inventory is now an object with scan_targets, ranking_summary, tier_validation, etc.
  const inventoryCount = inventory.scan_target_count || inventory.scan_targets?.length || 0;
  const tierValidation = inventory.tier_validation || {};

  const baseReport = {
    run_id: runId,
    run_date: runDate,
    scan_mode: mode,
    url_limit: inventoryCount,
    inventory_summary: {
      selected_count: inventory.selected_count,
      scan_target_count: inventory.scan_target_count,
      source_distribution: inventory.source_distribution,
      tier_validation: tierValidation,
      ranking_top_10: inventory.ranking_summary?.top_10 || []
    },
    scan_summary: summarizeScan(scanned),
    benchmark_summary: scoreAggregates,
    bilingual_parity: bilingualParity,
    accessibility_statements: accessibilityStatements,
    platform_signals: platformSignals,
    impact_model: impactModel,
    cohort_quality: cohortQuality,
    lighthouse_contexts: lighthouseContexts,
    top_axe_issues: topAxeIssues,
    institution_axe_insights: institutionAxeInsights,
    institution_lighthouse_insights: institutionLighthouseInsights,
    top_urls: scanned.map((row) => ({
      inventory_id: row.inventory_id,
      language: row.language,
      canonical_url: row.canonical_url,
      service_name: row.service_name,
      institution: row.institution,
      source: row.source,
      tier: row.tier,
      service_pattern: row.service_pattern,
      service_category: row.service_category,
      page_load_count: row.page_load_count,
      rank_score: row.rank_score,
      scan_status: row.scan_status,
      failure_reason: row.failure_reason,
      lighthouse: row.lighthouse,
      scangov: row.scangov,
      accessibility_statement: row.accessibility_statement,
      platform_fingerprint: row.platform_fingerprint,
      green_web: row.green_web,
      amtpg: row.amtpg
    })),
    methodology: {
      status: "phase-7",
      note: "Phase 7: Adds directional impact modeling from automated signals and traffic volume. These are benchmark estimates, not measured user harm, legal compliance, or manual audit findings."
    },
    output_paths: {
      daily_dir: `docs/reports/daily/${runDate}/`,
      report_json: `docs/reports/daily/${runDate}/report.json`,
      report_html: `docs/reports/daily/${runDate}/index.html`,
      dashboard_html: "docs/reports/index.html",
      details: {
        missing_counterparts_json: `docs/reports/daily/${runDate}/details/missing-counterparts.json`,
        missing_statements_json: `docs/reports/daily/${runDate}/details/missing-statements.json`,
        detected_statements_json: `docs/reports/daily/${runDate}/details/detected-statements.json`,
        cms_buckets_json: `docs/reports/daily/${runDate}/details/cms-buckets.json`,
        barrier_history_json: `docs/reports/daily/${runDate}/details/barrier-history.json`,
        priority_issues_json: `docs/reports/daily/${runDate}/details/priority-issues.json`,
        recurring_issues_json: `docs/reports/daily/${runDate}/details/recurring-issues.json`,
        top_axe_issues_json: `docs/reports/daily/${runDate}/details/top-axe-issues.json`,
        institution_scorecards_json: `docs/reports/daily/${runDate}/details/institution-scorecards.json`,
        institution_trends_json: `docs/reports/daily/${runDate}/details/institution-trends.json`,
        institution_trends_html: `docs/reports/daily/${runDate}/details/institution-trends.html`,
        institution_axe_insights_json: `docs/reports/daily/${runDate}/details/institution-axe-insights.json`,
        institution_lighthouse_insights_json: `docs/reports/daily/${runDate}/details/institution-lighthouse-insights.json`,
        bilingual_gap_leaderboard_json: `docs/reports/daily/${runDate}/details/bilingual-gap-leaderboard.json`
      }
    }
  };

  const trendAnalysis = computeTrendAnalysis(baseReport, previousReport);
  const barrierHistory = summarizeBarrierHistory(baseReport, historicalReports);
  const lighthouseHistory = summarizeLighthouseHistory(baseReport, historicalReports);
  const priorityIssues = summarizePriorityIssues(baseReport, historicalReports);
  const institutionScorecards = summarizeInstitutionScorecards(baseReport.top_urls, priorityIssues);
  const institutionTrends = summarizeInstitutionTrends(baseReport, historicalReports);

  return {
    ...baseReport,
    trend_analysis: trendAnalysis,
    barrier_history: barrierHistory,
    lighthouse_history: lighthouseHistory,
    priority_issues: priorityIssues,
    institution_scorecards: institutionScorecards,
    institution_trends: institutionTrends,
    methodology: {
      status: "phase-12",
      note: "Phase 12: Adds institution trend pages on top of issue prioritization, institution scorecards, recurring issue tracking, barrier history, and drill-down exports. These remain automated benchmark diagnostics, not legal or compliance determinations."
    }
  };
}
