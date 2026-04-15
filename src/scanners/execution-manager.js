import { runLighthouseScanVariants } from "./lighthouse-runner.js";
import { runScanGov } from "./scangov-runner.js";
import { runAccessibilityStatementCheck } from "./accessibility-statement-runner.js";
import { runPlatformFingerprint } from "./platform-fingerprint-runner.js";
import { runAxeScanVariants } from "./axe-runner.js";
import { runGreenWebCheck } from "./green-web-runner.js";
import { runAmtpgScan } from "./amtpg-runner.js";

async function runScanner(fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function scanOne(target, mode, lighthouseContexts, axeContexts) {
  const [lighthouse, scangov, accessibilityStatement, platformFingerprint, axe, greenWeb, amtpg] =
    await Promise.all([
      runScanner(() => runLighthouseScanVariants(target, mode, lighthouseContexts)),
      runScanner(() => runScanGov(target, mode)),
      runScanner(() => runAccessibilityStatementCheck(target, mode)),
      runScanner(() => runPlatformFingerprint(target, mode)),
      runScanner(() => runAxeScanVariants(target, mode, axeContexts)),
      runScanner(() => runGreenWebCheck(target, mode)),
      runScanner(() => runAmtpgScan(target, mode))
    ]);

  if (lighthouse.ok) {
    return {
      ...target,
      scan_status: "success",
      failure_reason: null,
      lighthouse: lighthouse.value,
      scangov: scangov.ok ? scangov.value : null,
      accessibility_statement: accessibilityStatement.ok
        ? accessibilityStatement.value
        : null,
      platform_fingerprint: platformFingerprint.ok ? platformFingerprint.value : null,
      axe: axe.ok ? axe.value : null,
      green_web: greenWeb.ok ? greenWeb.value : null,
      amtpg: amtpg.ok ? amtpg.value : null
    };
  }

  return {
    ...target,
    scan_status: "failed",
    failure_reason: lighthouse.error || "lighthouse scan failed",
    lighthouse: null,
    scangov: scangov.ok ? scangov.value : null,
    accessibility_statement: accessibilityStatement.ok
      ? accessibilityStatement.value
      : null,
    platform_fingerprint: platformFingerprint.ok ? platformFingerprint.value : null,
    axe: axe.ok ? axe.value : null,
    green_web: greenWeb.ok ? greenWeb.value : null,
    amtpg: amtpg.ok ? amtpg.value : null
  };
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
