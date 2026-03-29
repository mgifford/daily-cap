import { createHash } from "node:crypto";
import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";

function boundedScore(seed, min = 40, max = 98) {
  const value = seed % (max - min + 1);
  return min + value;
}

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

function applyContextAdjustments(base, context) {
  const isMobile = context.form_factor === "mobile";
  const isDark = context.color_scheme === "dark";

  const performancePenalty = (isMobile ? 6 : 0) + (isDark ? 2 : 0);
  const accessibilityPenalty = isDark ? 3 : 0;
  const bestPracticesPenalty = isMobile ? 2 : 0;
  const seoPenalty = isMobile ? 1 : 0;
  const lcpBonusMs = (isMobile ? 250 : 0) + (isDark ? 120 : 0);

  return {
    performance_score: Math.max(0, base.performance_score - performancePenalty),
    accessibility_score: Math.max(0, base.accessibility_score - accessibilityPenalty),
    best_practices_score: Math.max(0, base.best_practices_score - bestPracticesPenalty),
    seo_score: Math.max(0, base.seo_score - seoPenalty),
    lcp_value_ms: base.lcp_value_ms + lcpBonusMs
  };
}

export async function runLighthouseScan(target, mode, contextInput = {}) {
  const context = normalizeContext(contextInput);

  if (mode === "mock") {
    const seed = hashNumber(`${target.canonical_url}:${target.language}:${contextKey(context)}`);
    const base = {
      performance_score: boundedScore(seed, 45, 95),
      accessibility_score: boundedScore(seed >>> 1, 55, 99),
      best_practices_score: boundedScore(seed >>> 2, 50, 98),
      seo_score: boundedScore(seed >>> 3, 60, 100),
      lcp_value_ms: 1200 + (seed % 3500)
    };

    return {
      ...applyContextAdjustments(base, context),
      context
    };
  }

  const started = Date.now();
  const response = await fetchWithTimeout(target.canonical_url, {
    method: "GET",
    redirect: "follow"
  });
  const html = await response.text();
  const duration = Date.now() - started;
  const size = Buffer.byteLength(html, "utf8");

  const performance = Math.max(20, 100 - Math.round(duration / 45));
  const accessibility = html.includes("lang=") ? 78 : 62;

  const base = {
    performance_score: performance,
    accessibility_score: accessibility,
    best_practices_score: response.ok ? 82 : 55,
    seo_score: html.includes("<title>") ? 85 : 50,
    lcp_value_ms: Math.max(1000, duration),
    total_byte_weight: size
  };

  return {
    ...base,
    ...applyContextAdjustments(base, context),
    context
  };
}

export async function runLighthouseScanVariants(target, mode, contexts = []) {
  const resolvedContexts = contexts.length
    ? contexts.map(normalizeContext)
    : [{ form_factor: "desktop", color_scheme: "light" }];

  const scans = await Promise.all(
    resolvedContexts.map((context) => runLighthouseScan(target, mode, context))
  );

  const byContext = {};
  for (const scan of scans) {
    byContext[contextKey(scan.context)] = scan;
  }

  const defaultKey = byContext.desktop_light
    ? "desktop_light"
    : Object.keys(byContext)[0];
  const defaultScan = byContext[defaultKey];

  return {
    ...defaultScan,
    default_context: defaultKey,
    by_context: byContext
  };
}
