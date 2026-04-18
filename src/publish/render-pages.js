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

function renderPageFooter() {
  return `  <footer>
    <p>Daily CAP <span aria-hidden="true">&mdash;</span> <a href="https://github.com/mgifford/daily-cap">View source on GitHub</a> <span aria-hidden="true">&mdash;</span> <a href="https://github.com/mgifford/daily-cap/issues">Report an issue</a> <span aria-hidden="true">&mdash;</span> Contributions welcome</p>
  </footer>`;
}

function sectionH2(id, text) {
  const safeText = escapeHtml(text);
  const safeAnchor = escapeHtml(id);
  return `<h2 id="${safeAnchor}" tabindex="-1">${safeText} <a href="#${safeAnchor}" class="anchor-link" aria-label="Link to &quot;${safeText}&quot; section"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></a></h2>`;
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

function renderLighthouseContextHistoryChart(historyPoints) {
  if (!historyPoints || !historyPoints.length) {
    return "<p>No Lighthouse history data available yet.</p>";
  }

  const contexts = [
    { key: "desktop_light", label: "Desktop Light", color: "#235d8b", dash: "" },
    { key: "desktop_dark", label: "Desktop Dark", color: "#235d8b", dash: "6,3" },
    { key: "mobile_light", label: "Mobile Light", color: "#b5402d", dash: "" },
    { key: "mobile_dark", label: "Mobile Dark", color: "#b5402d", dash: "6,3" }
  ];

  const metrics = [
    { key: "performance_score", label: "Performance" },
    { key: "accessibility_score", label: "Accessibility" },
    { key: "best_practices_score", label: "Best Practices" },
    { key: "seo_score", label: "SEO" }
  ];

  const W = 860;
  const H = 200;
  const padL = 40;
  const padR = 148;
  const padT = 24;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const maxVal = 100;
  const n = historyPoints.length;
  const stepX = n > 1 ? plotW / (n - 1) : 0;

  function pointsForContextMetric(ctxKey, metricKey) {
    return historyPoints.map((point, i) => {
      const val = point[ctxKey]?.[metricKey];
      if (typeof val !== "number") return null;
      const x = padL + stepX * i;
      const y = padT + plotH - (plotH * val) / maxVal;
      return { x, y, val };
    });
  }

  function linePath(pts) {
    const segments = [];
    let inLine = false;
    for (const pt of pts) {
      if (!pt) { inLine = false; continue; }
      segments.push(`${inLine ? "L" : "M"}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`);
      inLine = true;
    }
    return segments.join(" ");
  }

  function dotMarkers(pts, color) {
    return pts
      .filter(Boolean)
      .map((pt) => `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3" fill="${escapeHtml(color)}" />`)
      .join("");
  }

  const dateLabels = historyPoints
    .map((point, i) => {
      const x = padL + stepX * i;
      return `<text x="${x.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10">${escapeHtml(point.run_date.slice(5))}</text>`;
    })
    .join("");

  const yTicks = [0, 25, 50, 75, 100]
    .map((val) => {
      const y = padT + plotH - (plotH * val) / maxVal;
      return `<line x1="${padL}" y1="${y}" x2="${padL + plotW}" y2="${y}" stroke="#d7e2d8" stroke-width="1" /><text x="${padL - 5}" y="${y + 4}" text-anchor="end" font-size="10">${val}</text>`;
    })
    .join("\n");

  const legend = contexts
    .map((ctx, i) => {
      const lx = padL + plotW + 12;
      const ly = padT + 6 + i * 22;
      const dash = ctx.dash ? ` stroke-dasharray="${escapeHtml(ctx.dash)}"` : "";
      return `<line x1="${lx}" y1="${ly + 6}" x2="${lx + 20}" y2="${ly + 6}" stroke="${escapeHtml(ctx.color)}" stroke-width="2"${dash} /><text x="${lx + 24}" y="${ly + 10}" font-size="11">${escapeHtml(ctx.label)}</text>`;
    })
    .join("\n");

  const charts = metrics
    .map((metric) => {
      const lines = contexts
        .map((ctx) => {
          const pts = pointsForContextMetric(ctx.key, metric.key);
          const path = linePath(pts);
          const dots = dotMarkers(pts, ctx.color);
          const dash = ctx.dash ? ` stroke-dasharray="${escapeHtml(ctx.dash)}"` : "";
          return path ? `<path d="${path}" fill="none" stroke="${escapeHtml(ctx.color)}" stroke-width="2"${dash} />${dots}` : "";
        })
        .join("\n");

      const chartId = `lh-hist-${escapeHtml(metric.key)}`;
      return `<figure>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${chartId}-title ${chartId}-desc" class="history-chart">
      <title id="${chartId}-title">Lighthouse ${escapeHtml(metric.label)} over time by context</title>
      <desc id="${chartId}-desc">Line chart showing daily mean Lighthouse ${escapeHtml(metric.label)} score (0–100) across four scan contexts: desktop light, desktop dark, mobile light, mobile dark.</desc>
      <line x1="${padL}" y1="${padT + plotH}" x2="${padL + plotW}" y2="${padT + plotH}" stroke="#7f9685" stroke-width="1.5" />
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#7f9685" stroke-width="1.5" />
      ${yTicks}
      ${lines}
      ${dateLabels}
      ${legend}
    </svg>
    <figcaption>Lighthouse ${escapeHtml(metric.label)} (0&#8211;100) over time. Blue&#160;=&#160;Desktop, Red&#160;=&#160;Mobile; solid&#160;=&#160;light mode, dashed&#160;=&#160;dark mode.</figcaption>
  </figure>`;
    })
    .join("\n");

  return charts;
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
    <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Switch to dark mode"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Moon</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
  </header>
  <main>
    <h1>${escapeHtml(heading)}</h1>
    <p><em>${escapeHtml(intro)}</em></p>
    ${body}
  </main>
  ${renderPageFooter()}
  <script>
    (function () {
      var THEME_KEY = 'cap-preferred-theme';
      var html = document.documentElement;
      var toggle = document.getElementById('theme-toggle');
      function applyTheme(t) {
        html.setAttribute('data-theme', t);
        if (toggle) {
          var sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Sun</title><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
          var moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Moon</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
          toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          toggle.innerHTML = t === 'dark' ? sunSvg : moonSvg;
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
    .map((item) => {
      const trendLabel = item.parity_trend || "—";
      const trendArrow =
        trendLabel === "worsening" ? "↑ worsening" :
        trendLabel === "improving" ? "↓ improving" :
        trendLabel === "stable" ? "→ stable" :
        "—";
      return `
      <tr>
        <td><a href="./institutions/${escapeHtml(item.slug)}.html">${escapeHtml(item.institution)}</a></td>
        <td>${escapeHtml(item.days_tracked)}</td>
        <td>${escapeHtml(item.latest?.mean_accessibility_score ?? "-")}</td>
        <td>${escapeHtml(item.latest?.mean_abs_accessibility_gap ?? "-")}</td>
        <td>${escapeHtml(item.latest?.missing_french_count ?? "-")}</td>
        <td>${escapeHtml(item.latest?.missing_statement_count ?? "-")}</td>
        <td>${escapeHtml(item.latest?.high_gap_pair_count ?? "-")}</td>
        <td>${escapeHtml(trendArrow)}</td>
      </tr>`;
    })
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
          <th scope="col">Latest Mean A11y Gap</th>
          <th scope="col">Latest Missing FR</th>
          <th scope="col">Latest Missing Statements</th>
          <th scope="col">Latest High Gap Pairs</th>
          <th scope="col">Parity Trend</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="8">No institution trend data available.</td></tr>'}</tbody>
    </table>`
  });
}

export function renderInstitutionTrendPage(report, institutionTrend) {
  const points = institutionTrend.points || [];
  const latest = institutionTrend.latest || {};
  const trendLabel = institutionTrend.parity_trend || "insufficient_data";
  const trendArrow =
    trendLabel === "worsening" ? "↑ worsening" :
    trendLabel === "improving" ? "↓ improving" :
    trendLabel === "stable" ? "→ stable" :
    "Insufficient data";

  // Get institution-specific insights
  const instName = institutionTrend.institution;
  const axeInsights = (report.institution_axe_insights?.by_institution || []).find(
    (i) => i.institution === instName
  ) || {};
  const lighthouseInsights = (report.institution_lighthouse_insights?.by_institution || []).find(
    (i) => i.institution === instName
  ) || {};

  // Render axe violations table
  const axeRows = `
    <tr>
      <td>Critical</td>
      <td>${escapeHtml(axeInsights.critical_total_violations ?? "-")}</td>
      <td>${escapeHtml(axeInsights.critical_affected_pages ?? "-")}</td>
      <td>${escapeHtml(axeInsights.critical_average_per_page ?? "-")}</td>
    </tr>
    <tr>
      <td>Serious</td>
      <td>${escapeHtml(axeInsights.serious_total_violations ?? "-")}</td>
      <td>${escapeHtml(axeInsights.serious_affected_pages ?? "-")}</td>
      <td>${escapeHtml(axeInsights.serious_average_per_page ?? "-")}</td>
    </tr>
    <tr>
      <td>Moderate</td>
      <td>${escapeHtml(axeInsights.moderate_total_violations ?? "-")}</td>
      <td>${escapeHtml(axeInsights.moderate_affected_pages ?? "-")}</td>
      <td>${escapeHtml(axeInsights.moderate_average_per_page ?? "-")}</td>
    </tr>
    <tr>
      <td>Minor</td>
      <td>${escapeHtml(axeInsights.minor_total_violations ?? "-")}</td>
      <td>${escapeHtml(axeInsights.minor_affected_pages ?? "-")}</td>
      <td>${escapeHtml(axeInsights.minor_average_per_page ?? "-")}</td>
    </tr>
  `;

  // Render Lighthouse context scores table
  const lighthouseRows = [
    ["Desktop Light", lighthouseInsights.desktop_light],
    ["Desktop Dark", lighthouseInsights.desktop_dark],
    ["Mobile Light", lighthouseInsights.mobile_light],
    ["Mobile Dark", lighthouseInsights.mobile_dark]
  ]
    .map(
      ([context, scores]) => `
    <tr>
      <td>${escapeHtml(context)}</td>
      <td>${escapeHtml(scores?.accessibility_score ?? "-")}</td>
      <td>${escapeHtml(scores?.performance_score ?? "-")}</td>
      <td>${escapeHtml(scores?.best_practices_score ?? "-")}</td>
      <td>${escapeHtml(scores?.seo_score ?? "-")}</td>
    </tr>
  `
    )
    .join("\n");

  return renderDetailLayout({
    title: `${institutionTrend.institution} Trends - ${report.run_date}`,
    heading: `${institutionTrend.institution} Trends`,
    intro: "Daily institution-level trend view for accessibility, barriers, and performance metrics.",
    backHref: "../institution-trends.html",
    backLabel: "Back to Institution Trends",
    stylesheetHref: "../../../../assets/report.css",
    body: `<div class="cards">
      <div class="card"><strong>Days Tracked</strong><br/>${escapeHtml(institutionTrend.days_tracked)}</div>
      <div class="card"><strong>Latest Mean A11y</strong><br/>${escapeHtml(latest.mean_accessibility_score ?? "-")}</div>
      <div class="card"><strong>Latest A11y Gap</strong><br/>${escapeHtml(latest.mean_abs_accessibility_gap ?? "-")}</div>
      <div class="card"><strong>Parity Trend</strong><br/>${escapeHtml(trendArrow)}</div>
      <div class="card"><strong>Latest Missing FR</strong><br/>${escapeHtml(latest.missing_french_count ?? "-")}</div>
      <div class="card"><strong>Latest Missing Statements</strong><br/>${escapeHtml(latest.missing_statement_count ?? "-")}</div>
    </div>
    ${sectionH2("barrier-trends", "Barrier Trends")}
    ${renderMetricTrendChart(points, "mean_accessibility_score", `${institutionTrend.institution} accessibility over time`, "Line chart of daily mean accessibility score for this institution.", "#1d6b42", 100)}
    ${renderMetricTrendChart(points, "mean_abs_accessibility_gap", `${institutionTrend.institution} EN/FR accessibility gap over time`, "Line chart of daily mean absolute EN/FR accessibility score gap for this institution. Lower is better.", "#e07b00")}
    ${renderMetricTrendChart(points, "missing_french_count", `${institutionTrend.institution} missing French counterparts over time`, "Line chart of daily missing French counterpart counts for this institution.", "#b5402d")}
    ${renderMetricTrendChart(points, "missing_statement_count", `${institutionTrend.institution} missing accessibility statements over time`, "Line chart of daily missing accessibility statement counts for this institution.", "#235d8b")}
    <table>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">URLs</th>
          <th scope="col">Load</th>
          <th scope="col">Mean A11y</th>
          <th scope="col">Mean A11y Gap</th>
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
          <td>${escapeHtml(point.mean_abs_accessibility_gap ?? "-")}</td>
          <td>${escapeHtml(point.mean_performance_score ?? "-")}</td>
          <td>${escapeHtml(point.missing_french_count)}</td>
          <td>${escapeHtml(point.missing_statement_count)}</td>
          <td>${escapeHtml(point.high_gap_pair_count)}</td>
        </tr>`
        )
        .join("\n")}</tbody>
    </table>

    ${sectionH2("axe-violations", "Current Axe Violations (by Severity)")}
    <p><em>Snapshot of the most recent scan for this institution across all its services.</em></p>
    <div class="cards">
      <div class="card"><strong>Total Violations</strong><br/>${escapeHtml(axeInsights.total_violations ?? "-")}</div>
      <div class="card"><strong>Services Scanned</strong><br/>${escapeHtml(axeInsights.scanned_urls ?? "-")}</div>
      <div class="card"><strong>Services with Violations</strong><br/>${escapeHtml(axeInsights.services_with_violations?.length ?? "-")}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th scope="col">Severity</th>
          <th scope="col">Total Violations</th>
          <th scope="col">Affected Services</th>
          <th scope="col">Average per Service</th>
        </tr>
      </thead>
      <tbody>${axeRows}</tbody>
    </table>

    ${sectionH2("lighthouse-performance", "Google Lighthouse Performance (by Context)")}
    <p><em>Snapshot of the most recent Lighthouse scan results for this institution across rendering contexts.</em></p>
    <div class="cards">
      <div class="card"><strong>Services Scanned</strong><br/>${escapeHtml(lighthouseInsights.scanned_urls ?? "-")}</div>
      <div class="card"><strong>Mobile vs Desktop</strong><br/>${escapeHtml(lighthouseInsights.mobile_dark_vs_desktop_light?.accessibility_delta ?? "-")}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th scope="col">Context</th>
          <th scope="col">Accessibility</th>
          <th scope="col">Performance</th>
          <th scope="col">Best Practices</th>
          <th scope="col">SEO</th>
        </tr>
      </thead>
      <tbody>${lighthouseRows}</tbody>
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
  const topAxeIssues = report.top_axe_issues?.top_issues || [];
  const topAxeSummary = report.top_axe_issues?.summary || {};
  const barrierHistory = report.barrier_history?.points || [];
  const lighthouseHistory = report.lighthouse_history?.points || [];
  const detailPaths = report.output_paths?.details || {};
  const priorityIssues = report.priority_issues?.top_priority_issues || [];
  const recurringIssues = report.priority_issues?.recurring_issues || [];
  const prioritySummary = report.priority_issues?.summary || {};
  const institutionSummary = report.institution_scorecards?.summary || {};
  const institutionScorecards = report.institution_scorecards?.scorecards || [];
  const institutionTrendMap = new Map(
    (report.institution_trends?.institutions || []).map((item) => [item.institution, item])
  );
  const institutionGapLeaderboard = report.bilingual_parity?.by_institution || [];

  const topUrlsPreview = report.top_urls.slice(0, 12);
  const topUrlsOverflowCount = Math.max(0, report.top_urls.length - 12);
  const rows = renderTopUrlRows(topUrlsPreview);

  const missingCounterpartRows = missingCounterparts
    .slice(0, 20)
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td>${escapeHtml(row.source || "-")}</td>
        <td>${escapeHtml(row.tier || "-")}</td>
        <td>${escapeHtml(row.has_en ? "yes" : "no")}</td>
        <td>${escapeHtml(row.has_fr ? "yes" : "no")}</td>
        <td>${row.url_en ? `<a href="${escapeHtml(row.url_en)}">EN</a>` : "-"} | ${row.url_fr ? `<a href="${escapeHtml(row.url_fr)}">FR</a>` : "-"}</td>
      </tr>`;
    })
    .join("\n");
  const missingCounterpartOverflowCount = Math.max(0, missingCounterparts.length - 20);
  const scanSucceeded = report.scan_summary?.succeeded ?? 0;
  const scanTotal = report.scan_summary?.total ?? 0;
  const allScansFailed = scanTotal > 0 && scanSucceeded === 0;

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

  const axeIssueRows = topAxeIssues
    .map((issue) => {
      const samplePageRows = (issue.sample_pages || [])
        .map((page) => `<li><a href="${escapeHtml(page.canonical_url)}">${escapeHtml(page.service_name)}</a> (${escapeHtml(page.language?.toUpperCase() || "NA")}, ${escapeHtml(page.count)} occurrences)</li>`)
        .join("");
      return `
      <tr>
        <td><strong>${escapeHtml(issue.severity)}</strong></td>
        <td>${escapeHtml(issue.total_occurrences)}</td>
        <td>${escapeHtml(issue.affected_pages)}</td>
        <td>${escapeHtml(issue.average_per_page)}</td>
        <td><details><summary>View samples</summary><ul style="margin: 0.5em 0; padding-left: 1.5em;">${samplePageRows}</ul></details></td>
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
    <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Switch to dark mode"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Moon</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
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
      ${sectionH2("theme-contexts", "Google Lighthouse Performance")}
      <p><em>Lighthouse scores measure page quality across performance, accessibility, best practices, and SEO across four rendering contexts (desktop/mobile, light/dark). Charts show daily mean scores over time.</em></p>
      <div class="cards">
        <div class="card"><strong>URLs Scanned</strong><br/>${escapeHtml(contextSummary.scanned_urls_with_context_data ?? "-")}</div>
        <div class="card"><strong>Baseline</strong><br/>${escapeHtml(contextSummary.baseline_context ?? "desktop_light")}</div>
        <div class="card"><strong>Mobile Dark Perf Delta</strong><br/>${escapeHtml(contextHighlight.performance_score ?? "-")}</div>
        <div class="card"><strong>Mobile Dark A11y Delta</strong><br/>${escapeHtml(contextHighlight.accessibility_score ?? "-")}</div>
      </div>

      <h3>Scores Over Time by Context</h3>
      <p><em>Blue&#160;=&#160;Desktop, Red&#160;=&#160;Mobile; solid&#160;=&#160;light mode, dashed&#160;=&#160;dark mode.</em></p>
      ${renderLighthouseContextHistoryChart(lighthouseHistory)}

      <h3>Today&#8217;s Scores by Context</h3>
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

      <details style="margin-top: 1em;">
        <summary><strong>Mobile Dark vs Desktop Light Headline</strong></summary>
        <ul style="margin: 0.5em 0; padding-left: 1.5em;">
          <li>Performance: ${escapeHtml(contextHighlight.performance_score ?? "-")}</li>
          <li>Accessibility: ${escapeHtml(contextHighlight.accessibility_score ?? "-")}</li>
          <li>Best Practices: ${escapeHtml(contextHighlight.best_practices_score ?? "-")}</li>
          <li>SEO: ${escapeHtml(contextHighlight.seo_score ?? "-")}</li>
        </ul>
      </details>
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
      ${sectionH2("top-axe-violations", "Top Axe Accessibility Violations")}
      <p><em>Axe Core automated testing identifies the most common accessibility violations by severity. These are weighted by occurrences across all scanned pages.</em></p>
      <div class="cards">
        <div class="card"><strong>Scanned URLs</strong><br/>${escapeHtml(topAxeSummary.scanned_urls ?? "-")}</div>
        <div class="card"><strong>Total Violations</strong><br/>${escapeHtml(topAxeSummary.total_violations ?? "-")}</div>
        <div class="card"><strong>URLs with Violations</strong><br/>${escapeHtml(topAxeSummary.urls_with_violations ?? "-")}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th scope="col">Severity</th>
            <th scope="col">Total Occurrences</th>
            <th scope="col">Affected Pages</th>
            <th scope="col">Avg per Page</th>
            <th scope="col">Sample Pages</th>
          </tr>
        </thead>
        <tbody>${axeIssueRows || '<tr><td colspan="5">No axe violation data available.</td></tr>'}</tbody>
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

      <h3>Institution Bilingual Gap Leaderboard</h3>
      <p><a href="./details/bilingual-gap-leaderboard.json">Download leaderboard JSON</a></p>
      <p><em>Institutions ranked by mean absolute EN/FR accessibility score gap across their paired services. Higher values indicate greater inconsistency between language versions. Trend direction links to the institution's historical trend page when data is available.</em></p>
      <table>
        <thead>
          <tr>
            <th scope="col">Institution</th>
            <th scope="col">Paired Services</th>
            <th scope="col">Mean A11y Gap</th>
            <th scope="col">High Gap Pairs (≥10)</th>
            <th scope="col">Mean Perf Gap</th>
            <th scope="col">Trend</th>
          </tr>
        </thead>
        <tbody>${institutionGapLeaderboard.length > 0 ? institutionGapLeaderboard.map((row) => {
          const trendItem = institutionTrendMap.get(row.institution);
          const trendLabel = trendItem ? trendItem.parity_trend || "—" : "—";
          const trendArrow = trendLabel === "worsening" ? "↑ worsening" : trendLabel === "improving" ? "↓ improving" : trendLabel === "stable" ? "→ stable" : "—";
          const instCell = trendItem
            ? `<a href="./details/institutions/${escapeHtml(trendItem.slug)}.html">${escapeHtml(row.institution)}</a>`
            : escapeHtml(row.institution);
          return `
          <tr>
            <td>${instCell}</td>
            <td>${escapeHtml(row.pair_count)}</td>
            <td>${escapeHtml(row.mean_abs_accessibility_gap ?? "-")}</td>
            <td>${escapeHtml(row.high_gap_pair_count)}</td>
            <td>${escapeHtml(row.mean_abs_performance_gap ?? "-")}</td>
            <td>${escapeHtml(trendArrow)}</td>
          </tr>`;
        }).join("\n") : '<tr><td colspan="6">No institution gap data available in this run.</td></tr>'}</tbody>
      </table>

      <h3>Missing Counterparts</h3>
      <p><a href="./details/missing-counterparts.json">Download missing counterpart JSON</a></p>
      ${allScansFailed ? `<p class="warning"><strong>Warning:</strong> All scans failed this run (0 of ${escapeHtml(scanTotal)} URLs succeeded). This missing counterparts list reflects inventory structure only — it does not indicate that French pages are genuinely absent. Verify scan infrastructure before acting on these results.</p>` : ""}
      <p><em>Discovery cohort entries (source: <code>discovery</code>) are English-only navigation pages and are expected to have no French counterpart in the inventory. Other sources (recent, curated, top-tasks) should have paired EN and FR pages.</em></p>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">Source</th>
            <th scope="col">Tier</th>
            <th scope="col">Has EN</th>
            <th scope="col">Has FR</th>
            <th scope="col">Links</th>
          </tr>
        </thead>
        <tbody>${missingCounterpartRows || '<tr><td colspan="6">No missing language counterparts in this run.</td></tr>'}</tbody>
      </table>
      ${missingCounterpartOverflowCount > 0 ? `<p>${escapeHtml(missingCounterpartOverflowCount)} additional rows available in <a href="./details/missing-counterparts.json">missing-counterparts.json</a>.</p>` : ""}
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
      <p>Units: Load values are estimated page loads for this reporting run. Directional Affected Load is a weighted estimate of impacted page loads, not cumulative time spent.</p>
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
            <th scope="col">Load (estimated page loads)</th>
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
  ${renderPageFooter()}
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
          var sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Sun</title><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
          var moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Moon</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
          toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          toggle.innerHTML = t === 'dark' ? sunSvg : moonSvg;
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
  <title>Daily CAP Reports</title>
  <link rel="stylesheet" href="./assets/report.css" />
</head>
<body>
  <main>
    <h1>Daily CAP Reports</h1>
    <p>This page has moved. <a href="../" aria-label="View the Daily CAP home page">View the Daily CAP home page</a>.</p>
    <p>Or go directly to the <a href="./daily/${safeDate}/index.html" aria-label="latest report (${safeDate})">latest report (${safeDate})</a>.</p>
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
    <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Switch to dark mode"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Moon</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
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

    <section>
      ${sectionH2("report-archive", "Report Archive")}
      <p>Reports older than 14 days are available as downloadable zip archives containing the full HTML report, JSON data, and CSV findings.</p>
      <p><a href="./reports/archive/index.html">Browse report archives <span aria-hidden="true">&#8594;</span></a></p>
    </section>
  </main>
  ${renderPageFooter()}
  <script>
    (function () {
      var THEME_KEY = 'cap-preferred-theme';
      var html = document.documentElement;
      var toggle = document.getElementById('theme-toggle');
      function applyTheme(t) {
        html.setAttribute('data-theme', t);
        if (toggle) {
          var sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Sun</title><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
          var moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Moon</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
          toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          toggle.innerHTML = t === 'dark' ? sunSvg : moonSvg;
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

/**
 * Renders a static archive index page listing all available zip archives.
 *
 * @param {string[]} archivedDates  Sorted list of archived dates (YYYY-MM-DD)
 * @returns {string}  HTML string
 */
export function renderArchiveIndexPage(archivedDates = []) {
  const archiveItems = archivedDates
    .slice()
    .reverse()
    .map((d) => {
      const safe = escapeHtml(d);
      return `<li><a href="./${safe}.zip">${safe}</a></li>`;
    })
    .join("\n        ");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Report Archive &mdash; Daily CAP</title>
  <link rel="stylesheet" href="../assets/report.css" />
  <script>(function(){var s=localStorage.getItem('cap-preferred-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.setAttribute('data-theme',s||(d?'dark':'light'));})();</script>
</head>
<body>
  <header>
    <div class="nav"><a href="../../index.html">Daily CAP</a> &rsaquo; Report Archive</div>
    <button type="button" id="theme-toggle" class="theme-toggle" aria-label="Switch to dark mode"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Moon</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
  </header>
  <main>
    <h1>Report Archive</h1>
    <p>Reports older than 14 days are available as downloadable zip archives. Each archive contains the full HTML report, JSON data, and CSV findings for that date.</p>
    ${archiveItems.length > 0 ? `<ul class="report-list">
      ${archiveItems}
    </ul>` : "<p>No archives are available yet. Archives will appear here once reports are older than 14 days.</p>"}
    <p><a href="../../index.html"><span aria-hidden="true">&#8592;</span> Back to Daily CAP</a></p>
  </main>
  ${renderPageFooter()}
  <script>
    (function () {
      var THEME_KEY = 'cap-preferred-theme';
      var html = document.documentElement;
      var toggle = document.getElementById('theme-toggle');
      function applyTheme(t) {
        html.setAttribute('data-theme', t);
        if (toggle) {
          var sunSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Sun</title><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
          var moonSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="img" aria-hidden="true" focusable="false"><title>Moon</title><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
          toggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
          toggle.innerHTML = t === 'dark' ? sunSvg : moonSvg;
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
