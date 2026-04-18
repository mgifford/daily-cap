import test from "node:test";
import assert from "node:assert/strict";

import { summarizeLighthouseHistory } from "../src/aggregation/lighthouse-history.js";

const makeReport = (date, byContext = {}) => ({
  run_date: date,
  lighthouse_contexts: { by_context: byContext }
});

const ctx1 = {
  desktop_light: { performance_score: 65, accessibility_score: 80, best_practices_score: 75, seo_score: 85 },
  desktop_dark: { performance_score: 62, accessibility_score: 78, best_practices_score: 75, seo_score: 85 },
  mobile_light: { performance_score: 55, accessibility_score: 80, best_practices_score: 73, seo_score: 83 },
  mobile_dark: { performance_score: 55, accessibility_score: 78, best_practices_score: 73, seo_score: 83 }
};

const ctx2 = {
  desktop_light: { performance_score: 67, accessibility_score: 81, best_practices_score: 76, seo_score: 86 },
  desktop_dark: { performance_score: 64, accessibility_score: 79, best_practices_score: 76, seo_score: 86 },
  mobile_light: { performance_score: 57, accessibility_score: 81, best_practices_score: 74, seo_score: 84 },
  mobile_dark: { performance_score: 57, accessibility_score: 79, best_practices_score: 74, seo_score: 84 }
};

test("summarizeLighthouseHistory builds ordered daily points with context data", () => {
  const current = makeReport("2026-04-10", ctx2);
  const history = [makeReport("2026-04-08", ctx1)];

  const result = summarizeLighthouseHistory(current, history);

  assert.equal(result.summary.points, 2);
  assert.equal(result.summary.start_date, "2026-04-08");
  assert.equal(result.summary.end_date, "2026-04-10");
  assert.deepEqual(result.points[0].desktop_light, ctx1.desktop_light);
  assert.deepEqual(result.points[1].desktop_light, ctx2.desktop_light);
});

test("summarizeLighthouseHistory handles empty historical reports", () => {
  const current = makeReport("2026-04-10", ctx1);
  const result = summarizeLighthouseHistory(current);

  assert.equal(result.summary.points, 1);
  assert.equal(result.summary.start_date, "2026-04-10");
  assert.equal(result.summary.end_date, "2026-04-10");
  assert.deepEqual(result.points[0].desktop_light, ctx1.desktop_light);
});

test("summarizeLighthouseHistory returns null contexts for reports with no lighthouse data", () => {
  const current = makeReport("2026-04-10", ctx1);
  const history = [{ run_date: "2026-04-09" }]; // no lighthouse_contexts

  const result = summarizeLighthouseHistory(current, history);

  assert.equal(result.summary.points, 2);
  assert.equal(result.points[0].desktop_light, null);
  assert.equal(result.points[0].mobile_dark, null);
  assert.deepEqual(result.points[1].desktop_light, ctx1.desktop_light);
});

test("summarizeLighthouseHistory sorts points by run_date ascending", () => {
  const current = makeReport("2026-04-07", ctx2);
  const history = [
    makeReport("2026-04-10", ctx1),
    makeReport("2026-04-08", ctx1)
  ];

  const result = summarizeLighthouseHistory(current, history);

  assert.equal(result.points[0].run_date, "2026-04-07");
  assert.equal(result.points[1].run_date, "2026-04-08");
  assert.equal(result.points[2].run_date, "2026-04-10");
});
