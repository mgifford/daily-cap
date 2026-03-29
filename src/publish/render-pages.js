function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toArrow(gap) {
  if (typeof gap !== "number" || gap === 0) {
    return "=";
  }
  return gap > 0 ? "EN ↑" : "FR ↑";
}

function safeId(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function sectionH2(id, text) {
  const safeText = escapeHtml(text);
  const safeAnchor = escapeHtml(id);
  return `<h2 id="${safeAnchor}">${safeText} <a href="#${safeAnchor}" class="anchor-link" aria-label="Link to section: ${safeText}">#</a></h2>`;
}

function renderCmsDisclosure(entry) {
  if (!entry || !entry.pages?.length) {
    return "No sample URLs";
  }

  return `<details class="inline-details"><summary>Show URLs</summary><ul class="link-list">${entry.pages
    .slice(0, 12)
    .map(
      (page) =>
        `<li><a href="${escapeHtml(page.canonical_url)}">${escapeHtml(
          `${page.language?.toUpperCase() || "NA"} ${page.service_name || page.canonical_url}`
        )}</a></li>`
    )
    .join("")}</ul></details>`;
}

function renderBarrierHistoryChart(points) {
  if (!points.length) {
    return "<p>No history data available yet.</p>";
  }

  const width = 860;
  const height = 260;
  const padding = 36;
  const values = points.flatMap((point) => [
    point.missing_french || 0,
    point.missing_statements || 0,
    point.high_accessibility_gap_pairs || 0
  ]);
  const maxValue = Math.max(1, ...values);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  function linePath(field) {
    return points
      .map((point, index) => {
        const value = point[field] || 0;
        const x = padding + stepX * index;
        const y = height - padding - ((height - padding * 2) * value) / maxValue;
        return `${index === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  }

  const dateLabels = points
    .map((point, index) => {
      const x = padding + stepX * index;
      return `<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="11">${escapeHtml(
        point.run_date.slice(5)
      )}</text>`;
    })
    .join("");

  const yTicks = [0, Math.round(maxValue / 2), maxValue]
    .map((value) => {
      const y = height - padding - ((height - padding * 2) * value) / maxValue;
      return `
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#d7e2d8" stroke-width="1" />
        <text x="${padding - 8}" y="${y + 4}" text-anchor="end" font-size="11">${value}</text>`;
    })
    .join("");

  return `<figure>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="barrier-history-title barrier-history-desc" class="history-chart">
      <title id="barrier-history-title">Barrier trend history</title>
      <desc id="barrier-history-desc">Line chart showing missing French counterparts, missing accessibility statements, and high accessibility gap pairs over time.</desc>
      ${yTicks}
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#7f9685" stroke-width="1.5" />
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#7f9685" stroke-width="1.5" />
      <path d="${linePath("missing_french")}" fill="none" stroke="#b5402d" stroke-width="3" />
      <path d="${linePath("missing_statements")}" fill="none" stroke="#1d6b42" stroke-width="3" />
      <path d="${linePath("high_accessibility_gap_pairs")}" fill="none" stroke="#235d8b" stroke-width="3" />
      ${dateLabels}
    </svg>
    <figcaption>Red = missing French counterparts, green = URLs missing accessibility statements, blue = paired pages with accessibility gap of 10 or more.</figcaption>
  </figure>`;
}

function renderMetricTrendChart(points, field, title, description, color, maxOverride = null) {
  if (!points.length) {
    return "<p>No history data available yet.</p>";
  }

  const width = 860;
  const height = 220;
  const padding = 36;
  const values = points.map((point) => point[field]).filter((value) => typeof value === "number");
  if (!values.length) {
    return `<p>${escapeHtml(title)}: no scored history data available yet.</p>`;
  }
  const maxValue = Math.max(1, maxOverride || 0, ...values);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const pathData = points
    .map((point, index) => {
      const value = point[field];
      const x = padding + stepX * index;
      if (typeof value !== "number") {
        return "";
      }
      const y = height - padding - ((height - padding * 2) * value) / maxValue;
      const previousValue = index > 0 ? points[index - 1]?.[field] : null;
      return `${typeof previousValue === "number" ? "L" : "M"}${x},${y}`;
    })
    .filter(Boolean)
    .join(" ");

  const pointMarkers = points
    .map((point, index) => {
      const value = point[field];
      if (typeof value !== "number") {
        return "";
      }
      const x = padding + stepX * index;
      const y = height - padding - ((height - padding * 2) * value) / maxValue;
      return `<circle cx="${x}" cy="${y}" r="4" fill="${escapeHtml(color)}" />`;
    })
    .join("");

  const dateLabels = points
    .map((point, index) => {
      const x = padding + stepX * index;
      return `<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="11">${escapeHtml(
        point.run_date.slice(5)
      )}</text>`;
    })
    .join("");

  return `<figure>
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="${escapeHtml(
      safeId(title)
    )}-title ${escapeHtml(safeId(title))}-desc" class="history-chart">
      <title id="${escapeHtml(safeId(title))}-title">${escapeHtml(title)}</title>
      <desc id="${escapeHtml(safeId(title))}-desc">${escapeHtml(description)}</desc>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#7f9685" stroke-width="1.5" />
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#7f9685" stroke-width="1.5" />
      <path d="${pathData}" fill="none" stroke="${escapeHtml(color)}" stroke-width="3" />
      ${pointMarkers}
      ${dateLabels}
    </svg>
    <figcaption>${escapeHtml(title)}</figcaption>
  </figure>`;
}

function renderLighthouseContextBarChart(byContext) {
  const contexts = ["desktop_light", "desktop_dark", "mobile_light", "mobile_dark"];
  const contextDisplayNames = {
    desktop_light: "Desktop Light",
    desktop_dark: "Desktop Dark",
    mobile_light: "Mobile Light",
    mobile_dark: "Mobile Dark"
  };
  const metrics = [
    { key: "performance_score", label: "Performance", color: "#235d8b" },
    { key: "accessibility_score", label: "Accessibility", color: "#1d6b42" },
    { key: "best_practices_score", label: "Best Practices", color: "#7b4f9e" },
    { key: "seo_score", label: "SEO", color: "#b5402d" }
  ];

  const hasData = contexts.some((ctx) => byContext[ctx]);
  if (!hasData) {
    return "<p>No Lighthouse context data available yet.</p>";
  }

  const W = 860;
  const H = 300;
  const padL = 48;
  const padR = 148;
  const padT = 30;
  const padB = 58;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const numGroups = contexts.length;
  const groupW = plotW / numGroups;
  const groupPad = 8;
  const barGap = 2;
  const barW = (groupW - groupPad * 2 - barGap * (metrics.length - 1)) / metrics.length;
  const maxVal = 100;

  const yTicks = [0, 25, 50, 75, 100]
    .map((val) => {
      const y = padT + plotH - (plotH * val) / maxVal;
      return `<line x1="${padL}" y1="${y}" x2="${padL + plotW}" y2="${y}" stroke="#d7e2d8" stroke-width="1" /><text x="${padL - 6}" y="${y + 4}" text-anchor="end" font-size="11">${val}</text>`;
    })
    .join("\n");

  const bars = contexts
    .flatMap((ctx, gi) => {
      const ctxData = byContext[ctx] || {};
      return metrics.map((metric, bi) => {
        const val = typeof ctxData[metric.key] === "number" ? ctxData[metric.key] : null;
        if (val === null) {
          return "";
        }
        const x = padL + gi * groupW + groupPad + bi * (barW + barGap);
        const bh = Math.max(1, (plotH * val) / maxVal);
        const y = padT + plotH - bh;
        return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${escapeHtml(metric.color)}" /><text x="${(x + barW / 2).toFixed(1)}" y="${(y - 3).toFixed(1)}" text-anchor="middle" font-size="9">${val}</text>`;
      });
    })
    .join("\n");

  const xlabels = contexts
    .map((ctx, gi) => {
      const cx = (padL + gi * groupW + groupW / 2).toFixed(1);
      const cy = padT + plotH + 18;
      return `<text x="${cx}" y="${cy}" text-anchor="middle" font-size="11">${escapeHtml(contextDisplayNames[ctx])}</text>`;
    })
    .join("\n");

  const legend = metrics
    .map((metric, i) => {
      const lx = padL + plotW + 14;
      const ly = padT + 20 + i * 22;
      return `<rect x="${lx}" y="${ly}" width="12" height="12" fill="${escapeHtml(metric.color)}" /><text x="${lx + 16}" y="${ly + 11}" font-size="11">${escapeHtml(metric.label)}</text>`;
    })
    .join("\n");

  return `<figure>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="lh-ctx-chart-title lh-ctx-chart-desc" class="history-chart">
      <title id="lh-ctx-chart-title">Lighthouse scores by scan context</title>
      <desc id="lh-ctx-chart-desc">Grouped bar chart showing Lighthouse performance, accessibility, best practices, and SEO scores across four scan contexts: desktop light, desktop dark, mobile light, mobile dark. Values range from 0 to 100.</desc>
      <line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#7f9685" stroke-width="1.5" />
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#7f9685" stroke-width="1.5" />
      ${yTicks}
      ${bars}
      ${xlabels}
      ${legend}
    </svg>
    <figcaption>Lighthouse scores by context (0&#8211;100). Blue&#160;=&#160;Performance, Green&#160;=&#160;Accessibility, Purple&#160;=&#160;Best Practices, Red&#160;=&#160;SEO.</figcaption>
  </figure>`;
}

function renderTopUrlRows(rows) {
  return rows
    .map((row) => {
      const lighthouse = row.lighthouse || {};
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td><a href="${escapeHtml(row.canonical_url)}">${escapeHtml(row.canonical_url)}</a></td>
        <td>${escapeHtml(row.language.toUpperCase())}</td>
        <td>${escapeHtml(row.scan_status)}</td>
        <td>${escapeHtml(row.accessibility_statement?.statement_detected ? "yes" : "no")}</td>
        <td>${escapeHtml(row.platform_fingerprint?.cms ?? "unknown")}</td>
        <td>${escapeHtml(row.platform_fingerprint?.design_system ?? "unknown")}</td>
        <td>${escapeHtml(row.page_load_count ?? "-")}</td>
        <td>${escapeHtml(lighthouse.performance_score ?? "-")}</td>
        <td>${escapeHtml(lighthouse.accessibility_score ?? "-")}</td>
      </tr>`;
    })
    .join("\n");
}

function renderDetailLayout({ title, heading, intro, backHref, backLabel = "Back to Daily Report", stylesheetHref, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${escapeHtml(stylesheetHref)}" />
  <script>(function(){var s=localStorage.getItem('cap-preferred-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.setAttribute('data-theme',s||(d?'dark':'light'));})();</script>
</head>
<body>
  <header>
    <div class="nav"><a href="${escapeHtml(backHref)}">&#8592; ${escapeHtml(backLabel)}</a></div>
    <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">Dark mode</button>
  </header>
  <main>
    <h1>${escapeHtml(heading)}</h1>
    <p><em>${escapeHtml(intro)}</em></p>
    ${body}
  </main>
  <script>
    (function () {
      var THEME_KEY = 'cap-preferred-theme';
      var html = document.documentElement;
      var toggle = document.getElementById('theme-toggle');
      function applyTheme(t) {
        html.setAttribute('data-theme', t);
        if (toggle) {
          toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          toggle.textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
        }
      }
      var stored = localStorage.getItem(THEME_KEY);
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(stored || (prefersDark ? 'dark' : 'light'));
      if (toggle) {
        toggle.addEventListener('click', function () {
          var c = html.getAttribute('data-theme');
          var n = c === 'dark' ? 'light' : 'dark';
          localStorage.setItem(THEME_KEY, n);
          applyTheme(n);
        });
      }
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) {
        mq.addEventListener('change', function (e) {
          if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
        });
      }
    })();
  </script>
</body>
</html>`;
}

export function renderPriorityIssuesPage(report) {
  const issues = report.priority_issues?.all_issues || [];
  const rows = issues
    .map(
      (issue) => `
      <tr>
        <td>${escapeHtml(issue.issue_type)}</td>
        <td>${escapeHtml(issue.service_name)}</td>
        <td>${escapeHtml(issue.institution)}</td>
        <td>${escapeHtml(issue.language || "-")}</td>
        <td>${escapeHtml(issue.page_load_count || "-")}</td>
        <td>${escapeHtml(issue.recurrence_days || "-")}</td>
        <td>${escapeHtml(issue.priority_score || "-")}</td>
        <td>${escapeHtml(issue.issue_detail || "-")}</td>
        <td>${escapeHtml(issue.recommended_action || "-")}</td>
        <td>${issue.canonical_url ? `<a href="${escapeHtml(issue.canonical_url)}">Open</a>` : "-"}</td>
      </tr>`
    )
    .join("\n");

  return renderDetailLayout({
    title: `Priority Issues - ${report.run_date}`,
    heading: `Priority Issues - ${report.run_date}`,
    intro: "Ranked issues combining severity, reach, service criticality, and persistence.",
    backHref: "../index.html",
    stylesheetHref: "../../../assets/report.css",
    body: `<p><a href="./priority-issues.json">Download JSON</a></p>
    <table>
      <thead>
        <tr>
          <th scope="col">Issue Type</th>
          <th scope="col">Service</th>
          <th scope="col">Institution</th>
          <th scope="col">Lang</th>
          <th scope="col">Load</th>
          <th scope="col">Days</th>
          <th scope="col">Priority</th>
          <th scope="col">Issue Detail</th>
          <th scope="col">Recommended Action</th>
          <th scope="col">Link</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="10">No priority issues available.</td></tr>'}</tbody>
    </table>`
  });
}

export function renderRecurringIssuesPage(report) {
  const issues = report.priority_issues?.recurring_issues || [];
  const rows = issues
    .map(
      (issue) => `
      <tr>
        <td>${escapeHtml(issue.issue_type)}</td>
        <td>${escapeHtml(issue.service_name)}</td>
        <td>${escapeHtml(issue.institution)}</td>
        <td>${escapeHtml(issue.first_seen || "-")}</td>
        <td>${escapeHtml(issue.last_seen || "-")}</td>
        <td>${escapeHtml(issue.recurrence_days || "-")}</td>
        <td>${escapeHtml(issue.issue_detail || "-")}</td>
        <td>${escapeHtml(issue.recommended_action || "-")}</td>
      </tr>`
    )
    .join("\n");

  return renderDetailLayout({
    title: `Recurring Issues - ${report.run_date}`,
    heading: `Recurring Issues - ${report.run_date}`,
    intro: "Issues present in this run and at least one prior daily run.",
    backHref: "../index.html",
    stylesheetHref: "../../../assets/report.css",
    body: `<p><a href="./recurring-issues.json">Download JSON</a></p>
    <table>
      <thead>
        <tr>
          <th scope="col">Issue Type</th>
          <th scope="col">Service</th>
          <th scope="col">Institution</th>
          <th scope="col">First Seen</th>
          <th scope="col">Last Seen</th>
          <th scope="col">Days</th>
          <th scope="col">Issue Detail</th>
          <th scope="col">Recommended Action</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="8">No recurring issues available.</td></tr>'}</tbody>
    </table>`
  });
}

export function renderInstitutionScorecardsPage(report) {
  const trendMap = new Map(
    (report.institution_trends?.institutions || []).map((item) => [item.institution, item])
  );
  const rows = (report.institution_scorecards?.all_scorecards || [])
    .map(
      (row) => `
      <tr>
        <td>${trendMap.get(row.institution) ? `<a href="./institutions/${escapeHtml(trendMap.get(row.institution).slug)}.html">${escapeHtml(row.institution)}</a>` : escapeHtml(row.institution)}</td>
        <td>${escapeHtml(row.scanned_urls)}</td>
        <td>${escapeHtml(row.total_page_load_count)}</td>
        <td>${escapeHtml(row.mean_accessibility_score ?? "-")}</td>
        <td>${escapeHtml(row.mean_performance_score ?? "-")}</td>
        <td>${escapeHtml(row.missing_french_count)}</td>
        <td>${escapeHtml(row.missing_statement_count)}</td>
        <td>${escapeHtml(row.high_gap_pair_count)}</td>
        <td>${escapeHtml(row.recurring_issue_count)}</td>
        <td>${escapeHtml(row.top_priority_issue_score ?? "-")}</td>
        <td>${escapeHtml(row.top_priority_issue ?? "-")}</td>
      </tr>`
    )
    .join("\n");

  return renderDetailLayout({
    title: `Institution Scorecards - ${report.run_date}`,
    heading: `Institution Scorecards - ${report.run_date}`,
    intro: "Institution-level ownership view for current scan outcomes and priority issue counts.",
    backHref: "../index.html",
    stylesheetHref: "../../../assets/report.css",
    body: `<p><a href="./institution-scorecards.json">Download JSON</a></p>
    <table>
      <thead>
        <tr>
          <th scope="col">Institution</th>
          <th scope="col">URLs</th>
          <th scope="col">Load</th>
          <th scope="col">Mean A11y</th>
          <th scope="col">Mean Perf</th>
          <th scope="col">Missing FR</th>
          <th scope="col">Missing Statements</th>
          <th scope="col">High Gap Pairs</th>
          <th scope="col">Recurring Issues</th>
          <th scope="col">Top Priority Score</th>
          <th scope="col">Top Issue Type</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="11">No institution scorecards available.</td></tr>'}</tbody>
    </table>
    <p><a href="./institution-trends.html">Open institution trends index</a></p>`
  });
}

export function renderInstitutionTrendsIndexPage(report) {
  const rows = (report.institution_trends?.institutions || [])
    .map(
      (item) => `
      <tr>
        <td><a href="./institutions/${escapeHtml(item.slug)}.html">${escapeHtml(item.institution)}</a></td>
        <td>${escapeHtml(item.days_tracked)}</td>
        <td>${escapeHtml(item.latest?.mean_accessibility_score ?? "-")}</td>
        <td>${escapeHtml(item.latest?.missing_french_count ?? "-")}</td>
        <td>${escapeHtml(item.latest?.missing_statement_count ?? "-")}</td>
        <td>${escapeHtml(item.latest?.high_gap_pair_count ?? "-")}</td>
      </tr>`
    )
    .join("\n");

  return renderDetailLayout({
    title: `Institution Trends - ${report.run_date}`,
    heading: `Institution Trends - ${report.run_date}`,
    intro: "Institution-level history pages showing accessibility and barrier signals over time.",
    backHref: "../index.html",
    backLabel: "Back to Daily Report",
    stylesheetHref: "../../../assets/report.css",
    body: `<p><a href="./institution-trends.json">Download JSON</a></p>
    <table>
      <thead>
        <tr>
          <th scope="col">Institution</th>
          <th scope="col">Days Tracked</th>
          <th scope="col">Latest Mean A11y</th>
          <th scope="col">Latest Missing FR</th>
          <th scope="col">Latest Missing Statements</th>
          <th scope="col">Latest High Gap Pairs</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6">No institution trend data available.</td></tr>'}</tbody>
    </table>`
  });
}

export function renderInstitutionTrendPage(report, institutionTrend) {
  const points = institutionTrend.points || [];
  const latest = institutionTrend.latest || {};
  return renderDetailLayout({
    title: `${institutionTrend.institution} Trends - ${report.run_date}`,
    heading: `${institutionTrend.institution} Trends`,
    intro: "Daily institution-level trend view for accessibility and key barrier signals.",
    backHref: "../institution-trends.html",
    backLabel: "Back to Institution Trends",
    stylesheetHref: "../../../../assets/report.css",
    body: `<div class="cards">
      <div class="card"><strong>Days Tracked</strong><br/>${escapeHtml(institutionTrend.days_tracked)}</div>
      <div class="card"><strong>Latest Mean A11y</strong><br/>${escapeHtml(latest.mean_accessibility_score ?? "-")}</div>
      <div class="card"><strong>Latest Missing FR</strong><br/>${escapeHtml(latest.missing_french_count ?? "-")}</div>
      <div class="card"><strong>Latest Missing Statements</strong><br/>${escapeHtml(latest.missing_statement_count ?? "-")}</div>
    </div>
    ${renderMetricTrendChart(points, "mean_accessibility_score", `${institutionTrend.institution} accessibility over time`, "Line chart of daily mean accessibility score for this institution.", "#1d6b42", 100)}
    ${renderMetricTrendChart(points, "missing_french_count", `${institutionTrend.institution} missing French counterparts over time`, "Line chart of daily missing French counterpart counts for this institution.", "#b5402d")}
    ${renderMetricTrendChart(points, "missing_statement_count", `${institutionTrend.institution} missing accessibility statements over time`, "Line chart of daily missing accessibility statement counts for this institution.", "#235d8b")}
    <table>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">URLs</th>
          <th scope="col">Load</th>
          <th scope="col">Mean A11y</th>
          <th scope="col">Mean Perf</th>
          <th scope="col">Missing FR</th>
          <th scope="col">Missing Statements</th>
          <th scope="col">High Gap Pairs</th>
        </tr>
      </thead>
      <tbody>${points
        .map(
          (point) => `<tr>
          <td>${escapeHtml(point.run_date)}</td>
          <td>${escapeHtml(point.scanned_urls)}</td>
          <td>${escapeHtml(point.total_page_load_count)}</td>
          <td>${escapeHtml(point.mean_accessibility_score ?? "-")}</td>
          <td>${escapeHtml(point.mean_performance_score ?? "-")}</td>
          <td>${escapeHtml(point.missing_french_count)}</td>
          <td>${escapeHtml(point.missing_statement_count)}</td>
          <td>${escapeHtml(point.high_gap_pair_count)}</td>
        </tr>`
        )
        .join("\n")}</tbody>
    </table>`
  });
}

export function renderDailyReportPage(report) {
  const paritySummary = report.bilingual_parity?.summary || {};
  const largestGaps = report.bilingual_parity?.highlights?.largest_accessibility_gaps || [];
  const missingCounterparts = report.bilingual_parity?.missing_counterparts || [];
  const statementSummary = report.accessibility_statements?.summary || {};
  const statementGaps = report.accessibility_statements?.missing_statement_examples || [];
  const statementChecks = report.accessibility_statements?.checks || [];
  const platformSummary = report.platform_signals?.summary || {};
  const cmsDist = report.platform_signals?.distributions?.cms || [];
  const cmsUrlExamples = report.platform_signals?.cms_url_examples || [];
  const impactSummary = report.impact_model?.summary || {};
  const impactTop = report.impact_model?.top_directional_impact_urls || [];
  const cohortSummary = report.cohort_quality?.summary || {};
  const cohortLineage = report.cohort_quality?.distributions?.source_lineage || [];
  const cohortWarnings = report.cohort_quality?.warnings || [];
  const provenanceRows = report.cohort_quality?.provenance_examples || [];
  const trend = report.trend_analysis || {};
  const trendMetrics = trend.metrics || [];
  const trendRegressions = trend.regressions || [];
  const contextSummary = report.lighthouse_contexts?.summary || {};
  const contextByContext = report.lighthouse_contexts?.by_context || {};
  const contextDeltas = report.lighthouse_contexts?.deltas || [];
  const contextHighlight = report.lighthouse_contexts?.highlights?.mobile_dark_vs_desktop_light || {};
  const barrierHistory = report.barrier_history?.points || [];
  const detailPaths = report.output_paths?.details || {};
  const priorityIssues = report.priority_issues?.top_priority_issues || [];
  const recurringIssues = report.priority_issues?.recurring_issues || [];
  const prioritySummary = report.priority_issues?.summary || {};
  const institutionSummary = report.institution_scorecards?.summary || {};
  const institutionScorecards = report.institution_scorecards?.scorecards || [];
  const institutionTrendMap = new Map(
    (report.institution_trends?.institutions || []).map((item) => [item.institution, item])
  );

  const topUrlsPreview = report.top_urls.slice(0, 12);
  const topUrlsOverflowCount = Math.max(0, report.top_urls.length - 12);
  const rows = renderTopUrlRows(topUrlsPreview);

  const missingCounterpartRows = missingCounterparts
    .slice(0, 12)
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td>${escapeHtml(row.has_en ? "yes" : "no")}</td>
        <td>${escapeHtml(row.has_fr ? "yes" : "no")}</td>
        <td>${row.url_en ? `<a href="${escapeHtml(row.url_en)}">EN</a>` : "-"} | ${row.url_fr ? `<a href="${escapeHtml(row.url_fr)}">FR</a>` : "-"}</td>
      </tr>`;
    })
    .join("\n");

  const parityRows = largestGaps
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td>${escapeHtml(row.accessibility_score_en ?? "-")} / ${escapeHtml(row.accessibility_score_fr ?? "-")}</td>
        <td>${escapeHtml(row.accessibility_gap ?? "-")} (${escapeHtml(toArrow(row.accessibility_gap))})</td>
        <td>${escapeHtml(row.performance_score_en ?? "-")} / ${escapeHtml(row.performance_score_fr ?? "-")}</td>
        <td>${escapeHtml(row.performance_gap ?? "-")}</td>
        <td><a href="${escapeHtml(row.url_en)}">EN</a> | <a href="${escapeHtml(row.url_fr)}">FR</a></td>
      </tr>`;
    })
    .join("\n");

  const missingStatementRows = statementGaps
    .slice(0, 10)
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td>${escapeHtml(row.language ? row.language.toUpperCase() : "-")}</td>
        <td>${escapeHtml(row.tier || "-")}</td>
        <td><a href="${escapeHtml(row.canonical_url)}">${escapeHtml(row.canonical_url)}</a></td>
      </tr>`;
    })
    .join("\n");

  const missingStatementOverflowCount = Math.max(0, statementGaps.length - 10);

  const detectedStatementRows = statementChecks
    .filter((row) => row.statement_detected)
    .slice(0, 10)
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td>${escapeHtml(row.language ? row.language.toUpperCase() : "-")}</td>
        <td><a href="${escapeHtml(row.canonical_url)}">${escapeHtml(row.canonical_url)}</a></td>
        <td>${escapeHtml(row.statement_link_text || "detected")}</td>
      </tr>`;
    })
    .join("\n");

  const cmsRows = cmsDist
    .slice(0, 8)
    .map((row) => {
      const cmsExamples = cmsUrlExamples.find((item) => item.cms === row.key);
      return `
      <tr>
        <td>${escapeHtml(row.key)}</td>
        <td>${escapeHtml(row.count)}</td>
        <td>${renderCmsDisclosure(cmsExamples)}</td>
      </tr>`;
    })
    .join("\n");

  const impactRows = impactTop
    .slice(0, 10)
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td>${escapeHtml(row.language ? row.language.toUpperCase() : "-")}</td>
        <td>${escapeHtml(row.page_load_count ?? "-")}</td>
        <td>${escapeHtml(row.blended_severity_weight ?? "-")}</td>
        <td>${escapeHtml(row.directional_affected_load_estimate ?? "-")}</td>
      </tr>`;
    })
    .join("\n");

  const trendRows = trendMetrics
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td>${escapeHtml(row.previous ?? "-")}</td>
        <td>${escapeHtml(row.current ?? "-")}</td>
        <td>${escapeHtml(row.delta ?? "-")}</td>
        <td>${escapeHtml(row.is_regression ? "yes" : "no")}</td>
      </tr>`;
    })
    .join("\n");

  const lineageRows = cohortLineage
    .slice(0, 8)
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.key)}</td>
        <td>${escapeHtml(row.count)}</td>
      </tr>`;
    })
    .join("\n");

  const provenanceTableRows = provenanceRows
    .slice(0, 10)
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td>${escapeHtml(row.language ? row.language.toUpperCase() : "-")}</td>
        <td>${escapeHtml(row.source_lineage.join(", "))}</td>
        <td>${escapeHtml(row.source_confidence_score)}</td>
        <td>${escapeHtml(row.source_confidence_label)}</td>
        <td>${escapeHtml(row.freshness_signal)}</td>
      </tr>`;
    })
    .join("\n");

  const regressionRows = trendRegressions
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.label)}</td>
        <td>${escapeHtml(row.delta ?? "-")}</td>
        <td>${escapeHtml(row.severity || "-")}</td>
      </tr>`;
    })
    .join("\n");

  const contextAverageRows = Object.entries(contextByContext)
    .map(([key, metrics]) => {
      return `
      <tr>
        <td>${escapeHtml(key)}</td>
        <td>${escapeHtml(metrics.performance_score ?? "-")}</td>
        <td>${escapeHtml(metrics.accessibility_score ?? "-")}</td>
        <td>${escapeHtml(metrics.best_practices_score ?? "-")}</td>
        <td>${escapeHtml(metrics.seo_score ?? "-")}</td>
      </tr>`;
    })
    .join("\n");

  const contextDeltaRows = contextDeltas
    .map((row) => {
      const metrics = row.delta_vs_desktop_light || {};
      return `
      <tr>
        <td>${escapeHtml(row.context)}</td>
        <td>${escapeHtml(metrics.performance_score ?? "-")}</td>
        <td>${escapeHtml(metrics.accessibility_score ?? "-")}</td>
        <td>${escapeHtml(metrics.best_practices_score ?? "-")}</td>
        <td>${escapeHtml(metrics.seo_score ?? "-")}</td>
      </tr>`;
    })
    .join("\n");

  const priorityIssueRows = priorityIssues
    .map((issue) => {
      return `
      <tr>
        <td>${escapeHtml(issue.issue_type)}</td>
        <td>${escapeHtml(issue.service_name)}</td>
        <td>${escapeHtml(issue.institution)}</td>
        <td>${escapeHtml(issue.page_load_count || "-")}</td>
        <td>${escapeHtml(issue.recurrence_days)}</td>
        <td>${escapeHtml(issue.priority_score)}</td>
        <td>${escapeHtml(issue.issue_detail)}</td>
        <td>${issue.canonical_url ? `<a href="${escapeHtml(issue.canonical_url)}">Open</a>` : "-"}</td>
      </tr>`;
    })
    .join("\n");

  const recurringIssueRows = recurringIssues
    .map((issue) => {
      return `
      <tr>
        <td>${escapeHtml(issue.issue_type)}</td>
        <td>${escapeHtml(issue.service_name)}</td>
        <td>${escapeHtml(issue.institution)}</td>
        <td>${escapeHtml(issue.first_seen || "-")}</td>
        <td>${escapeHtml(issue.last_seen || "-")}</td>
        <td>${escapeHtml(issue.recurrence_days)}</td>
        <td>${escapeHtml(issue.recommended_action)}</td>
      </tr>`;
    })
    .join("\n");

  const institutionRows = institutionScorecards
    .map((row) => {
      return `
      <tr>
        <td>${institutionTrendMap.get(row.institution) ? `<a href="./details/institutions/${escapeHtml(institutionTrendMap.get(row.institution).slug)}.html">${escapeHtml(row.institution)}</a>` : escapeHtml(row.institution)}</td>
        <td>${escapeHtml(row.scanned_urls)}</td>
        <td>${escapeHtml(row.mean_accessibility_score ?? "-")}</td>
        <td>${escapeHtml(row.missing_french_count)}</td>
        <td>${escapeHtml(row.missing_statement_count)}</td>
        <td>${escapeHtml(row.recurring_issue_count)}</td>
        <td>${escapeHtml(row.top_priority_issue_score ?? "-")}</td>
        <td>${escapeHtml(row.top_priority_issue ?? "-")}</td>
      </tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Daily CAP Report - ${escapeHtml(report.run_date)}</title>
  <link rel="stylesheet" href="../../assets/report.css" />
  <script>(function(){var s=localStorage.getItem('cap-preferred-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.setAttribute('data-theme',s||(d?'dark':'light'));})();</script>
</head>
<body>
  <header>
    <div class="nav"><a href="../../index.html">&#8592; Back to Reports</a> | <a href="../../../">Home</a></div>
    <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">Dark mode</button>
  </header>
  <main>
    <h1>Daily CAP Report</h1>
    <p>Date: ${escapeHtml(report.run_date)} | Mode: ${escapeHtml(report.scan_mode)}</p>
    <p><em>Daily CAP is an independent analytics project and is not a Government of Canada program.</em></p>
    <p><a href="./report.json">Download full report JSON</a></p>

    <section>
      ${sectionH2("overview", "Overview")}
      <div class="cards">
        <div class="card"><strong>Total</strong><br/>${escapeHtml(report.scan_summary.total)}</div>
        <div class="card"><strong>Succeeded</strong><br/>${escapeHtml(report.scan_summary.succeeded)}</div>
        <div class="card"><strong>Failed</strong><br/>${escapeHtml(report.scan_summary.failed)}</div>
        <div class="card"><strong>Avg A11y Gap (EN/FR)</strong><br/>${escapeHtml(paritySummary.average_absolute_accessibility_gap ?? "-")}</div>
      </div>
    </section>

    <section>
      ${sectionH2("trend-comparison", "Trend Comparison")}
      <p><em>${escapeHtml(trend.note || "No trend comparison available.")}</em></p>
      <div class="cards">
        <div class="card"><strong>Previous Run</strong><br/>${escapeHtml(trend.previous_run_date ?? "none")}</div>
        <div class="card"><strong>Regressions</strong><br/>${escapeHtml(trendRegressions.length)}</div>
      </div>

      <h3>Metric Deltas</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Previous</th>
            <th scope="col">Current</th>
            <th scope="col">Delta</th>
            <th scope="col">Regression</th>
          </tr>
        </thead>
        <tbody>${trendRows || '<tr><td colspan="5">No prior run to compare yet.</td></tr>'}</tbody>
      </table>

      <h3>Regression Alerts</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Delta</th>
            <th scope="col">Severity</th>
          </tr>
        </thead>
        <tbody>${regressionRows || '<tr><td colspan="3">No regressions detected in configured thresholds.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("barrier-history", "Barrier History")}
      <p><em>These daily signals track barrier-related counts over time so regressions are visible beyond a single-day snapshot.</em></p>
      <div class="cards">
        <div class="card"><strong>History Window</strong><br/>${escapeHtml(report.barrier_history?.summary?.start_date ?? "-")} to ${escapeHtml(report.barrier_history?.summary?.end_date ?? "-")}</div>
        <div class="card"><strong>Days</strong><br/>${escapeHtml(report.barrier_history?.summary?.points ?? "-")}</div>
      </div>
      ${renderBarrierHistoryChart(barrierHistory)}
      <p><a href="./details/barrier-history.json">Download barrier history JSON</a></p>
      <table>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Missing FR</th>
            <th scope="col">Missing Statements</th>
            <th scope="col">High Gap Pairs</th>
            <th scope="col">Avg Abs Gap</th>
          </tr>
        </thead>
        <tbody>${barrierHistory
          .map(
            (point) => `<tr>
            <td>${escapeHtml(point.run_date)}</td>
            <td>${escapeHtml(point.missing_french)}</td>
            <td>${escapeHtml(point.missing_statements)}</td>
            <td>${escapeHtml(point.high_accessibility_gap_pairs)}</td>
            <td>${escapeHtml(point.average_absolute_accessibility_gap ?? "-")}</td>
          </tr>`
          )
          .join("\n")}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("top-priority-issues", "Top Priority Issues")}
      <p><em>These issues are ranked using severity, traffic, service criticality, and persistence across days to highlight the most actionable government improvement priorities.</em></p>
      <div class="cards">
        <div class="card"><strong>Total Issues</strong><br/>${escapeHtml(prioritySummary.total_issues ?? "-")}</div>
        <div class="card"><strong>Recurring Issues</strong><br/>${escapeHtml(prioritySummary.recurring_issues ?? "-")}</div>
        <div class="card"><strong>Highest Priority Score</strong><br/>${escapeHtml(prioritySummary.highest_priority_score ?? "-")}</div>
      </div>
      <p><a href="./details/priority-issues.html">Open full priority issues page</a> | <a href="./details/priority-issues.json">Download priority issues JSON</a></p>
      <table>
        <thead>
          <tr>
            <th scope="col">Issue Type</th>
            <th scope="col">Service</th>
            <th scope="col">Institution</th>
            <th scope="col">Load</th>
            <th scope="col">Days</th>
            <th scope="col">Priority</th>
            <th scope="col">Issue Detail</th>
            <th scope="col">Link</th>
          </tr>
        </thead>
        <tbody>${priorityIssueRows || '<tr><td colspan="8">No prioritized issues available in this run.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("recurring-issues", "Recurring Issues")}
      <p><em>Recurring issues are present in this run and at least one prior daily run. These are stronger candidates for institutional follow-up because they have persisted over time.</em></p>
      <p><a href="./details/recurring-issues.html">Open full recurring issues page</a> | <a href="./details/recurring-issues.json">Download recurring issues JSON</a></p>
      <table>
        <thead>
          <tr>
            <th scope="col">Issue Type</th>
            <th scope="col">Service</th>
            <th scope="col">Institution</th>
            <th scope="col">First Seen</th>
            <th scope="col">Last Seen</th>
            <th scope="col">Days</th>
            <th scope="col">Recommended Action</th>
          </tr>
        </thead>
        <tbody>${recurringIssueRows || '<tr><td colspan="7">No recurring issues detected yet.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("institution-scorecards", "Institution Scorecards")}
      <p><em>Institution scorecards roll up current scan outcomes and priority issues so ownership and recurring problem clusters are easier to see.</em></p>
      <div class="cards">
        <div class="card"><strong>Institutions</strong><br/>${escapeHtml(institutionSummary.institutions ?? "-")}</div>
        <div class="card"><strong>With Priority Issues</strong><br/>${escapeHtml(institutionSummary.institutions_with_priority_issues ?? "-")}</div>
      </div>
      <p><a href="./details/institution-scorecards.html">Open full institution scorecards page</a> | <a href="./details/institution-trends.html">Open institution trends page</a> | <a href="./details/institution-scorecards.json">Download institution scorecards JSON</a></p>
      <table>
        <thead>
          <tr>
            <th scope="col">Institution</th>
            <th scope="col">URLs</th>
            <th scope="col">Mean A11y</th>
            <th scope="col">Missing FR</th>
            <th scope="col">Missing Statements</th>
            <th scope="col">Recurring Issues</th>
            <th scope="col">Top Priority Score</th>
            <th scope="col">Top Issue Type</th>
          </tr>
        </thead>
        <tbody>${institutionRows || '<tr><td colspan="8">No institution scorecards available in this run.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("theme-contexts", "Theme and Device Contexts")}
      <p><em>Context baseline is desktop light. Deltas are current context minus baseline.</em></p>
      <div class="cards">
        <div class="card"><strong>Rows With Context Data</strong><br/>${escapeHtml(contextSummary.scanned_urls_with_context_data ?? "-")}</div>
        <div class="card"><strong>Baseline</strong><br/>${escapeHtml(contextSummary.baseline_context ?? "desktop_light")}</div>
        <div class="card"><strong>Mobile Dark Perf Delta</strong><br/>${escapeHtml(contextHighlight.performance_score ?? "-")}</div>
        <div class="card"><strong>Mobile Dark A11y Delta</strong><br/>${escapeHtml(contextHighlight.accessibility_score ?? "-")}</div>
      </div>

      ${renderLighthouseContextBarChart(contextByContext)}

      <h3>Context Averages</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Context</th>
            <th scope="col">Performance</th>
            <th scope="col">Accessibility</th>
            <th scope="col">Best Practices</th>
            <th scope="col">SEO</th>
          </tr>
        </thead>
        <tbody>${contextAverageRows || '<tr><td colspan="5">No context averages available in this run.</td></tr>'}</tbody>
      </table>

      <h3>Deltas vs Desktop Light</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Context</th>
            <th scope="col">Performance Delta</th>
            <th scope="col">Accessibility Delta</th>
            <th scope="col">Best Practices Delta</th>
            <th scope="col">SEO Delta</th>
          </tr>
        </thead>
        <tbody>${contextDeltaRows || '<tr><td colspan="5">No context deltas available in this run.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("bilingual-parity", "Bilingual Parity")}
      <p><em>Average EN/FR accessibility gap is the mean absolute difference between paired EN and FR scores. A value of ${escapeHtml(paritySummary.average_absolute_accessibility_gap ?? "-")} means paired pages differ by that many points on average; it does not imply one language is always better.</em></p>
      <div class="cards">
        <div class="card"><strong>Candidate Pairs</strong><br/>${escapeHtml(paritySummary.candidate_pairs ?? "-")}</div>
        <div class="card"><strong>Complete Pairs</strong><br/>${escapeHtml(paritySummary.complete_success_pairs ?? "-")}</div>
        <div class="card"><strong>Missing FR</strong><br/>${escapeHtml(paritySummary.missing_french ?? "-")}</div>
        <div class="card"><strong>Missing EN</strong><br/>${escapeHtml(paritySummary.missing_english ?? "-")}</div>
        <div class="card"><strong>Paired via Switcher</strong><br/>${escapeHtml(paritySummary.paired_from_switcher ?? 0)}</div>
        <div class="card"><strong>Avg Perf Gap (EN/FR)</strong><br/>${escapeHtml(paritySummary.average_absolute_performance_gap ?? "-")}</div>
      </div>

      <h3>Largest Accessibility Gaps</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">A11y Scores (EN/FR)</th>
            <th scope="col">A11y Gap (EN-FR)</th>
            <th scope="col">Perf Scores (EN/FR)</th>
            <th scope="col">Perf Gap (EN-FR)</th>
            <th scope="col">Pair Links</th>
          </tr>
        </thead>
        <tbody>${parityRows || '<tr><td colspan="6">No complete EN/FR pairs with parity data in this run.</td></tr>'}</tbody>
      </table>

      <h3>Missing Counterparts</h3>
      <p><a href="./details/missing-counterparts.json">Download missing counterpart JSON</a></p>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Has EN</th>
            <th scope="col">Has FR</th>
            <th scope="col">Links</th>
          </tr>
        </thead>
        <tbody>${missingCounterpartRows || '<tr><td colspan="4">No missing language counterparts in this run.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("accessibility-statements", "Accessibility Statements")}
      <div class="cards">
        <div class="card"><strong>Detected</strong><br/>${escapeHtml(statementSummary.statements_detected ?? "-")}/${escapeHtml(statementSummary.scanned_urls ?? "-")}</div>
        <div class="card"><strong>Coverage</strong><br/>${escapeHtml(statementSummary.statement_coverage_percent ?? "-")}%</div>
        <div class="card"><strong>With Contact</strong><br/>${escapeHtml(statementSummary.with_contact_info_percent ?? "-")}%</div>
        <div class="card"><strong>With Compliance Status</strong><br/>${escapeHtml(statementSummary.with_compliance_status_percent ?? "-")}%</div>
        <div class="card"><strong>With Support Path</strong><br/>${escapeHtml(statementSummary.with_alternative_support_percent ?? "-")}%</div>
        <div class="card"><strong>With Freshness Marker</strong><br/>${escapeHtml(statementSummary.with_freshness_marker_percent ?? "-")}%</div>
      </div>

      <h3>Missing Statement Examples</h3>
      <p><a href="./details/missing-statements.json">Download missing statement JSON</a> | <a href="./details/detected-statements.json">Download detected statement JSON</a></p>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Lang</th>
            <th scope="col">Tier</th>
            <th scope="col">URL</th>
          </tr>
        </thead>
        <tbody>${missingStatementRows || '<tr><td colspan="4">No missing accessibility statements detected in this run.</td></tr>'}</tbody>
      </table>
      ${missingStatementOverflowCount > 0 ? `<p>${escapeHtml(missingStatementOverflowCount)} additional rows available in <a href="./details/missing-statements.json">missing-statements.json</a>.</p>` : ""}

      <h3>Detected Statement Examples</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Lang</th>
            <th scope="col">URL</th>
            <th scope="col">Detected Link</th>
          </tr>
        </thead>
        <tbody>${detectedStatementRows || '<tr><td colspan="4">No detected accessibility statements in this run.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("platform-signals", "Platform Signals")}
      <div class="cards">
        <div class="card"><strong>Known CMS</strong><br/>${escapeHtml(platformSummary.known_cms_count ?? "-")}/${escapeHtml(platformSummary.scanned_urls ?? "-")}</div>
        <div class="card"><strong>Known CMS %</strong><br/>${escapeHtml(platformSummary.known_cms_percent ?? "-")}%</div>
        <div class="card"><strong>Known Design System</strong><br/>${escapeHtml(platformSummary.known_design_system_count ?? "-")}</div>
        <div class="card"><strong>Known Design System %</strong><br/>${escapeHtml(platformSummary.known_design_system_percent ?? "-")}%</div>
      </div>

      <h3>Top CMS Distribution</h3>
      <p><a href="./details/cms-buckets.json">Download CMS bucket JSON</a></p>
      <table>
        <thead>
          <tr>
            <th scope="col">CMS</th>
            <th scope="col">Count</th>
            <th scope="col">URL Samples</th>
          </tr>
        </thead>
        <tbody>${cmsRows || '<tr><td colspan="3">No CMS signals available in this run.</td></tr>'}</tbody>
      </table>

      <details>
        <summary>Show CMS URL References</summary>
        ${cmsUrlExamples
          .slice(0, 8)
          .map(
            (entry) =>
              `<p><strong>${escapeHtml(entry.cms)}</strong>: ${entry.pages
                .slice(0, 10)
                .map((page) => `<a href="${escapeHtml(page.canonical_url)}">${escapeHtml(page.language.toUpperCase())} ${escapeHtml(page.service_name || "URL")}</a>`)
                .join(" | ")}</p>`
          )
          .join("\n")}
      </details>
    </section>

    <section>
      ${sectionH2("cohort-quality", "Cohort Quality and Provenance")}
      <div class="cards">
        <div class="card"><strong>Avg Source Confidence</strong><br/>${escapeHtml(cohortSummary.source_confidence_average ?? "-")}</div>
        <div class="card"><strong>Multi-Source URLs</strong><br/>${escapeHtml(cohortSummary.multi_source_urls ?? "-")}</div>
        <div class="card"><strong>Multi-Source Share</strong><br/>${escapeHtml(cohortSummary.multi_source_percent ?? "-")}%</div>
        <div class="card"><strong>Discovered-Only Share</strong><br/>${escapeHtml(cohortSummary.discovered_only_percent ?? "-")}%</div>
        <div class="card"><strong>With Recent Signal</strong><br/>${escapeHtml(cohortSummary.with_recent_signal_percent ?? "-")}%</div>
        <div class="card"><strong>With Traffic Data</strong><br/>${escapeHtml(cohortSummary.with_traffic_data_percent ?? "-")}%</div>
      </div>
      ${
        cohortWarnings.length > 0
          ? `<p><strong>Warnings:</strong> ${escapeHtml(cohortWarnings.join(" | "))}</p>`
          : "<p><em>No cohort quality warnings triggered by current thresholds.</em></p>"
      }

      <h3>Source Lineage Distribution</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Lineage</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>${lineageRows || '<tr><td colspan="2">No lineage data available in this run.</td></tr>'}</tbody>
      </table>

      <h3>Provenance Examples</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Lang</th>
            <th scope="col">Source Lineage</th>
            <th scope="col">Confidence</th>
            <th scope="col">Confidence Label</th>
            <th scope="col">Freshness Signal</th>
          </tr>
        </thead>
        <tbody>${provenanceTableRows || '<tr><td colspan="6">No provenance examples available in this run.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      ${sectionH2("directional-impact", "Directional Impact Model")}
      <p><em>${escapeHtml(report.impact_model?.note || "Directional estimate only.")}</em></p>
      <p>Formula: directional affected load = page load count x blended severity weight / 100 x statement multiplier. Statement multiplier is higher when no accessibility statement is detected.</p>
      <div class="cards">
        <div class="card"><strong>Total Load</strong><br/>${escapeHtml(impactSummary.total_page_load_count ?? "-")}</div>
        <div class="card"><strong>Directional Affected Load</strong><br/>${escapeHtml(impactSummary.directional_affected_load_estimate ?? "-")}</div>
        <div class="card"><strong>Affected Share</strong><br/>${escapeHtml(impactSummary.directional_affected_share_percent ?? "-")}%</div>
      </div>

      <h3>Top Directional Impact URLs</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Lang</th>
            <th scope="col">Load</th>
            <th scope="col">Severity Weight</th>
            <th scope="col">Directional Affected Load</th>
          </tr>
        </thead>
        <tbody>${impactRows || '<tr><td colspan="5">No directional impact rows available in this run.</td></tr>'}</tbody>
      </table>

      <h3>By Tier</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Tier</th>
            <th scope="col">URLs</th>
            <th scope="col">Page Load</th>
            <th scope="col">Directional Affected</th>
            <th scope="col">Share %</th>
          </tr>
        </thead>
        <tbody>
          ${(report.impact_model?.by_tier || [])
            .map(
              (row) => `<tr>
            <td>${escapeHtml(row.tier)}</td>
            <td>${escapeHtml(row.scanned_urls)}</td>
            <td>${escapeHtml(row.page_load_count)}</td>
            <td>${escapeHtml(row.directional_affected_load_estimate)}</td>
            <td>${escapeHtml(row.affected_share_percent ?? "-")}</td>
          </tr>`
            )
            .join("\n") || '<tr><td colspan="5">No tier impact data available.</td></tr>'}
        </tbody>
      </table>
    </section>

    <section>
      ${sectionH2("benchmark-summary", "Benchmark Summary")}
      <div class="cards">
        <div class="card"><strong>Performance</strong><br/>${escapeHtml(report.benchmark_summary.means.performance_score ?? "-")}</div>
        <div class="card"><strong>Accessibility</strong><br/>${escapeHtml(report.benchmark_summary.means.accessibility_score ?? "-")}</div>
        <div class="card"><strong>Best Practices</strong><br/>${escapeHtml(report.benchmark_summary.means.best_practices_score ?? "-")}</div>
        <div class="card"><strong>SEO</strong><br/>${escapeHtml(report.benchmark_summary.means.seo_score ?? "-")}</div>
      </div>
    </section>

    <section>
      ${sectionH2("top-urls", "Top URLs")}
      <p>Showing first 12 rows by default for faster initial rendering.</p>
      <table id="top-urls-table" class="sortable-table">
        <thead>
          <tr>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="0" data-sort-type="text">Service</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="1" data-sort-type="text">URL</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="2" data-sort-type="text">Lang</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="3" data-sort-type="text">Status</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="4" data-sort-type="text">Statement</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="5" data-sort-type="text">CMS</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="6" data-sort-type="text">Design System</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="7" data-sort-type="number">Load</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="8" data-sort-type="number">Perf</button></th>
            <th scope="col"><button type="button" class="sort-button" data-sort-table="top-urls-table" data-sort-index="9" data-sort-type="number">A11y</button></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${topUrlsOverflowCount > 0 ? `<p>${escapeHtml(topUrlsOverflowCount)} additional rows available in <a href="./report.json">report.json</a>.</p>` : ""}
    </section>
  </main>
  <script>
    (() => {
      const buttons = document.querySelectorAll('.sort-button');
      for (const button of buttons) {
        button.addEventListener('click', () => {
          const table = document.getElementById(button.dataset.sortTable);
          if (!table) return;
          const tbody = table.querySelector('tbody');
          if (!tbody) return;
          const index = Number(button.dataset.sortIndex || 0);
          const type = button.dataset.sortType || 'text';
          const currentDir = button.getAttribute('data-sort-dir') === 'asc' ? 'asc' : 'desc';
          const nextDir = currentDir === 'asc' ? 'desc' : 'asc';

          const rows = [...tbody.querySelectorAll('tr')];
          rows.sort((a, b) => {
            const aText = (a.children[index]?.innerText || '').trim();
            const bText = (b.children[index]?.innerText || '').trim();
            if (type === 'number') {
              const aNum = Number.parseFloat(aText.replace(/[^\d.-]/g, '')) || 0;
              const bNum = Number.parseFloat(bText.replace(/[^\d.-]/g, '')) || 0;
              return nextDir === 'asc' ? aNum - bNum : bNum - aNum;
            }
            return nextDir === 'asc'
              ? aText.localeCompare(bText)
              : bText.localeCompare(aText);
          });

          button.setAttribute('data-sort-dir', nextDir);
          rows.forEach((row) => tbody.appendChild(row));
        });
      }
    })();
  </script>
  <script>
    (function () {
      var THEME_KEY = 'cap-preferred-theme';
      var html = document.documentElement;
      var toggle = document.getElementById('theme-toggle');
      function applyTheme(t) {
        html.setAttribute('data-theme', t);
        if (toggle) {
          toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          toggle.textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
        }
      }
      var stored = localStorage.getItem(THEME_KEY);
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(stored || (prefersDark ? 'dark' : 'light'));
      if (toggle) {
        toggle.addEventListener('click', function () {
          var c = html.getAttribute('data-theme');
          var n = c === 'dark' ? 'light' : 'dark';
          localStorage.setItem(THEME_KEY, n);
          applyTheme(n);
        });
      }
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) {
        mq.addEventListener('change', function (e) {
          if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
        });
      }
    })();
  </script>
</body>
</html>`;
}

export function renderDashboardPage(report) {
  const safeDate = escapeHtml(report.run_date);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0; url=../" />
  <title>Daily CAP Reports</title>
  <link rel="stylesheet" href="./assets/report.css" />
</head>
<body>
  <main>
    <p>This page has moved. <a href="../">View the Daily CAP home page</a>.</p>
    <p>Or go directly to the <a href="./daily/${safeDate}/index.html">latest report (${safeDate})</a>.</p>
  </main>
</body>
</html>`;
}

export function renderHomePage(report, recentReports = [], archivedDates = []) {
  const means = report.benchmark_summary?.means || {};
  const safeDate = escapeHtml(report.run_date);
  const safeRunId = escapeHtml(report.run_id || report.run_date);

  const recentItems = recentReports
    .slice(0, 10)
    .map((r) => {
      const d = escapeHtml(r.run_date);
      const id = escapeHtml(r.run_id || r.run_date);
      return `<li><a href="./reports/daily/${d}/index.html">${d}</a> <span class="run-id">(${id})</span></li>`;
    })
    .join("\n        ");

  const archiveItems = archivedDates
    .map((d) => {
      const safe = escapeHtml(d);
      return `<li><a href="./reports/archive/${safe}.zip">${safe} (archived)</a></li>`;
    })
    .join("\n        ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Daily CAP</title>
  <link rel="stylesheet" href="./reports/assets/report.css" />
  <script>(function(){var s=localStorage.getItem('cap-preferred-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.setAttribute('data-theme',s||(d?'dark':'light'));})();</script>
</head>
<body>
  <header>
    <div class="nav"><strong>Daily CAP</strong></div>
    <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">Dark mode</button>
  </header>
  <main>
    <h1>Canada.ca Website Quality Dashboard</h1>
    <p>Daily automated accessibility and performance scans of the top 100 most-visited Canada.ca URLs, powered by Google Lighthouse and axe-core.</p>
    <p>This dashboard uses <a href="https://www.canada.ca/en/analytics/recent-activity.html">Canada.ca recent activity data</a> (web traffic and top viewed content for the last 30 days) to identify the most-visited government URLs and measures their quality daily. Each scan covers:</p>
    <ul>
      <li><strong>Accessibility</strong> &mdash; WCAG compliance measured by Lighthouse and axe-core (0&ndash;100, higher is better)</li>
      <li><strong>Performance</strong> &mdash; Page load speed including Core Web Vitals (0&ndash;100, higher is better)</li>
      <li><strong>Best Practices</strong> &mdash; Modern web development standards (0&ndash;100, higher is better)</li>
      <li><strong>SEO</strong> &mdash; Search engine optimization fundamentals (0&ndash;100, higher is better)</li>
    </ul>
    <p>Scans run daily. Click any report date below to see detailed per-URL findings, accessibility patterns, and trend analysis. <a href="https://github.com/mgifford/daily-cap">View the source code on GitHub</a>.</p>
    <p><em>This is not a Government of Canada program. Results are automated signals, not legal compliance determinations.</em></p>

    <section>
      ${sectionH2("latest-scores", `Latest Scores (${safeDate})`)}
      <div class="cards">
        <div class="card"><strong>Performance</strong><br/>${escapeHtml(means.performance_score ?? "-")}</div>
        <div class="card"><strong>Accessibility</strong><br/>${escapeHtml(means.accessibility_score ?? "-")}</div>
        <div class="card"><strong>Best Practices</strong><br/>${escapeHtml(means.best_practices_score ?? "-")}</div>
        <div class="card"><strong>SEO</strong><br/>${escapeHtml(means.seo_score ?? "-")}</div>
      </div>
      <p><a href="./reports/daily/${safeDate}/index.html">Open latest report &#8594;</a></p>
    </section>

    <section>
      ${sectionH2("recent-reports", "Recent Reports")}
      ${recentItems.length > 0 ? `<ul class="report-list">
        ${recentItems}
      </ul>` : "<p>No reports available yet.</p>"}
      ${archiveItems.length > 0 ? `
      ${sectionH2("archived-reports", "Archived Reports")}
      <p>Reports older than 14 days are zipped for download.</p>
      <ul class="report-list">
        ${archiveItems}
      </ul>` : ""}
    </section>

    <section>
      ${sectionH2("about", "About Daily CAP")}
      <p>Daily CAP benchmarks the quality and accessibility of Canadian federal digital service entry points using automated scanning. Results are directional benchmark signals, not legal compliance determinations or manual accessibility audits.</p>
      <ul>
        <li>Daily automated scans with Lighthouse</li>
        <li>Bilingual (English/French) analysis and parity detection</li>
        <li>Performance, accessibility, and SEO metrics</li>
        <li>Accessibility statement detection</li>
        <li>Service-pattern and directional impact analysis</li>
        <li>Canadian-focused data sources (recent activity, top tasks, curated endpoints)</li>
      </ul>
    </section>
  </main>
  <footer>
    <p><a href="https://github.com/mgifford/daily-cap">GitHub</a></p>
  </footer>
  <script>
    (function () {
      var THEME_KEY = 'cap-preferred-theme';
      var html = document.documentElement;
      var toggle = document.getElementById('theme-toggle');
      function applyTheme(t) {
        html.setAttribute('data-theme', t);
        if (toggle) {
          toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          toggle.textContent = t === 'dark' ? 'Light mode' : 'Dark mode';
        }
      }
      var stored = localStorage.getItem(THEME_KEY);
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyTheme(stored || (prefersDark ? 'dark' : 'light'));
      if (toggle) {
        toggle.addEventListener('click', function () {
          var c = html.getAttribute('data-theme');
          var n = c === 'dark' ? 'light' : 'dark';
          localStorage.setItem(THEME_KEY, n);
          applyTheme(n);
        });
      }
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) {
        mq.addEventListener('change', function (e) {
          if (!localStorage.getItem(THEME_KEY)) applyTheme(e.matches ? 'dark' : 'light');
        });
      }
    })();
  </script>
</body>
</html>`;
}
