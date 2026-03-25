import { runLighthouseScan } from "./lighthouse-runner.js";
import { runScanGov } from "./scangov-runner.js";
import { runAccessibilityStatementCheck } from "./accessibility-statement-runner.js";
import { runPlatformFingerprint } from "./platform-fingerprint-runner.js";

async function scanOne(target, mode) {
  try {
    const [lighthouse, scangov, accessibilityStatement, platformFingerprint] = await Promise.all([
      runLighthouseScan(target, mode),
      runScanGov(target, mode),
      runAccessibilityStatementCheck(target, mode),
      runPlatformFingerprint(target, mode)
    ]);

    return {
      ...target,
      scan_status: "success",
      failure_reason: null,
      lighthouse,
      scangov,
      accessibility_statement: accessibilityStatement,
      platform_fingerprint: platformFingerprint
    };
  } catch (error) {
    return {
      ...target,
      scan_status: "failed",
      failure_reason: error instanceof Error ? error.message : String(error),
      lighthouse: null,
      scangov: null,
      accessibility_statement: null,
      platform_fingerprint: null
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
