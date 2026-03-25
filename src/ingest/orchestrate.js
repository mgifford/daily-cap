/**
 * Ingest Orchestration
 *
 * Combines multiple Canadian data sources:
 * 1. Canada.ca Recent Activity (traffic-based top pages)
 * 2. Top Tasks (key tasks from GC design system)
 * 3. Curated Endpoints (manually maintained important URLs)
 *
 * Deduplicates by canonical URL and merges metadata.
 */

import { fetchRecentActivity } from "./canada-recent-activity.js";
import { fetchTopTasks } from "./top-tasks.js";
import { getCuratedEndpoints } from "./curated-endpoints.js";
import { getDiscoveryCohort } from "./discovery-cohort.js";

export async function ingestAllSources(options = {}) {
  const [recent, tasks, curated, discovery] = await Promise.all([
    tryFetch(fetchRecentActivity(options), "recent activity"),
    tryFetch(fetchTopTasks(options), "top tasks"),
    tryFetch(Promise.resolve(getCuratedEndpoints()), "curated endpoints"),
    tryFetch(Promise.resolve(getDiscoveryCohort()), "discovery cohort")
  ]);

  // Normalize and merge
  const normalized = normalizeEntries([...recent, ...tasks, ...curated, ...discovery]);
  const deduplicated = deduplicateByUrl(normalized);

  return deduplicated;
}

async function tryFetch(promise, sourceName) {
  try {
    return await promise;
  } catch (error) {
    console.warn(`Failed to fetch ${sourceName}:`, error instanceof Error ? error.message : String(error));
    return [];
  }
}

function normalizeEntries(entries) {
  return entries.map((entry) => ({
    id: entry.id || `entry-${Math.random().toString(36).slice(2)}`,
    service_name: entry.service_name || entry.title || "Unnamed",
    url_en:
      entry.url_en || (entry.canonical_url && entry.language === "en" ? entry.canonical_url : null),
    url_fr:
      entry.url_fr || (entry.canonical_url && entry.language === "fr" ? entry.canonical_url : null),
    canonical_url: entry.canonical_url,
    source: entry.source || "unknown",
    service_category: entry.service_category || "service",
    service_pattern: entry.service_pattern || "unknown",
    institution: entry.institution || null,
    page_load_count: entry.page_load_count || 0,
    priority_weight: entry.priority_weight || 0.5,
    protected_flag: entry.protected_flag || false
  }));
}

function deduplicateByUrl(entries) {
  const seen = new Map();

  for (const entry of entries) {
    const key = normalizeUrl(entry.url_en || entry.url_fr || entry.canonical_url);

    if (!seen.has(key)) {
      seen.set(key, entry);
    } else {
      // Merge metadata if same URL appears in multiple sources
      const existing = seen.get(key);
      if (entry.page_load_count > (existing.page_load_count || 0)) {
        existing.page_load_count = entry.page_load_count;
      }
      if (entry.priority_weight > (existing.priority_weight || 0)) {
        existing.priority_weight = entry.priority_weight;
      }
      if (entry.service_pattern !== "unknown" && existing.service_pattern === "unknown") {
        existing.service_pattern = entry.service_pattern;
      }
      // Collect sources
      existing.source = `${existing.source},${entry.source}`;
    }
  }

  return Array.from(seen.values());
}

function normalizeUrl(url) {
  if (!url) return "";
  // Normalize for comparison: lowercase, strip trailing slash, query params
  return url.toLowerCase().replace(/\/$/, "").split("?")[0];
}
