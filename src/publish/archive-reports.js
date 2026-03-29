import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Archives daily report directories older than `archiveAfterDays` days by
 * zipping each directory and placing the zip in the `archive/` folder beside
 * `daily/`. The original directory is removed after a successful zip.
 *
 * @param {object} options
 * @param {string} options.reportsRoot  Absolute path to `docs/reports/`
 * @param {number} [options.archiveAfterDays=14]  Age threshold in days
 * @returns {Promise<{archived: string[]}>}  Dates that were archived
 */
export async function archiveOldReports({ reportsRoot, archiveAfterDays = 14 }) {
  const dailyDir = path.join(reportsRoot, "daily");
  const archiveDir = path.join(reportsRoot, "archive");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - archiveAfterDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  let entries;
  try {
    entries = await fs.readdir(dailyDir, { withFileTypes: true });
  } catch {
    return { archived: [] };
  }

  const oldDates = entries
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => e.name)
    .filter((date) => date < cutoffStr)
    .sort();

  if (!oldDates.length) {
    return { archived: [] };
  }

  await fs.mkdir(archiveDir, { recursive: true });

  const archived = [];
  for (const date of oldDates) {
    const zipPath = path.join(archiveDir, `${date}.zip`);

    // Skip if already archived.
    try {
      await fs.access(zipPath);
      await fs.rm(path.join(dailyDir, date), { recursive: true, force: true });
      archived.push(date);
      continue;
    } catch {
      // Not yet archived — proceed.
    }

    try {
      await execFileAsync("zip", ["-r", "-q", zipPath, date], { cwd: dailyDir });
      await fs.rm(path.join(dailyDir, date), { recursive: true, force: true });
      archived.push(date);
    } catch (err) {
      console.warn(
        `archive-reports: failed to archive ${date}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  return { archived };
}

/**
 * Returns sorted (ascending) list of archive zip dates found in
 * `reportsRoot/archive/*.zip`.
 *
 * @param {string} reportsRoot  Absolute path to `docs/reports/`
 * @returns {Promise<string[]>}
 */
export async function listArchivedDates(reportsRoot) {
  const archiveDir = path.join(reportsRoot, "archive");

  try {
    const entries = await fs.readdir(archiveDir);
    return entries
      .filter((name) => /^\d{4}-\d{2}-\d{2}\.zip$/.test(name))
      .map((name) => name.replace(/\.zip$/, ""))
      .sort();
  } catch {
    return [];
  }
}
