import test from "node:test";
import assert from "node:assert/strict";

import { summarizeLighthouseContexts } from "../src/aggregation/lighthouse-context-analysis.js";

test("summarizeLighthouseContexts computes per-context means and deltas", () => {
  const scanned = [
    {
      scan_status: "success",
      lighthouse: {
        by_context: {
          desktop_light: { performance_score: 90, accessibility_score: 92, best_practices_score: 88, seo_score: 86 },
          desktop_dark: { performance_score: 88, accessibility_score: 89, best_practices_score: 88, seo_score: 86 },
          mobile_light: { performance_score: 82, accessibility_score: 92, best_practices_score: 86, seo_score: 85 },
          mobile_dark: { performance_score: 79, accessibility_score: 88, best_practices_score: 85, seo_score: 84 }
        }
      }
    }
  ];

  const result = summarizeLighthouseContexts(scanned);

  assert.equal(result.summary.scanned_urls_with_context_data, 1);
  assert.equal(result.summary.baseline_context, "desktop_light");
  assert.equal(result.by_context.mobile_dark.performance_score, 79);
  assert.equal(result.highlights.mobile_dark_vs_desktop_light.performance_score, -11);
  assert.equal(result.highlights.mobile_dark_vs_desktop_light.accessibility_score, -4);
});