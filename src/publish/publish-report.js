import path from "node:path";
import { writeJsonFile, writeTextFile } from "../utils/fs.js";
import { renderDailyReportPage, renderDashboardPage } from "./render-pages.js";

export async function publishReport({ report, outputRoot }) {
  const dailyDir = path.join(outputRoot, "docs", "reports", "daily", report.run_date);
  const reportsDir = path.join(outputRoot, "docs", "reports");

  await writeJsonFile(path.join(dailyDir, "report.json"), report);
  await writeTextFile(path.join(dailyDir, "index.html"), renderDailyReportPage(report));
  await writeTextFile(path.join(reportsDir, "index.html"), renderDashboardPage(report));
}
