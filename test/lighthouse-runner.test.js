import test from "node:test";
import assert from "node:assert/strict";

import { runLighthouseScanVariants } from "../src/scanners/lighthouse-runner.js";

const TARGET = {
  inventory_id: "svc-1-en",
  canonical_url: "https://example.com/service",
  language: "en"
};

test("runLighthouseScanVariants returns desktop/mobile and light/dark contexts", async () => {
  const result = await runLighthouseScanVariants(TARGET, "mock", [
    { form_factor: "desktop", color_scheme: "light" },
    { form_factor: "desktop", color_scheme: "dark" },
    { form_factor: "mobile", color_scheme: "light" },
    { form_factor: "mobile", color_scheme: "dark" }
  ]);

  assert.equal(result.default_context, "desktop_light");
  assert.ok(result.by_context.desktop_light);
  assert.ok(result.by_context.desktop_dark);
  assert.ok(result.by_context.mobile_light);
  assert.ok(result.by_context.mobile_dark);
  assert.equal(result.performance_score, result.by_context.desktop_light.performance_score);
  assert.equal(result.accessibility_score, result.by_context.desktop_light.accessibility_score);
});

test("runLighthouseScanVariants falls back to first context when desktop_light is absent", async () => {
  const result = await runLighthouseScanVariants(TARGET, "mock", [
    { form_factor: "mobile", color_scheme: "dark" }
  ]);

  assert.equal(result.default_context, "mobile_dark");
  assert.ok(result.by_context.mobile_dark);
});