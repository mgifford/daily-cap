import { runLighthouseScanVariants } from "./lighthouse-runner.js";
import { runScanGov } from "./scangov-runner.js";
import { runAccessibilityStatementCheck } from "./accessibility-statement-runner.js";
import { runPlatformFingerprint } from "./platform-fingerprint-runner.js";
import { runAxeScanVariants } from "./axe-runner.js";

async function scanOne(target, mode, lighthouseContexts, axeContexts) {
  try {
    const [lighthouse, scangov, accessibilityStatement, platformFingerprint, axe] =
      await Promise.all([
        runLighthouseScanVariants(target, mode, lighthouseContexts),
        runScanGov(target, mode),
        runAccessibilityStatementCheck(target, mode),
        runPlatformFingerprint(target, mode),
        runAxeScanVariants(target, mode, axeContexts)
      ]);

    return {
      ...target,
      scan_status: "success",
      failure_reason: null,
      lighthouse,
      scangov,
      accessibility_statement: accessibilityStatement,
      platform_fingerprint: platformFingerprint,
      axe
    };
  } catch (error) {
    return {
      ...target,
      scan_status: "failed",
      failure_reason: error instanceof Error ? error.message : String(error),
      lighthouse: null,
      scangov: null,
      accessibility_statement: null,
      platform_fingerprint: null,
      axe: null
    };
  }
}

export async function runScans(targets, options) {
  const mode = options.mode || "mock";
  const concurrency = Math.max(1, options.concurrency || 2);
  const lighthouseContexts = options.lighthouseContexts || [];
  const axeContexts = options.axeContexts || [
    { form_factor: "desktop", color_scheme: "light" },
    { form_factor: "desktop", color_scheme: "dark" },
    { form_factor: "mobile", color_scheme: "light" },
    { form_factor: "mobile", color_scheme: "dark" }
  ];
  const queue = [...targets];
  const results = [];

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const target = queue.shift();
      if (!target) {
        continue;
      }
      const scanned = await scanOne(target, mode, lighthouseContexts, axeContexts);
      results.push(scanned);
    }
  });

  await Promise.all(workers);
  return results.sort((a, b) => a.inventory_id.localeCompare(b.inventory_id));
}
