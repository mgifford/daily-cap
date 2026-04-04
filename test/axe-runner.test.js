import test from "node:test";
import assert from "node:assert/strict";

import { runAxeScan, runAxeScanVariants } from "../src/scanners/axe-runner.js";

const TARGET = {
  inventory_id: "svc-1-en",
  canonical_url: "https://example.com/service",
  language: "en"
};

// ── runAxeScan ──────────────────────────────────────────────────────────────

test("runAxeScan returns correct shape in mock mode (desktop light)", async () => {
  const result = await runAxeScan(TARGET, "mock", {
    form_factor: "desktop",
    color_scheme: "light"
  });

  assert.deepEqual(result.context, { form_factor: "desktop", color_scheme: "light" });
  assert.ok(Array.isArray(result.violations), "violations must be an array");
  for (const v of result.violations) {
    assert.ok(typeof v.id === "string", "violation.id must be a string");
    assert.ok(typeof v.impact === "string", "violation.impact must be a string");
    assert.ok(typeof v.nodes_count === "number", "violation.nodes_count must be a number");
  }
  assert.ok(typeof result.violation_counts.critical === "number");
  assert.ok(typeof result.violation_counts.serious === "number");
  assert.ok(typeof result.violation_counts.moderate === "number");
  assert.ok(typeof result.violation_counts.minor === "number");
});

test("runAxeScan mock results are deterministic", async () => {
  const r1 = await runAxeScan(TARGET, "mock", { form_factor: "desktop", color_scheme: "light" });
  const r2 = await runAxeScan(TARGET, "mock", { form_factor: "desktop", color_scheme: "light" });
  assert.deepEqual(r1, r2);
});

test("runAxeScan dark mode mock is deterministic", async () => {
  const r1 = await runAxeScan(TARGET, "mock", { form_factor: "desktop", color_scheme: "dark" });
  const r2 = await runAxeScan(TARGET, "mock", { form_factor: "desktop", color_scheme: "dark" });
  assert.deepEqual(r1, r2);
});

test("runAxeScan dark mode mock differs from light mode mock", async () => {
  const light = await runAxeScan(TARGET, "mock", { form_factor: "desktop", color_scheme: "light" });
  const dark = await runAxeScan(TARGET, "mock", { form_factor: "desktop", color_scheme: "dark" });
  // Different context keys produce different seeds, so results must differ.
  assert.notDeepEqual(light, dark);
});

test("runAxeScan mobile dark mock differs from desktop dark mock", async () => {
  const desktop = await runAxeScan(TARGET, "mock", { form_factor: "desktop", color_scheme: "dark" });
  const mobile = await runAxeScan(TARGET, "mock", { form_factor: "mobile", color_scheme: "dark" });
  assert.notDeepEqual(desktop, mobile);
});

test("runAxeScan normalises unknown form_factor to desktop", async () => {
  const result = await runAxeScan(TARGET, "mock", { form_factor: "tablet", color_scheme: "light" });
  assert.equal(result.context.form_factor, "desktop");
});

test("runAxeScan normalises unknown color_scheme to light", async () => {
  const result = await runAxeScan(TARGET, "mock", { form_factor: "desktop", color_scheme: "high-contrast" });
  assert.equal(result.context.color_scheme, "light");
});

// ── runAxeScanVariants ──────────────────────────────────────────────────────

test("runAxeScanVariants returns all 4 contexts in mock mode", async () => {
  const result = await runAxeScanVariants(TARGET, "mock", [
    { form_factor: "desktop", color_scheme: "light" },
    { form_factor: "desktop", color_scheme: "dark" },
    { form_factor: "mobile", color_scheme: "light" },
    { form_factor: "mobile", color_scheme: "dark" }
  ]);

  assert.equal(result.default_context, "desktop_light");
  assert.ok(result.by_context.desktop_light, "desktop_light context missing");
  assert.ok(result.by_context.desktop_dark, "desktop_dark context missing");
  assert.ok(result.by_context.mobile_light, "mobile_light context missing");
  assert.ok(result.by_context.mobile_dark, "mobile_dark context missing");
});

test("runAxeScanVariants defaults to desktop_light when no contexts provided", async () => {
  const result = await runAxeScanVariants(TARGET, "mock");
  assert.equal(result.default_context, "desktop_light");
  assert.equal(Object.keys(result.by_context).length, 1);
  assert.ok(result.by_context.desktop_light);
});

test("runAxeScanVariants falls back to first context key when desktop_light is absent", async () => {
  const result = await runAxeScanVariants(TARGET, "mock", [
    { form_factor: "mobile", color_scheme: "dark" }
  ]);
  assert.equal(result.default_context, "mobile_dark");
  assert.ok(result.by_context.mobile_dark);
});

test("runAxeScanVariants each context entry has correct shape", async () => {
  const result = await runAxeScanVariants(TARGET, "mock", [
    { form_factor: "desktop", color_scheme: "dark" },
    { form_factor: "mobile", color_scheme: "light" }
  ]);

  for (const [key, entry] of Object.entries(result.by_context)) {
    assert.ok(entry.context, `${key} missing context`);
    assert.ok(Array.isArray(entry.violations), `${key} violations must be array`);
    assert.ok(entry.violation_counts, `${key} missing violation_counts`);
    assert.ok(typeof entry.violation_counts.critical === "number");
  }
});

test("runAxeScanVariants violation_counts sum matches individual violation nodes_count", async () => {
  const result = await runAxeScanVariants(TARGET, "mock", [
    { form_factor: "desktop", color_scheme: "light" }
  ]);

  const entry = result.by_context.desktop_light;
  const expectedTotal = entry.violations.reduce((sum, v) => sum + v.nodes_count, 0);
  const actualTotal = Object.values(entry.violation_counts).reduce((sum, n) => sum + n, 0);
  assert.equal(actualTotal, expectedTotal);
});
