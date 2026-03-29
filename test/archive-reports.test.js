import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { archiveOldReports, listArchivedDates } from "../src/publish/archive-reports.js";

async function makeReportDir(dailyDir, date) {
  const dir = path.join(dailyDir, date);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "report.json"),
    JSON.stringify({ run_date: date, run_id: `cap-${date}` }),
    "utf8"
  );
  return dir;
}

test("archiveOldReports returns empty when no old reports exist", async () => {
  const reportsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cap-archive-"));
  const dailyDir = path.join(reportsRoot, "daily");
  await fs.mkdir(dailyDir, { recursive: true });

  // Only a recent date — should not be archived.
  const today = new Date().toISOString().slice(0, 10);
  await makeReportDir(dailyDir, today);

  const result = await archiveOldReports({ reportsRoot, archiveAfterDays: 14 });
  assert.deepEqual(result.archived, []);
});

test("archiveOldReports archives reports older than threshold", async (t) => {
  // Skip if zip is unavailable in this environment.
  try {
    const { execFileSync } = await import("node:child_process");
    execFileSync("zip", ["--version"], { stdio: "pipe" });
  } catch {
    t.skip("zip command not available");
    return;
  }

  const reportsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cap-archive-"));
  const dailyDir = path.join(reportsRoot, "daily");
  await fs.mkdir(dailyDir, { recursive: true });

  // Create two old dates and one recent date.
  const oldDate1 = "2025-01-01";
  const oldDate2 = "2025-01-02";
  const recentDate = new Date().toISOString().slice(0, 10);

  await makeReportDir(dailyDir, oldDate1);
  await makeReportDir(dailyDir, oldDate2);
  await makeReportDir(dailyDir, recentDate);

  const result = await archiveOldReports({ reportsRoot, archiveAfterDays: 14 });

  assert.ok(result.archived.includes(oldDate1), "old report 1 archived");
  assert.ok(result.archived.includes(oldDate2), "old report 2 archived");
  assert.ok(!result.archived.includes(recentDate), "recent report not archived");

  // Zip files should exist.
  const archiveDir = path.join(reportsRoot, "archive");
  const archiveFiles = await fs.readdir(archiveDir);
  assert.ok(archiveFiles.includes(`${oldDate1}.zip`));
  assert.ok(archiveFiles.includes(`${oldDate2}.zip`));

  // Original dirs should be removed.
  await assert.rejects(fs.access(path.join(dailyDir, oldDate1)), "old dir 1 removed");
  await assert.rejects(fs.access(path.join(dailyDir, oldDate2)), "old dir 2 removed");

  // Recent dir should still exist.
  await assert.doesNotReject(fs.access(path.join(dailyDir, recentDate)), "recent dir kept");
});

test("listArchivedDates returns empty array when archive dir does not exist", async () => {
  const reportsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cap-archive-"));
  const dates = await listArchivedDates(reportsRoot);
  assert.deepEqual(dates, []);
});

test("listArchivedDates returns sorted dates for zip files", async () => {
  const reportsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "cap-archive-"));
  const archiveDir = path.join(reportsRoot, "archive");
  await fs.mkdir(archiveDir, { recursive: true });

  await fs.writeFile(path.join(archiveDir, "2025-03-01.zip"), "", "utf8");
  await fs.writeFile(path.join(archiveDir, "2025-02-15.zip"), "", "utf8");
  await fs.writeFile(path.join(archiveDir, "not-a-date.txt"), "", "utf8");

  const dates = await listArchivedDates(reportsRoot);
  assert.deepEqual(dates, ["2025-02-15", "2025-03-01"]);
});
