#!/usr/bin/env node

import { parseArgs } from "node:util";
import { getDefaultConfig } from "./src/config/defaults.js";
import { loadSeedInventory } from "./src/ingest/canada-seed.js";
import { buildInventory } from "./src/inventory/build-inventory.js";
import { runScans } from "./src/scanners/execution-manager.js";
import { buildDailyReport } from "./src/aggregation/build-report.js";
import { publishReport } from "./src/publish/publish-report.js";
import { resolveDateString } from "./src/utils/date.js";

const { values } = parseArgs({
  options: {
    date: { type: "string" },
    limit: { type: "string" },
    mode: { type: "string" },
    outputRoot: { type: "string" }
  }
});

const config = getDefaultConfig();
const runDate = resolveDateString(values.date);
const mode = values.mode === "live" ? "live" : "mock";
const limit = values.limit ? Number.parseInt(values.limit, 10) : config.urlLimit;

if (!Number.isFinite(limit) || limit < 1) {
  throw new Error("--limit must be a positive integer");
}

const seed = loadSeedInventory();
const inventory = buildInventory(seed, { limit });

const scanned = await runScans(inventory, {
  mode,
  concurrency: config.scanner.concurrency
});

const report = buildDailyReport({
  runDate,
  runId: `cap-${runDate}`,
  mode,
  inventory,
  scanned
});

const outputRoot = values.outputRoot || process.cwd();
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
