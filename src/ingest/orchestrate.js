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

function inferFrenchUrl(url) {
  // Canada.ca: swap /en/ with /fr/
  if (url.includes("/en/")) {
    return url.replace("/en/", "/fr/");
  }
  return null;
}

function normalizeEntries(entries) {
  const normalized = entries.map((entry) => {
    let url_en = entry.url_en;
    let url_fr = entry.url_fr;
    let inferredFrUrl = null;

    if (entry.canonical_url && entry.language === "en") {
      url_en = entry.canonical_url;
      // Infer url_fr for Canada.ca entries
      if (entry.source === "recent" && entry.canonical_url.includes("canada.ca")) {
        inferredFrUrl = inferFrenchUrl(entry.canonical_url);
        url_fr = inferredFrUrl;
        if (inferredFrUrl) {
          console.log(`[DEBUG] Inferred FR URL for ${entry.id}: ${inferredFrUrl}`);
        }
      }
    } else if (entry.canonical_url && entry.language === "fr") {
      url_fr = entry.canonical_url;
    }

    return {
      id: entry.id || `entry-${Math.random().toString(36).slice(2)}`,
      service_name: entry.service_name || entry.title || "Unnamed",
      url_en,
      url_fr,
      canonical_url: entry.canonical_url,
      source: normalizeSource(entry),
      service_category: entry.service_category || "service",
      service_pattern: entry.service_pattern || "unknown",
      institution: entry.institution || null,
      page_load_count: entry.page_load_count || 0,
      priority_weight: entry.priority_weight || 0.5,
      protected_flag: entry.protected_flag || false,
      language: entry.language
    };
  });

  const recentWithInferred = normalized.filter((e) => e.source === "recent" && e.url_fr);
  console.log(`[DEBUG] normalizeEntries: ${recentWithInferred.length} recent entries have inferred FR URLs`);

  return normalized;
}

function normalizeSource(entry) {
  if (entry.source) {
    return entry.source;
  }

  const id = String(entry.id || "");
  if (id.startsWith("recent-")) return "recent";
  if (id.startsWith("top-task-")) return "top-task";
  if (id.startsWith("curated-")) return "curated";
  if (id.startsWith("discovery-")) return "discovered";
  return "unknown";
}

function deduplicateByUrl(entries) {
  const seen = new Map();
  const recentPairMap = new Map(); // Map url_fr → url_en for recent entries

  // First pass: collect all entries and build recent EN/FR pairing map
  for (const entry of entries) {
    const key = normalizeUrl(entry.url_en || entry.url_fr || entry.canonical_url);

    if (!seen.has(key)) {
      seen.set(key, entry);
      // Track recent entries with inferred FR URLs for pairing
      if (entry.source === "recent" && entry.url_fr && entry.url_en) {
        const frKey = normalizeUrl(entry.url_fr);
        recentPairMap.set(frKey, key); // Map FR key to EN key
      }
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
      // Collect unique sources in stable order
      const sourceSet = new Set(
        String(existing.source || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      );
      sourceSet.add(entry.source);
      existing.source = Array.from(sourceSet).sort().join(",");
    }
  }

  // Second pass: merge recent EN and FR entries for same service
  const toRemove = new Set();
  let recentPairsMerged = 0;
  for (const entry of Array.from(seen.values())) {
    if (entry.source === "recent" && entry.language === "fr" && entry.url_fr) {
      const frKey = normalizeUrl(entry.url_fr);
      const enKey = recentPairMap.get(frKey);
      if (enKey) {
        const enEntry = seen.get(enKey);
        if (enEntry && enEntry.language === "en") {
          // Merge FR into EN entry
          console.log(`[DEBUG] Merged recent FR into EN: ${enEntry.id} + ${entry.id}`);
          enEntry.url_fr = entry.url_fr;
          toRemove.add(normalizeUrl(entry.url_en || entry.url_fr || entry.canonical_url));
          recentPairsMerged += 1;
        }
      }
    }
  }

  if (recentPairsMerged > 0) {
    console.log(`[DEBUG] deduplicateByUrl: merged ${recentPairsMerged} recent EN/FR pairs`);
  }

  // Remove merged FR entries
  for (const key of toRemove) {
    seen.delete(key);
  }

  return Array.from(seen.values());
}

function normalizeUrl(url) {
  if (!url) return "";
  // Normalize for comparison: lowercase, strip trailing slash, query params
  return url.toLowerCase().replace(/\/$/, "").split("?")[0];
}
