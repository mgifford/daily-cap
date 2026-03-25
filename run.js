#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { getDefaultConfig } from "./src/config/defaults.js";
import { loadSeedInventory } from "./src/ingest/canada-seed.js";
import { ingestAllSources } from "./src/ingest/orchestrate.js";
import { buildInventory } from "./src/inventory/build-inventory.js";
import { runScans } from "./src/scanners/execution-manager.js";
import { buildDailyReport } from "./src/aggregation/build-report.js";
import { publishReport } from "./src/publish/publish-report.js";
import { resolveDateString } from "./src/utils/date.js";

async function loadPreviousReport(outputRoot, runDate) {
  const dailyRoot = path.join(outputRoot, "docs", "reports", "daily");

  try {
    const entries = await fs.readdir(dailyRoot, { withFileTypes: true });
    const dates = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name))
      .filter((name) => name < runDate)
      .sort((a, b) => b.localeCompare(a));

    for (const date of dates) {
      const reportPath = path.join(dailyRoot, date, "report.json");
      try {
        const json = await fs.readFile(reportPath, "utf8");
        return JSON.parse(json);
      } catch {
        // Try the next previous date if this report is missing or malformed.
      }
    }
  } catch {
    return null;
  }

  return null;
}

const { values } = parseArgs({
  options: {
    date: { type: "string" },
    limit: { type: "string" },
    mode: { type: "string" },
    outputRoot: { type: "string" },
    "source-mode": { type: "string" }
  }
});

const config = getDefaultConfig();
const runDate = resolveDateString(values.date);
const mode = values.mode === "live" ? "live" : "mock";
const sourceMode = values["source-mode"] === "seed" ? "seed" : "live";
const limit = values.limit ? Number.parseInt(values.limit, 10) : config.urlLimit;

if (!Number.isFinite(limit) || limit < 1) {
  throw new Error("--limit must be a positive integer");
}

let sources;
if (sourceMode === "seed") {
  sources = loadSeedInventory();
} else {
  try {
    sources = await ingestAllSources();
  } catch (error) {
    console.warn("Ingest failed, falling back to seed data:", error instanceof Error ? error.message : String(error));
    sources = loadSeedInventory();
  }
}

const inventoryResult = buildInventory(sources, { limit });
const scanTargets = inventoryResult.scan_targets;

const scanned = await runScans(scanTargets, {
  mode,
  concurrency: config.scanner.concurrency,
  lighthouseContexts: config.scanner.lighthouseContexts
});

const outputRoot = values.outputRoot || process.cwd();
const previousReport = await loadPreviousReport(outputRoot, runDate);

const report = buildDailyReport({
  runDate,
  runId: `cap-${runDate}`,
  mode,
  inventory: inventoryResult,
  scanned,
  previousReport
});

await publishReport({ report, outputRoot });

console.log(
  JSON.stringify(
    {
      runDate,
      mode,
      scanned: report.scan_summary,
      output: report.output_paths
    },
    null,
    2
  )
);
