import { runLighthouseScan } from "./lighthouse-runner.js";
import { runScanGov } from "./scangov-runner.js";

async function scanOne(target, mode) {
  try {
    const [lighthouse, scangov] = await Promise.all([
      runLighthouseScan(target, mode),
      runScanGov(target, mode)
    ]);

    return {
      ...target,
      scan_status: "success",
      failure_reason: null,
      lighthouse,
      scangov
    };
  } catch (error) {
    return {
      ...target,
      scan_status: "failed",
      failure_reason: error instanceof Error ? error.message : String(error),
      lighthouse: null,
      scangov: null
    };
  }
}

export async function runScans(targets, options) {
  const mode = options.mode || "mock";
  const concurrency = Math.max(1, options.concurrency || 2);
  const queue = [...targets];
  const results = [];

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const target = queue.shift();
      if (!target) {
        continue;
      }
      const scanned = await scanOne(target, mode);
      results.push(scanned);
    }
  });

  await Promise.all(workers);
  return results.sort((a, b) => a.inventory_id.localeCompare(b.inventory_id));
}
