import { createHash } from "node:crypto";

function boundedScore(seed, min = 40, max = 98) {
  const value = seed % (max - min + 1);
  return min + value;
}

function hashNumber(text) {
  const digest = createHash("sha256").update(text).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
}

export async function runLighthouseScan(target, mode) {
  if (mode === "mock") {
    const seed = hashNumber(target.canonical_url + target.language);
    return {
      performance_score: boundedScore(seed, 45, 95),
      accessibility_score: boundedScore(seed >>> 1, 55, 99),
      best_practices_score: boundedScore(seed >>> 2, 50, 98),
      seo_score: boundedScore(seed >>> 3, 60, 100),
      lcp_value_ms: 1200 + (seed % 3500)
    };
  }

  const started = Date.now();
  const response = await fetch(target.canonical_url, {
    method: "GET",
    redirect: "follow"
  });
  const html = await response.text();
  const duration = Date.now() - started;
  const size = Buffer.byteLength(html, "utf8");

  const performance = Math.max(20, 100 - Math.round(duration / 45));
  const accessibility = html.includes("lang=") ? 78 : 62;

  return {
    performance_score: performance,
    accessibility_score: accessibility,
    best_practices_score: response.ok ? 82 : 55,
    seo_score: html.includes("<title>") ? 85 : 50,
    lcp_value_ms: Math.max(1000, duration),
    total_byte_weight: size
  };
}
