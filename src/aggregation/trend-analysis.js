function round(value) {
  return Number(value.toFixed(2));
}

function toNumberOrNull(value) {
  return typeof value === "number" ? value : null;
}

function computeDelta(currentValue, previousValue) {
  const current = toNumberOrNull(currentValue);
  const previous = toNumberOrNull(previousValue);
  if (current === null || previous === null) {
    return null;
  }
  return round(current - previous);
}

function evaluateRegression(metric, delta) {
  if (delta === null) {
    return null;
  }

  if (metric === "accessibility_mean" && delta <= -3) {
    return { is_regression: true, severity: delta <= -6 ? "high" : "medium" };
  }

  if (metric === "statement_coverage_percent" && delta <= -5) {
    return { is_regression: true, severity: delta <= -10 ? "high" : "medium" };
  }

  if (metric === "parity_gap_abs_accessibility" && delta >= 3) {
    return { is_regression: true, severity: delta >= 8 ? "high" : "medium" };
  }

  if (metric === "impact_affected_share_percent" && delta >= 5) {
    return { is_regression: true, severity: delta >= 12 ? "high" : "medium" };
  }

  if (metric === "scan_failure_rate_percent" && delta >= 5) {
    return { is_regression: true, severity: delta >= 15 ? "high" : "medium" };
  }

  return { is_regression: false, severity: null };
}

function getFailureRate(summary) {
  const total = summary?.total || 0;
  const failed = summary?.failed || 0;
  if (!total) {
    return null;
  }
  return round((failed / total) * 100);
}

function metricSpec(currentReport, previousReport) {
  return [
    {
      metric: "accessibility_mean",
      label: "Mean Accessibility Score",
      direction: "higher_is_better",
      current: currentReport.benchmark_summary?.means?.accessibility_score,
      previous: previousReport.benchmark_summary?.means?.accessibility_score,
      unit: "points"
    },
    {
      metric: "statement_coverage_percent",
      label: "Accessibility Statement Coverage",
      direction: "higher_is_better",
      current:
        currentReport.accessibility_statements?.summary?.statement_coverage_percent,
      previous:
        previousReport.accessibility_statements?.summary?.statement_coverage_percent,
      unit: "percent"
    },
    {
      metric: "parity_gap_abs_accessibility",
      label: "Average Absolute EN/FR Accessibility Gap",
      direction: "lower_is_better",
      current:
        currentReport.bilingual_parity?.summary
          ?.average_absolute_accessibility_gap,
      previous:
        previousReport.bilingual_parity?.summary
          ?.average_absolute_accessibility_gap,
      unit: "points"
    },
    {
      metric: "impact_affected_share_percent",
      label: "Directional Affected Share",
      direction: "lower_is_better",
      current:
        currentReport.impact_model?.summary?.directional_affected_share_percent,
      previous:
        previousReport.impact_model?.summary?.directional_affected_share_percent,
      unit: "percent"
    },
    {
      metric: "scan_failure_rate_percent",
      label: "Scan Failure Rate",
      direction: "lower_is_better",
      current: getFailureRate(currentReport.scan_summary),
      previous: getFailureRate(previousReport.scan_summary),
      unit: "percent"
    }
  ];
}

export function computeTrendAnalysis(currentReport, previousReport) {
  if (!previousReport || !previousReport.run_date) {
    return {
      available: false,
      previous_run_date: null,
      metrics: [],
      regressions: [],
      note: "No previous report available for trend comparison."
    };
  }

  const metrics = metricSpec(currentReport, previousReport).map((item) => {
    const delta = computeDelta(item.current, item.previous);
    const evalResult = evaluateRegression(item.metric, delta);

    return {
      metric: item.metric,
      label: item.label,
      direction: item.direction,
      unit: item.unit,
      current: toNumberOrNull(item.current),
      previous: toNumberOrNull(item.previous),
      delta,
      is_regression: evalResult?.is_regression === true,
      severity: evalResult?.severity || null
    };
  });

  const regressions = metrics
    .filter((row) => row.is_regression)
    .sort((a, b) => {
      const sev = { high: 2, medium: 1, null: 0 };
      const bySeverity = (sev[b.severity] || 0) - (sev[a.severity] || 0);
      if (bySeverity !== 0) {
        return bySeverity;
      }
      return Math.abs(b.delta || 0) - Math.abs(a.delta || 0);
    });

  return {
    available: true,
    previous_run_date: previousReport.run_date,
    compared_run_date: currentReport.run_date,
    metrics,
    regressions,
    note:
      "Automated trend signals only. Deltas indicate benchmark movement and are not direct evidence of compliance or user impact measurement."
  };
}
