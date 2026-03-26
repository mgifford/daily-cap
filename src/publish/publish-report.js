import path from "node:path";
import { writeJsonFile, writeTextFile } from "../utils/fs.js";
import { renderDailyReportPage, renderDashboardPage } from "./render-pages.js";

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
  await writeTextFile(path.join(dailyDir, "index.html"), renderDailyReportPage(report));
  await writeTextFile(path.join(reportsDir, "index.html"), renderDashboardPage(report));
}
