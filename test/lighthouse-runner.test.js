import test from "node:test";
import assert from "node:assert/strict";

import { runLighthouseScanVariants, computeAccessibilityScore } from "../src/scanners/lighthouse-runner.js";

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

test("computeAccessibilityScore returns 100 for fully accessible HTML", () => {
  const html = `<html lang="en"><body>
    <a href="#main" id="skip">Skip to main content</a>
    <img src="logo.png" alt="Site logo">
    <label for="name">Name</label><input type="text" id="name">
    <table><thead><tr><th>Col</th></tr></thead></table>
    <a href="/page">Read full article</a>
  </body></html>`;
  assert.equal(computeAccessibilityScore(html), 100);
});

test("computeAccessibilityScore deducts for images missing alt attributes", () => {
  const htmlWithAlt = `<html lang="en"><body>
    <a href="#main" id="skip">Skip to main content</a>
    <img src="a.png" alt="Description">
  </body></html>`;
  const htmlWithoutAlt = `<html lang="en"><body>
    <a href="#main" id="skip">Skip to main content</a>
    <img src="a.png"><img src="b.png">
  </body></html>`;
  assert.equal(computeAccessibilityScore(htmlWithAlt), 100);
  assert.ok(computeAccessibilityScore(htmlWithoutAlt) < 100, "should deduct for missing alt");
});

test("computeAccessibilityScore deducts for missing html lang attribute", () => {
  const withLang = `<html lang="en"><body><a href="#main" id="skip">Skip to main content</a></body></html>`;
  const withoutLang = `<html><body><a href="#main" id="skip">Skip to main content</a></body></html>`;
  assert.ok(computeAccessibilityScore(withoutLang) < computeAccessibilityScore(withLang));
});

test("computeAccessibilityScore deducts for missing skip navigation", () => {
  const withSkipEn = `<html lang="en"><body><a href="#main" id="skip">Skip to main content</a></body></html>`;
  const withSkipFr = `<html lang="fr"><body><a href="#contenu">Aller au contenu</a></body></html>`;
  const withoutSkip = `<html lang="en"><body><p>No skip link here</p></body></html>`;
  assert.ok(computeAccessibilityScore(withoutSkip) < computeAccessibilityScore(withSkipEn));
  assert.ok(computeAccessibilityScore(withoutSkip) < computeAccessibilityScore(withSkipFr));
});

test("computeAccessibilityScore deducts for tables without th headers", () => {
  const withTh = `<html lang="en"><body>
    <a href="#main" id="skip">Skip to main content</a>
    <table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>
  </body></html>`;
  const withoutTh = `<html lang="en"><body>
    <a href="#main" id="skip">Skip to main content</a>
    <table><tr><td>Cell</td></tr></table>
  </body></html>`;
  assert.ok(computeAccessibilityScore(withoutTh) < computeAccessibilityScore(withTh));
});

test("computeAccessibilityScore produces different scores for pages with different issues", () => {
  // Page with several issues
  const lowQuality = `<html><body>
    <img src="a.png"><img src="b.png"><img src="c.png">
    <table><tr><td>data</td></tr></table>
    <input type="text">
  </body></html>`;
  // Page with no issues
  const highQuality = `<html lang="en"><body>
    <a href="#main" id="skip">Skip to main content</a>
    <img src="a.png" alt="logo">
    <table><tr><th scope="col">Header</th></tr></table>
    <label for="f">Field</label><input type="text" id="f">
  </body></html>`;
  assert.ok(
    computeAccessibilityScore(highQuality) > computeAccessibilityScore(lowQuality),
    "high quality page should score higher than low quality page"
  );
});

test("computeAccessibilityScore clamps result to [20, 100]", () => {
  // Maximally bad page
  const terrible = `<html><body>${"<img src='x.png'>".repeat(10)}${"<input type='text'>".repeat(10)}<table><tr><td>x</td></tr></table></body></html>`;
  const score = computeAccessibilityScore(terrible);
  assert.ok(score >= 20, "score should not go below 20");
  assert.ok(score <= 100, "score should not exceed 100");
});