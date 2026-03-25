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

export async function fetchRecentActivity(options = {}) {
  const source = options.source || "https://www.canada.ca/en/analytics/recent-activity.html";

  try {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch recent activity: ${response.status} ${response.statusText}`
      );
    }

    const html = await response.text();
    const entries = parseRecentActivityHtml(html);
    return entries;
  } catch (error) {
    console.error("Error fetching recent activity:", error instanceof Error ? error.message : String(error));
    return [];
  }
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
      entries.push({
        id: `recent-${entries.length}`,
        canonical_url: url,
        service_name: title,
        page_load_count: pageLoadCount,
        source: "recent",
        service_category: inferCategory(url, title),
        service_pattern: "unknown"
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
