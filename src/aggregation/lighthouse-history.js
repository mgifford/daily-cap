function toLighthouseHistoryPoint(report) {
  const byContext = report.lighthouse_contexts?.by_context || {};
  return {
    run_date: report.run_date,
    desktop_light: byContext.desktop_light || null,
    desktop_dark: byContext.desktop_dark || null,
    mobile_light: byContext.mobile_light || null,
    mobile_dark: byContext.mobile_dark || null
  };
}

export function summarizeLighthouseHistory(currentReport, historicalReports = []) {
  const points = [...historicalReports, currentReport]
    .filter((report) => report?.run_date)
    .sort((a, b) => a.run_date.localeCompare(b.run_date))
    .map(toLighthouseHistoryPoint);

  return {
    summary: {
      points: points.length,
      start_date: points[0]?.run_date || null,
      end_date: points[points.length - 1]?.run_date || null
    },
    points
  };
}
