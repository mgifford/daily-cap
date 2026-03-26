function toBarrierPoint(report) {
  const scannedUrls = report.scan_summary?.total || 0;
  const statementsDetected =
    report.accessibility_statements?.summary?.statements_detected || 0;

  return {
    run_date: report.run_date,
    missing_french: report.bilingual_parity?.summary?.missing_french || 0,
    missing_english: report.bilingual_parity?.summary?.missing_english || 0,
    missing_statements: Math.max(0, scannedUrls - statementsDetected),
    high_accessibility_gap_pairs:
      report.bilingual_parity?.summary?.high_accessibility_gap_pairs || 0,
    average_absolute_accessibility_gap:
      report.bilingual_parity?.summary?.average_absolute_accessibility_gap ?? null,
    directional_affected_share_percent:
      report.impact_model?.summary?.directional_affected_share_percent ?? null
  };
}

export function summarizeBarrierHistory(currentReport, historicalReports = []) {
  const points = [...historicalReports, currentReport]
    .filter((report) => report?.run_date)
    .sort((a, b) => a.run_date.localeCompare(b.run_date))
    .map(toBarrierPoint);

  return {
    summary: {
      points: points.length,
      start_date: points[0]?.run_date || null,
      end_date: points[points.length - 1]?.run_date || null
    },
    points
  };
}