function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

export function renderDailyReportPage(report) {
  const paritySummary = report.bilingual_parity?.summary || {};
  const largestGaps = report.bilingual_parity?.highlights?.largest_accessibility_gaps || [];
  const statementSummary = report.accessibility_statements?.summary || {};
  const statementGaps = report.accessibility_statements?.missing_statement_examples || [];
  const platformSummary = report.platform_signals?.summary || {};
  const cmsDist = report.platform_signals?.distributions?.cms || [];
  const impactSummary = report.impact_model?.summary || {};
  const impactTop = report.impact_model?.top_directional_impact_urls || [];
  const trend = report.trend_analysis || {};
  const trendMetrics = trend.metrics || [];
  const trendRegressions = trend.regressions || [];

  const topUrlsPreview = report.top_urls.slice(0, 12);
  const topUrlsOverflowCount = Math.max(0, report.top_urls.length - 12);
  const rows = renderTopUrlRows(topUrlsPreview);

  const parityRows = largestGaps
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td>${escapeHtml(row.accessibility_gap ?? "-")}</td>
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

  const cmsRows = cmsDist
    .slice(0, 8)
    .map((row) => {
      return `
      <tr>
        <td>${escapeHtml(row.key)}</td>
        <td>${escapeHtml(row.count)}</td>
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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Daily CAP Report - ${escapeHtml(report.run_date)}</title>
  <link rel="stylesheet" href="../../assets/report.css" />
</head>
<body>
  <header>
    <div class="nav"><a href="../../index.html">← Back to Reports</a> | <a href="../../../">Home</a></div>
  </header>
  <main>
    <h1>Daily CAP Report</h1>
    <p>Date: ${escapeHtml(report.run_date)} | Mode: ${escapeHtml(report.scan_mode)}</p>
    <p><em>Daily CAP is an independent analytics project and is not a Government of Canada program.</em></p>
    <p><a href="./report.json">Download full report JSON</a></p>

    <section>
      <h2>Overview</h2>
      <div class="cards">
        <div class="card"><strong>Total</strong><br/>${escapeHtml(report.scan_summary.total)}</div>
        <div class="card"><strong>Succeeded</strong><br/>${escapeHtml(report.scan_summary.succeeded)}</div>
        <div class="card"><strong>Failed</strong><br/>${escapeHtml(report.scan_summary.failed)}</div>
        <div class="card"><strong>Avg A11y Gap (EN/FR)</strong><br/>${escapeHtml(paritySummary.average_absolute_accessibility_gap ?? "-")}</div>
      </div>
    </section>

    <section>
      <h2>Trend Comparison</h2>
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
      <h2>Bilingual Parity</h2>
      <div class="cards">
        <div class="card"><strong>Candidate Pairs</strong><br/>${escapeHtml(paritySummary.candidate_pairs ?? "-")}</div>
        <div class="card"><strong>Complete Pairs</strong><br/>${escapeHtml(paritySummary.complete_success_pairs ?? "-")}</div>
        <div class="card"><strong>Missing FR</strong><br/>${escapeHtml(paritySummary.missing_french ?? "-")}</div>
        <div class="card"><strong>Missing EN</strong><br/>${escapeHtml(paritySummary.missing_english ?? "-")}</div>
        <div class="card"><strong>Avg Perf Gap (EN/FR)</strong><br/>${escapeHtml(paritySummary.average_absolute_performance_gap ?? "-")}</div>
      </div>

      <h3>Largest Accessibility Gaps</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">A11y Gap (EN-FR)</th>
            <th scope="col">Perf Gap (EN-FR)</th>
            <th scope="col">Pair Links</th>
          </tr>
        </thead>
        <tbody>${parityRows || '<tr><td colspan="4">No complete EN/FR pairs with parity data in this run.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>Accessibility Statements</h2>
      <div class="cards">
        <div class="card"><strong>Detected</strong><br/>${escapeHtml(statementSummary.statements_detected ?? "-")}/${escapeHtml(statementSummary.scanned_urls ?? "-")}</div>
        <div class="card"><strong>Coverage</strong><br/>${escapeHtml(statementSummary.statement_coverage_percent ?? "-")}%</div>
        <div class="card"><strong>With Contact</strong><br/>${escapeHtml(statementSummary.with_contact_info_percent ?? "-")}%</div>
        <div class="card"><strong>With Compliance Status</strong><br/>${escapeHtml(statementSummary.with_compliance_status_percent ?? "-")}%</div>
        <div class="card"><strong>With Support Path</strong><br/>${escapeHtml(statementSummary.with_alternative_support_percent ?? "-")}%</div>
        <div class="card"><strong>With Freshness Marker</strong><br/>${escapeHtml(statementSummary.with_freshness_marker_percent ?? "-")}%</div>
      </div>

      <h3>Missing Statement Examples</h3>
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
      ${missingStatementOverflowCount > 0 ? `<p>${escapeHtml(missingStatementOverflowCount)} additional rows available in <a href="./report.json">report.json</a>.</p>` : ""}
    </section>

    <section>
      <h2>Platform Signals</h2>
      <div class="cards">
        <div class="card"><strong>Known CMS</strong><br/>${escapeHtml(platformSummary.known_cms_count ?? "-")}/${escapeHtml(platformSummary.scanned_urls ?? "-")}</div>
        <div class="card"><strong>Known CMS %</strong><br/>${escapeHtml(platformSummary.known_cms_percent ?? "-")}%</div>
        <div class="card"><strong>Known Design System</strong><br/>${escapeHtml(platformSummary.known_design_system_count ?? "-")}</div>
        <div class="card"><strong>Known Design System %</strong><br/>${escapeHtml(platformSummary.known_design_system_percent ?? "-")}%</div>
      </div>

      <h3>Top CMS Distribution</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">CMS</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>${cmsRows || '<tr><td colspan="2">No CMS signals available in this run.</td></tr>'}</tbody>
      </table>
    </section>

    <section>
      <h2>Directional Impact Model</h2>
      <p><em>${escapeHtml(report.impact_model?.note || "Directional estimate only.")}</em></p>
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
    </section>

    <section>
      <h2>Benchmark Summary</h2>
      <div class="cards">
        <div class="card"><strong>Performance</strong><br/>${escapeHtml(report.benchmark_summary.means.performance_score ?? "-")}</div>
        <div class="card"><strong>Accessibility</strong><br/>${escapeHtml(report.benchmark_summary.means.accessibility_score ?? "-")}</div>
        <div class="card"><strong>Best Practices</strong><br/>${escapeHtml(report.benchmark_summary.means.best_practices_score ?? "-")}</div>
        <div class="card"><strong>SEO</strong><br/>${escapeHtml(report.benchmark_summary.means.seo_score ?? "-")}</div>
      </div>
    </section>

    <section>
      <h2>Top URLs</h2>
      <p>Showing first 12 rows by default for faster initial rendering.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">URL</th>
            <th scope="col">Lang</th>
            <th scope="col">Status</th>
            <th scope="col">Statement</th>
            <th scope="col">CMS</th>
            <th scope="col">Design System</th>
            <th scope="col">Load</th>
            <th scope="col">Perf</th>
            <th scope="col">A11y</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${topUrlsOverflowCount > 0 ? `<p>${escapeHtml(topUrlsOverflowCount)} additional rows available in <a href="./report.json">report.json</a>.</p>` : ""}
    </section>
  </main>
</body>
</html>`;
}

export function renderDashboardPage(report) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Daily CAP Reports</title>
  <link rel="stylesheet" href="./assets/report.css" />
</head>
<body>
  <div class="nav"><a href="../">← Back to Home</a></div>
  <h1>Daily CAP Reports</h1>
  <p>Latest run: ${escapeHtml(report.run_date)}</p>
  <p><em>Daily CAP is an independent analytics project and is not a Government of Canada program.</em></p>
  <p><a href="./daily/${escapeHtml(report.run_date)}/index.html">Open latest report</a></p>
</body>
</html>`;
}
