import { createHash } from "node:crypto";

// Viewport dimensions used for browser context configuration.
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MOBILE_USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) " +
  "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1";

// Representative axe rule IDs used in mock mode to produce realistic-looking output.
const MOCK_RULES = [
  { id: "color-contrast", impact: "serious" },
  { id: "button-name", impact: "critical" },
  { id: "image-alt", impact: "critical" },
  { id: "label", impact: "critical" },
  { id: "link-name", impact: "serious" },
  { id: "list", impact: "moderate" }
];

function hashNumber(text) {
  const digest = createHash("sha256").update(text).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
}

function contextKey(context) {
  return `${context.form_factor}_${context.color_scheme}`;
}

function normalizeContext(context = {}) {
  return {
    form_factor: context.form_factor === "mobile" ? "mobile" : "desktop",
    color_scheme: context.color_scheme === "dark" ? "dark" : "light"
  };
}

function countByImpact(violations, impact) {
  return violations
    .filter((v) => v.impact === impact)
    .reduce((sum, v) => sum + v.nodes_count, 0);
}

function summariseCounts(violations) {
  return {
    critical: countByImpact(violations, "critical"),
    serious: countByImpact(violations, "serious"),
    moderate: countByImpact(violations, "moderate"),
    minor: countByImpact(violations, "minor")
  };
}

function mockResult(target, context) {
  const seed = hashNumber(
    `${target.canonical_url}:${target.language}:${contextKey(context)}`
  );
  // Dark mode surfaces more contrast-related violations; add an extra rule slot.
  const isDark = context.color_scheme === "dark";
  const count = Math.min(MOCK_RULES.length, (seed % 3) + (isDark ? 1 : 0));
  const violations = MOCK_RULES.slice(0, count).map((rule, i) => ({
    id: rule.id,
    impact: rule.impact,
    nodes_count: ((seed >>> i) % 4) + 1
  }));
  return { context, violations, violation_counts: summariseCounts(violations) };
}

function getExecutablePathFromEnv() {
  const chromePath = process.env.CHROME_PATH;
  if (typeof chromePath !== "string") {
    return null;
  }
  const trimmed = chromePath.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveChromiumLaunchOptions() {
  const executablePath = getExecutablePathFromEnv();
  if (!executablePath) {
    return { headless: true };
  }
  return { headless: true, executablePath };
}

// Runs axe-core against a single page using an already-open browser instance.
async function scanWithBrowser(browser, url, context) {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const isMobile = context.form_factor === "mobile";
  const isDark = context.color_scheme === "dark";

  const contextOptions = {
    colorScheme: isDark ? "dark" : "light",
    viewport: isMobile ? MOBILE_VIEWPORT : DESKTOP_VIEWPORT,
    ...(isMobile ? { userAgent: MOBILE_USER_AGENT } : {})
  };

  const browserContext = await browser.newContext(contextOptions);
  const page = await browserContext.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    const axeResults = await new AxeBuilder({ page }).analyze();
    const violations = axeResults.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes_count: v.nodes.length
    }));
    return { context, violations, violation_counts: summariseCounts(violations) };
  } finally {
    await browserContext.close();
  }
}

/**
 * Run axe-core against a single URL/context combination.
 * In mock mode no browser is launched; results are seeded from the URL hash.
 * In live mode a Playwright Chromium browser is launched and closed per call,
 * so prefer runAxeScanVariants when scanning multiple contexts for the same URL.
 */
export async function runAxeScan(target, mode, contextInput = {}) {
  const context = normalizeContext(contextInput);

  if (mode === "mock") {
    return mockResult(target, context);
  }

  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch(resolveChromiumLaunchOptions());
  try {
    return await scanWithBrowser(browser, target.canonical_url, context);
  } finally {
    await browser.close();
  }
}

/**
 * Run axe-core against all requested context combinations for one URL.
 * In live mode a single Chromium browser is shared across all contexts to
 * reduce overhead.  Returns results keyed by context (e.g. "desktop_dark").
 */
export async function runAxeScanVariants(target, mode, contexts = []) {
  const resolvedContexts = contexts.length
    ? contexts.map(normalizeContext)
    : [{ form_factor: "desktop", color_scheme: "light" }];

  if (mode === "mock") {
    const byContext = {};
    for (const context of resolvedContexts) {
      byContext[contextKey(context)] = mockResult(target, context);
    }
    const defaultKey = byContext.desktop_light
      ? "desktop_light"
      : Object.keys(byContext)[0];
    return { default_context: defaultKey, by_context: byContext };
  }

  // Live mode: share a single browser instance across all contexts.
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch(resolveChromiumLaunchOptions());
  try {
    const scans = await Promise.all(
      resolvedContexts.map((context) =>
        scanWithBrowser(browser, target.canonical_url, context)
      )
    );
    const byContext = {};
    for (const scan of scans) {
      byContext[contextKey(scan.context)] = scan;
    }
    const defaultKey = byContext.desktop_light
      ? "desktop_light"
      : Object.keys(byContext)[0];
    return { default_context: defaultKey, by_context: byContext };
  } finally {
    await browser.close();
  }
}
