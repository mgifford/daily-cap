import fs from "node:fs/promises";
import path from "node:path";
import { writeJsonFile, writeTextFile } from "../utils/fs.js";
import {
  renderDailyReportPage,
  renderDashboardPage,
  renderHomePage,
  renderArchiveIndexPage,
  renderPriorityIssuesPage,
  renderRecurringIssuesPage,
  renderInstitutionScorecardsPage,
  renderInstitutionTrendsIndexPage,
  renderInstitutionTrendPage
} from "./render-pages.js";
import { archiveOldReports, listArchivedDates } from "./archive-reports.js";

async function loadRecentReports(dailyDir, currentDate, limit = 10) {
  let entries;
  try {
    entries = await fs.readdir(dailyDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const dates = entries
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .filter((date) => date <= currentDate)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, limit);

  const results = [];
  for (const date of dates) {
    const reportPath = path.join(dailyDir, date, "report.json");
    try {
      const raw = await fs.readFile(reportPath, "utf8");
      const r = JSON.parse(raw);
      results.push({ run_date: r.run_date || date, run_id: r.run_id || date });
    } catch {
      results.push({ run_date: date, run_id: date });
    }
  }

  return results;
}

export async function publishReport({ report, outputRoot }) {
  const dailyDir = path.join(outputRoot, "docs", "reports", "daily", report.run_date);
  const reportsDir = path.join(outputRoot, "docs", "reports");
  const detailsDir = path.join(dailyDir, "details");

  await writeJsonFile(path.join(dailyDir, "report.json"), report);
  await writeJsonFile(
    path.join(detailsDir, "missing-counterparts.json"),
    report.bilingual_parity?.missing_counterparts || []
  );
  await writeJsonFile(
    path.join(detailsDir, "missing-statements.json"),
    report.accessibility_statements?.missing_statement_examples || []
  );
  await writeJsonFile(
    path.join(detailsDir, "detected-statements.json"),
    (report.accessibility_statements?.checks || []).filter((row) => row.statement_detected)
  );
  await writeJsonFile(
    path.join(detailsDir, "cms-buckets.json"),
    report.platform_signals?.cms_url_examples || []
  );
  await writeJsonFile(
    path.join(detailsDir, "barrier-history.json"),
    report.barrier_history || { summary: { points: 0 }, points: [] }
  );
  await writeJsonFile(
    path.join(detailsDir, "priority-issues.json"),
    report.priority_issues?.all_issues || []
  );
  await writeJsonFile(
    path.join(detailsDir, "recurring-issues.json"),
    report.priority_issues?.recurring_issues || []
  );
  await writeJsonFile(
    path.join(detailsDir, "institution-scorecards.json"),
    report.institution_scorecards?.all_scorecards || []
  );
  await writeJsonFile(
    path.join(detailsDir, "institution-trends.json"),
    report.institution_trends || { summary: { institutions: 0 }, institutions: [] }
  );
  await writeJsonFile(
    path.join(detailsDir, "bilingual-gap-leaderboard.json"),
    report.bilingual_parity?.by_institution || []
  );
  await writeTextFile(path.join(detailsDir, "priority-issues.html"), renderPriorityIssuesPage(report));
  await writeTextFile(path.join(detailsDir, "recurring-issues.html"), renderRecurringIssuesPage(report));
  await writeTextFile(
    path.join(detailsDir, "institution-scorecards.html"),
    renderInstitutionScorecardsPage(report)
  );
  await writeTextFile(
    path.join(detailsDir, "institution-trends.html"),
    renderInstitutionTrendsIndexPage(report)
  );
  for (const institution of report.institution_trends?.institutions || []) {
    await writeTextFile(
      path.join(detailsDir, "institutions", `${institution.slug}.html`),
      renderInstitutionTrendPage(report, institution)
    );
  }
  await writeTextFile(path.join(dailyDir, "index.html"), renderDailyReportPage(report));
  await writeTextFile(path.join(reportsDir, "index.html"), renderDashboardPage(report));

  // Archive reports older than 14 days, then build the home page with the
  // full list of active and archived reports.
  await archiveOldReports({ reportsRoot: reportsDir, excludeDate: report.run_date });
  const recentReports = await loadRecentReports(
    path.join(reportsDir, "daily"),
    report.run_date
  );
  const archivedDates = await listArchivedDates(reportsDir);
  await writeTextFile(
    path.join(outputRoot, "docs", "index.html"),
    renderHomePage(report, recentReports, archivedDates)
  );
  await writeTextFile(
    path.join(reportsDir, "archive", "index.html"),
    renderArchiveIndexPage(archivedDates)
  );
}
