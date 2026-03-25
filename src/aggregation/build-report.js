import { aggregateScores } from "./score-aggregation.js";
import { computeBilingualParity } from "./bilingual-parity.js";
import { summarizeAccessibilityStatements } from "./accessibility-statements.js";
import { summarizePlatformSignals } from "./platform-signals.js";
import { computeDirectionalImpact } from "./impact-model.js";
import { computeTrendAnalysis } from "./trend-analysis.js";

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

export function buildDailyReport({ runDate, runId, mode, inventory, scanned, previousReport = null }) {
  const scoreAggregates = aggregateScores(scanned);
  const bilingualParity = computeBilingualParity(scanned);
  const accessibilityStatements = summarizeAccessibilityStatements(scanned);
  const platformSignals = summarizePlatformSignals(scanned);
  const impactModel = computeDirectionalImpact(scanned);

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
      platform_fingerprint: row.platform_fingerprint
    })),
    methodology: {
      status: "phase-7",
      note: "Phase 7: Adds directional impact modeling from automated signals and traffic volume. These are benchmark estimates, not measured user harm, legal compliance, or manual audit findings."
    },
    output_paths: {
      daily_dir: `docs/reports/daily/${runDate}/`,
      report_json: `docs/reports/daily/${runDate}/report.json`,
      report_html: `docs/reports/daily/${runDate}/index.html`,
      dashboard_html: "docs/reports/index.html"
    }
  };

  const trendAnalysis = computeTrendAnalysis(baseReport, previousReport);

  return {
    ...baseReport,
    trend_analysis: trendAnalysis,
    methodology: {
      status: "phase-9",
      note: "Phase 9: Adds day-over-day trend comparison and regression alerts across core benchmark signals. Trend flags are automated diagnostics, not legal or compliance determinations."
    }
  };
}
