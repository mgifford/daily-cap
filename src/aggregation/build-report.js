import { aggregateScores } from "./score-aggregation.js";
import { computeBilingualParity } from "./bilingual-parity.js";

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

export function buildDailyReport({ runDate, runId, mode, inventory, scanned }) {
  const scoreAggregates = aggregateScores(scanned);
  const bilingualParity = computeBilingualParity(scanned);

  return {
    run_id: runId,
    run_date: runDate,
    scan_mode: mode,
    url_limit: inventory.length,
    scan_summary: summarizeScan(scanned),
    benchmark_summary: scoreAggregates,
    bilingual_parity: bilingualParity,
    top_urls: scanned.map((row) => ({
      inventory_id: row.inventory_id,
      id: row.id,
      service_name: row.service_name,
      language: row.language,
      canonical_url: row.canonical_url,
      source: row.source,
      service_pattern: row.service_pattern,
      service_category: row.service_category,
      institution: row.institution,
      page_load_count: row.page_load_count,
      scan_status: row.scan_status,
      failure_reason: row.failure_reason,
      lighthouse: row.lighthouse,
      scangov: row.scangov
    })),
    methodology: {
      status: "baseline",
      note: "Phase 1 baseline with deterministic mock/live scanner adapters; impact and statement sections are planned for later phases."
    },
    output_paths: {
      daily_dir: `docs/reports/daily/${runDate}/`,
      report_json: `docs/reports/daily/${runDate}/report.json`,
      report_html: `docs/reports/daily/${runDate}/index.html`,
      dashboard_html: "docs/reports/index.html"
    }
  };
}
