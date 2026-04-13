/**
 * Canada.ca Recent Activity Ingestion
 *
 * Fetches top pages from Canada.ca analytics page.
 * Source: https://www.canada.ca/en/analytics/recent-activity.html
 *
 * Parses HTML table to extract:
 * - page URL
 * - page title
 * - traffic rank
 * - page view counts
 */

import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";

export async function fetchRecentActivity(options = {}) {
  const source = options.source || "https://www.canada.ca/en/analytics/recent-activity.html";

  try {
    const response = await fetchWithTimeout(source);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch recent activity: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();
    const entries = parseRecentActivityHtml(html);
    return entries;
  } catch (error) {
    const cause = error?.cause ? ` (cause: ${error.cause?.code ?? String(error.cause)})` : "";
    console.error(
      "Error fetching recent activity:",
      error instanceof Error ? `${error.message}${cause}` : String(error)
    );
    return [];
  }
}

function detectLanguage(url) {
  const lower = url.toLowerCase();

  // French language indicators
  if (lower.includes("/fr/")) return "fr";
  if (lower.includes("-fra.")) return "fr";
  if (lower.includes("lang=fr")) return "fr";
  if (/statcan\.gc\.ca\/n1\/fr\//.test(lower)) return "fr";

  return "en";
}

export function parseRecentActivityHtml(html) {
  const entries = [];

  // Match table rows with: URL | Title | Views
  // Pattern adapted for GC site structure
  const rowPattern =
    /<tr[^>]*>.*?<td[^>]*>.*?<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>.*?<\/td>.*?<td[^>]*>([^<]+)<\/td>.*?<\/tr>/dgs;

  let match;
  while ((match = rowPattern.exec(html)) !== null) {
    const url = match[1].trim();
    const title = match[2].trim();
    const viewsStr = match[3].trim();

    // Skip placeholder rows
    if (!url || url === "(other)" || !title) {
      continue;
    }

    // Parse view count; strip commas and letters
    const viewsMatch = viewsStr.match(/[\d,]+/);
    const pageLoadCount = viewsMatch
      ? Number.parseInt(viewsMatch[0].replaceAll(",", ""), 10)
      : 0;

    if (pageLoadCount > 0 && url.startsWith("http")) {
      const language = detectLanguage(url);
      entries.push({
        id: `recent-${entries.length}`,
        canonical_url: url,
        service_name: title,
        page_load_count: pageLoadCount,
        source: "recent",
        service_category: inferCategory(url, title),
        service_pattern: inferPattern(url, title),
        language
      });
    }
  }

  return entries;
}

function inferCategory(url, title) {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();

  if (
    urlLower.includes("tax") ||
    urlLower.includes("cra") ||
    titleLower.includes("revenue")
  ) {
    return "tax";
  }
  if (
    urlLower.includes("passport") ||
    urlLower.includes("travel") ||
    titleLower.includes("passport")
  ) {
    return "travel";
  }
  if (
    urlLower.includes("benefit") ||
    urlLower.includes("ei") ||
    titleLower.includes("benefit")
  ) {
    return "benefits";
  }
  if (
    urlLower.includes("immigration") ||
    urlLower.includes("ircc") ||
    titleLower.includes("immigration")
  ) {
    return "immigration";
  }
  if (
    urlLower.includes("health") ||
    titleLower.includes("health")
  ) {
    return "health";
  }
  if (
    urlLower.includes("weather") ||
    titleLower.includes("weather")
  ) {
    return "information";
  }
  return "service";
}

function inferPattern(url, title) {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const text = `${lowerUrl} ${lowerTitle}`;

  if (/sign[\s-]?in|log[\s-]?in|account|my account|secure/.test(text)) {
    return "sign-in";
  }
  if (/apply|application|register|enrol|enroll|submit/.test(text)) {
    return "application";
  }
  if (/status|processing|wait times|tracker|check/.test(text)) {
    return "status";
  }
  if (/payment|pay|fees|billing|invoice/.test(text)) {
    return "payment";
  }
  if (/calculator|estimate|tool/.test(text)) {
    return "estimator";
  }
  if (/help|contact|support|office|find/.test(text)) {
    return "help";
  }
  return "dashboard";
}
