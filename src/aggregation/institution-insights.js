/**
 * Institution-Specific Insights Aggregation
 *
 * Aggregates Lighthouse performance and axe violations at the institution level
 * to help institutions identify their specific problem areas and performance trends.
 */

function round(value) {
  return Number(value.toFixed(2));
}

function average(values) {
  if (!values.length) {
    return null;
  }
  return round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function computeInstitutionAxeInsights(scanned) {
  const institutionMap = new Map();

  for (const row of scanned) {
    if (row.scan_status !== "success" || !row.institution) {
      continue;
    }

    const inst = row.institution;
    const entry = institutionMap.get(inst) || {
      institution: inst,
      scanned_count: 0,
      violations: {
        critical: [],
        serious: [],
        moderate: [],
        minor: []
      },
      services: []
    };

    entry.scanned_count += 1;

    const { critical = 0, serious = 0, moderate = 0, minor = 0 } = row.scangov || {};

    if (critical > 0) entry.violations.critical.push(critical);
    if (serious > 0) entry.violations.serious.push(serious);
    if (moderate > 0) entry.violations.moderate.push(moderate);
    if (minor > 0) entry.violations.minor.push(minor);

    entry.services.push({
      service_name: row.service_name,
      canonical_url: row.canonical_url,
      language: row.language,
      critical,
      serious,
      moderate,
      minor,
      total: critical + serious + moderate + minor
    });

    institutionMap.set(inst, entry);
  }

  // Convert to output format
  const byInstitution = Array.from(institutionMap.values())
    .map((entry) => {
      const severities = ["critical", "serious", "moderate", "minor"];
      const stats = {};

      for (const severity of severities) {
        const values = entry.violations[severity];
        stats[`${severity}_total`] = values.reduce((sum, v) => sum + v, 0) || 0;
        stats[`${severity}_affected_pages`] = values.length;
        stats[`${severity}_average`] = average(values);
      }

      return {
        institution: entry.institution,
        scanned_urls: entry.scanned_count,
        critical_total_violations: stats.critical_total,
        critical_affected_pages: stats.critical_affected_pages,
        critical_average_per_page: stats.critical_average,
        serious_total_violations: stats.serious_total,
        serious_affected_pages: stats.serious_affected_pages,
        serious_average_per_page: stats.serious_average,
        moderate_total_violations: stats.moderate_total,
        moderate_affected_pages: stats.moderate_affected_pages,
        moderate_average_per_page: stats.moderate_average,
        minor_total_violations: stats.minor_total,
        minor_affected_pages: stats.minor_affected_pages,
        minor_average_per_page: stats.minor_average,
        total_violations: Object.values(stats)
          .filter((v) => typeof v === "number" && v !== null)
          .slice(0, 4) // Only totals
          .reduce((sum, v) => sum + v, 0),
        services_with_violations: entry.services.filter((s) => s.total > 0)
      };
    })
    .sort((a, b) => b.total_violations - a.total_violations);

  return {
    summary: {
      institutions_scanned: byInstitution.length,
      total_violations_across_institutions: byInstitution.reduce((sum, i) => sum + i.total_violations, 0),
      institutions_with_critical: byInstitution.filter((i) => i.critical_affected_pages > 0).length
    },
    by_institution: byInstitution
  };
}

export function computeInstitutionLighthouseInsights(scanned) {
  const institutionMap = new Map();

  for (const row of scanned) {
    if (row.scan_status !== "success" || !row.institution || !row.lighthouse?.by_context) {
      continue;
    }

    const inst = row.institution;
    const entry = institutionMap.get(inst) || {
      institution: inst,
      scanned_count: 0,
      scores: {
        desktop_light: [],
        desktop_dark: [],
        mobile_light: [],
        mobile_dark: []
      },
      services: []
    };

    entry.scanned_count += 1;

    const contexts = row.lighthouse.by_context || {};
    for (const contextKey of ["desktop_light", "desktop_dark", "mobile_light", "mobile_dark"]) {
      const context = contexts[contextKey] || {};
      if (context.accessibility_score !== undefined) {
        entry.scores[contextKey].push({
          accessibility: context.accessibility_score,
          performance: context.performance_score || 0,
          best_practices: context.best_practices_score || 0,
          seo: context.seo_score || 0
        });
      }
    }

    entry.services.push({
      service_name: row.service_name,
      canonical_url: row.canonical_url,
      language: row.language,
      contexts
    });

    institutionMap.set(inst, entry);
  }

  // Convert to output format
  const byInstitution = Array.from(institutionMap.values())
    .map((entry) => {
      const contextAverages = {};
      for (const contextKey of ["desktop_light", "desktop_dark", "mobile_light", "mobile_dark"]) {
        const scores = entry.scores[contextKey];
        contextAverages[contextKey] = {
          accessibility_score: average(scores.map((s) => s.accessibility)),
          performance_score: average(scores.map((s) => s.performance)),
          best_practices_score: average(scores.map((s) => s.best_practices)),
          seo_score: average(scores.map((s) => s.seo))
        };
      }

      const desktopLight = contextAverages.desktop_light || {};
      const mobileDark = contextAverages.mobile_dark || {};

      return {
        institution: entry.institution,
        scanned_urls: entry.scanned_count,
        desktop_light: desktopLight,
        desktop_dark: contextAverages.desktop_dark || {},
        mobile_light: contextAverages.mobile_light || {},
        mobile_dark: mobileDark,
        mobile_dark_vs_desktop_light: {
          accessibility_delta:
            desktopLight.accessibility_score && mobileDark.accessibility_score
              ? round(mobileDark.accessibility_score - desktopLight.accessibility_score)
              : null,
          performance_delta:
            desktopLight.performance_score && mobileDark.performance_score
              ? round(mobileDark.performance_score - desktopLight.performance_score)
              : null
        }
      };
    })
    .sort(
      (a, b) =>
        (b.desktop_light?.accessibility_score ?? 0) - (a.desktop_light?.accessibility_score ?? 0)
    );

  return {
    summary: {
      institutions_scanned: byInstitution.length,
      baseline_context: "desktop_light"
    },
    by_institution: byInstitution
  };
}
