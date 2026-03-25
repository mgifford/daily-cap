export function aggregateScores(scanned) {
  const successful = scanned.filter((item) => item.scan_status === "success");

  const categories = [
    "performance_score",
    "accessibility_score",
    "best_practices_score",
    "seo_score"
  ];

  const means = {};
  for (const category of categories) {
    const values = successful
      .map((item) => item.lighthouse?.[category])
      .filter((value) => typeof value === "number");
    means[category] =
      values.length === 0
        ? null
        : Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  }

  return {
    means,
    url_counts: {
      total: scanned.length,
      succeeded: successful.length,
      failed: scanned.length - successful.length
    }
  };
}
