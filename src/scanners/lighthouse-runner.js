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

/**
 * Compute an accessibility score from raw HTML by checking for common
 * signal deficiencies.  This is a static heuristic — not a real Lighthouse
 * audit — but it produces per-page variation so that EN/FR parity gaps are
 * meaningful even when a full browser-based scan is unavailable.
 *
 * Scoring starts at 100 and deducts for each detected problem:
 *   - <img> tags missing an alt attribute        up to -20
 *   - interactive <input>s without a label       up to -12
 *   - missing lang attribute on <html>                  -7
 *   - missing skip-navigation link                      -5
 *   - <table> elements without any <th> cells           -7
 *   - empty or generic link text (EN+FR)          up to -6
 *
 * Result is clamped to [20, 100].
 *
 * Limitations: uses regex-based HTML parsing and assumes reasonably
 * well-formed markup.  HTML comments or CDATA sections containing tag-like
 * strings may cause false positives or false negatives.  This is an
 * automated directional signal, not a certified accessibility audit.
 */
export function computeAccessibilityScore(html) {
  let score = 100;

  // Penalize for <img> tags missing an alt attribute.
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const imgsWithoutAlt = imgTags.filter((tag) => !/\balt\s*=/i.test(tag)).length;
  if (imgsWithoutAlt > 0) {
    score -= Math.min(20, imgsWithoutAlt * 4);
  }

  // Penalize for interactive <input> elements without an associated label.
  const inputTags = html.match(/<input\b[^>]*>/gi) || [];
  const interactiveInputs = inputTags.filter(
    (tag) =>
      !/type\s*=\s*["']?\s*(hidden|submit|button|reset|image)\s*["']?/i.test(tag)
  ).length;
  const labelCount = (html.match(/<label\b/gi) || []).length;
  const ariaLabelCount = (html.match(/\baria-label\s*=/gi) || []).length;
  const ariaLabelledCount = (html.match(/\baria-labelledby\s*=/gi) || []).length;
  const coveredByLabel = labelCount + ariaLabelCount + ariaLabelledCount;
  if (interactiveInputs > 0 && coveredByLabel < interactiveInputs) {
    score -= Math.min(12, (interactiveInputs - coveredByLabel) * 3);
  }

  // Penalize if the <html> element lacks a lang attribute.
  if (!/<html\b[^>]*\blang\s*=/i.test(html)) {
    score -= 7;
  }

  // Penalize for missing skip-navigation link.
  // Checks common EN and FR patterns as well as generic id/href anchors.
  if (
    !/(id=["']skip|href=["']#(skip|main|content|contenu)|passer au contenu|aller au contenu|skip to (main|content))/i.test(
      html
    )
  ) {
    score -= 5;
  }

  // Penalize for <table> elements without any <th> header cells.
  const tableCount = (html.match(/<table\b/gi) || []).length;
  const thCount = (html.match(/<th\b/gi) || []).length;
  if (tableCount > 0 && thCount === 0) {
    score -= 7;
  }

  // Penalize for empty or generic link text (English and French).
  const genericLinks = (
    html.match(
      /<a\b[^>]*>\s*(click here|more|read more|here|learn more|cliquez ici|plus|en savoir plus|lire la suite)\s*<\/a>/gi
    ) || []
  ).length;
  if (genericLinks > 0) {
    score -= Math.min(6, genericLinks * 2);
  }

  return Math.max(20, Math.min(100, score));
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
  const accessibility = computeAccessibilityScore(html);

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
