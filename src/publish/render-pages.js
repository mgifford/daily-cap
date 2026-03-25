function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderDailyReportPage(report) {
  const paritySummary = report.bilingual_parity?.summary || {};
  const largestGaps = report.bilingual_parity?.highlights?.largest_accessibility_gaps || [];

  const rows = report.top_urls
    .map((row) => {
      const lighthouse = row.lighthouse || {};
      return `
      <tr>
        <td>${escapeHtml(row.service_name)}</td>
        <td><a href="${escapeHtml(row.canonical_url)}">${escapeHtml(row.canonical_url)}</a></td>
        <td>${escapeHtml(row.language.toUpperCase())}</td>
        <td>${escapeHtml(row.scan_status)}</td>
        <td>${escapeHtml(lighthouse.performance_score ?? "-")}</td>
        <td>${escapeHtml(lighthouse.accessibility_score ?? "-")}</td>
      </tr>`;
    })
    .join("\n");

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

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Daily CAP Report - ${escapeHtml(report.run_date)}</title>
  <style>
    :root { --bg: #f8faf8; --fg: #0d1b12; --card: #ffffff; --line: #d7e2d8; --accent: #1d6b42; }
    body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: radial-gradient(circle at top, #e8f4ea, var(--bg) 40%); color: var(--fg); }
    header { background: white; border-bottom: 1px solid var(--line); padding: 1rem; }
    main { max-width: 1100px; margin: 0 auto; padding: 2rem 1rem 3rem; }
    h1, h2 { letter-spacing: 0.01em; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.75rem; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 0.6rem; padding: 0.8rem; }
    table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); }
    th, td { padding: 0.55rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
    th { background: #edf4ee; }
    a { color: var(--accent); }
    .nav { font-size: 0.9rem; }
  </style>
</head>
<body>
  <header>
    <div class="nav"><a href="../index.html">← Back to Reports</a> | <a href="../../">Home</a></div>
  </header>
  <main>
    <h1>Daily CAP Report</h1>
    <p>Date: ${escapeHtml(report.run_date)} | Mode: ${escapeHtml(report.scan_mode)}</p>
    <p><em>Daily CAP is an independent analytics project and is not a Government of Canada program.</em></p>

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
      <table>
        <thead>
          <tr>
            <th scope="col">Service</th>
            <th scope="col">URL</th>
            <th scope="col">Lang</th>
            <th scope="col">Status</th>
            <th scope="col">Perf</th>
            <th scope="col">A11y</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
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
  <style>
    body { font-family: Georgia, "Times New Roman", serif; margin: 2rem auto; max-width: 900px; padding: 0 1rem; }
    a { color: #1d6b42; }
    .nav { font-size: 0.9rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="nav"><a href="../../">← Back to Home</a></div>
  <h1>Daily CAP Reports</h1>
  <p>Latest run: ${escapeHtml(report.run_date)}</p>
  <p><em>Daily CAP is an independent analytics project and is not a Government of Canada program.</em></p>
  <p><a href="./daily/${escapeHtml(report.run_date)}/index.html">Open latest report</a></p>
</body>
</html>`;
}
