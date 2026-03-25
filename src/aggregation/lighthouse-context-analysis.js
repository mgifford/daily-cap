function round(value) {
  return Number(value.toFixed(2));
}

function average(values) {
  if (!values.length) {
    return null;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function collectMetric(rows, contextKey, metric) {
  return rows
    .map((row) => row.lighthouse?.by_context?.[contextKey]?.[metric])
    .filter((value) => Number.isFinite(value));
}

function delta(current, baseline) {
  if (!Number.isFinite(current) || !Number.isFinite(baseline)) {
    return null;
  }
  return round(current - baseline);
}

export function summarizeLighthouseContexts(scanned) {
  const successful = scanned.filter(
    (row) => row.scan_status === "success" && row.lighthouse?.by_context
  );

  const contextKeys = ["desktop_light", "desktop_dark", "mobile_light", "mobile_dark"];
  const metrics = ["performance_score", "accessibility_score", "best_practices_score", "seo_score"];

  const byContext = {};
  for (const contextKey of contextKeys) {
    const metricMeans = {};
    for (const metric of metrics) {
      metricMeans[metric] = average(collectMetric(successful, contextKey, metric));
    }
    byContext[contextKey] = metricMeans;
  }

  const baseline = byContext.desktop_light || {};

  const contextDeltas = contextKeys.map((contextKey) => {
    const current = byContext[contextKey] || {};
    return {
      context: contextKey,
      delta_vs_desktop_light: {
        performance_score: delta(current.performance_score, baseline.performance_score),
        accessibility_score: delta(current.accessibility_score, baseline.accessibility_score),
        best_practices_score: delta(current.best_practices_score, baseline.best_practices_score),
        seo_score: delta(current.seo_score, baseline.seo_score)
      }
    };
  });

  const mobileDark = byContext.mobile_dark || {};
  const headline = {
    context: "mobile_dark_vs_desktop_light",
    performance_score: delta(mobileDark.performance_score, baseline.performance_score),
    accessibility_score: delta(mobileDark.accessibility_score, baseline.accessibility_score),
    best_practices_score: delta(mobileDark.best_practices_score, baseline.best_practices_score),
    seo_score: delta(mobileDark.seo_score, baseline.seo_score)
  };

  return {
    summary: {
      scanned_urls_with_context_data: successful.length,
      baseline_context: "desktop_light"
    },
    by_context: byContext,
    deltas: contextDeltas,
    highlights: {
      mobile_dark_vs_desktop_light: headline
    }
  };
}