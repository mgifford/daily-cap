import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FPS_CODES, FPS_LABELS, FPS_CLAUSES, FPS_DESCRIPTIONS, FPS_SVGS } from "../src/data/fps-labels.js";
import { AXE_TO_FPS, getFpsCodesForRule, hasFpsMapping } from "../src/data/axe-to-fps.js";
import {
  STATISTICS_CANADA_DISABILITY_STATS,
  isStatsDataStale,
  getFpsPrevalenceRates
} from "../src/data/statistics-canada-disability-stats.js";

describe("fps-labels", () => {
  it("defines exactly 11 FPS codes", () => {
    assert.equal(FPS_CODES.length, 11);
  });

  it("FPS_LABELS has an entry for every code", () => {
    for (const code of FPS_CODES) {
      assert.ok(FPS_LABELS[code], `Missing label for ${code}`);
    }
  });

  it("FPS_CLAUSES has an entry for every code", () => {
    for (const code of FPS_CODES) {
      assert.ok(FPS_CLAUSES[code], `Missing clause for ${code}`);
    }
  });

  it("FPS_CLAUSES reference section 4.2.x", () => {
    for (const code of FPS_CODES) {
      assert.ok(FPS_CLAUSES[code].startsWith("4.2."), `Clause for ${code} does not start with 4.2.`);
    }
  });

  it("FPS_DESCRIPTIONS has an entry for every code", () => {
    for (const code of FPS_CODES) {
      assert.ok(FPS_DESCRIPTIONS[code], `Missing description for ${code}`);
    }
  });

  it("FPS_SVGS has an entry for every code", () => {
    for (const code of FPS_CODES) {
      assert.ok(FPS_SVGS[code], `Missing SVG for ${code}`);
    }
  });

  it("every SVG has role=img, title, and desc", () => {
    for (const code of FPS_CODES) {
      const svg = FPS_SVGS[code];
      assert.ok(svg.includes('role="img"'), `${code} SVG missing role="img"`);
      assert.ok(svg.includes("<title>"), `${code} SVG missing <title>`);
      assert.ok(svg.includes("<desc>"), `${code} SVG missing <desc>`);
    }
  });

  it("clause numbers are sequential from 4.2.1 to 4.2.11", () => {
    const clauses = FPS_CODES.map((code) => FPS_CLAUSES[code]);
    const expected = Array.from({ length: 11 }, (_, i) => `4.2.${i + 1}`);
    assert.deepEqual(clauses, expected);
  });
});

describe("axe-to-fps", () => {
  it("has entries for common axe rules", () => {
    const commonRules = ["color-contrast", "image-alt", "label", "button-name", "link-name"];
    for (const rule of commonRules) {
      assert.ok(hasFpsMapping(rule), `Missing FPS mapping for ${rule}`);
    }
  });

  it("all mapped FPS codes are valid", () => {
    const validCodes = new Set(FPS_CODES);
    for (const [ruleId, codes] of AXE_TO_FPS) {
      for (const code of codes) {
        assert.ok(validCodes.has(code), `Rule ${ruleId} maps to unknown FPS code: ${code}`);
      }
    }
  });

  it("every mapped rule has at least one FPS code", () => {
    for (const [ruleId, codes] of AXE_TO_FPS) {
      assert.ok(codes.length > 0, `Rule ${ruleId} has empty FPS mapping`);
    }
  });

  it("getFpsCodesForRule returns codes for known rule", () => {
    const codes = getFpsCodesForRule("color-contrast");
    assert.ok(codes.length > 0);
    assert.ok(codes.includes("LV"), "color-contrast should map to LV");
    assert.ok(codes.includes("WPC"), "color-contrast should map to WPC");
  });

  it("getFpsCodesForRule returns empty array for unknown rule", () => {
    const codes = getFpsCodesForRule("not-a-real-rule-xyz");
    assert.deepEqual(codes, []);
  });

  it("hasFpsMapping returns false for unknown rule", () => {
    assert.equal(hasFpsMapping("not-a-real-rule-xyz"), false);
  });

  it("target-size maps to LMS and LR", () => {
    const codes = getFpsCodesForRule("target-size");
    assert.ok(codes.includes("LMS"), "target-size should map to LMS");
    assert.ok(codes.includes("LR"), "target-size should map to LR");
  });

  it("blink and marquee map to PST (photosensitive seizure)", () => {
    assert.ok(getFpsCodesForRule("blink").includes("PST"));
    assert.ok(getFpsCodesForRule("marquee").includes("PST"));
  });

  it("html-has-lang maps to LC (cognition/language)", () => {
    assert.ok(getFpsCodesForRule("html-has-lang").includes("LC"));
  });
});

describe("statistics-canada-disability-stats", () => {
  it("has the expected top-level fields", () => {
    assert.ok(STATISTICS_CANADA_DISABILITY_STATS.vintage_year);
    assert.ok(STATISTICS_CANADA_DISABILITY_STATS.next_review_date);
    assert.ok(STATISTICS_CANADA_DISABILITY_STATS.source);
    assert.ok(STATISTICS_CANADA_DISABILITY_STATS.source_url);
    assert.ok(STATISTICS_CANADA_DISABILITY_STATS.canada_population);
    assert.ok(STATISTICS_CANADA_DISABILITY_STATS.fps_rates);
  });

  it("source_url points to Statistics Canada", () => {
    assert.ok(
      STATISTICS_CANADA_DISABILITY_STATS.source_url.includes("statcan.gc.ca"),
      "source_url should point to statcan.gc.ca"
    );
  });

  it("vintage_year is 2022 (CSD 2022)", () => {
    assert.equal(STATISTICS_CANADA_DISABILITY_STATS.vintage_year, 2022);
  });

  it("fps_rates has entries for 10 FPS codes (P excluded)", () => {
    const codes = Object.keys(STATISTICS_CANADA_DISABILITY_STATS.fps_rates);
    assert.equal(codes.length, 10, "Should have 10 FPS rates (P excluded)");
    assert.ok(!codes.includes("P"), "P (Privacy) should not have a prevalence rate");
  });

  it("all rates are between 0 and 1", () => {
    for (const [code, data] of Object.entries(STATISTICS_CANADA_DISABILITY_STATS.fps_rates)) {
      assert.ok(data.rate >= 0 && data.rate <= 1, `Rate for ${code} out of range: ${data.rate}`);
    }
  });

  it("all entries have estimated_population and source_note", () => {
    for (const [code, data] of Object.entries(STATISTICS_CANADA_DISABILITY_STATS.fps_rates)) {
      assert.ok(typeof data.estimated_population === "number", `${code} missing estimated_population`);
      assert.ok(typeof data.source_note === "string" && data.source_note.length > 0, `${code} missing source_note`);
    }
  });

  it("getFpsPrevalenceRates returns a flat code->rate map", () => {
    const rates = getFpsPrevalenceRates();
    assert.ok(typeof rates === "object");
    assert.ok(typeof rates.WV === "number");
    assert.ok(typeof rates.LC === "number");
    assert.ok(!("P" in rates), "P should not be in prevalence rates");
  });

  it("isStatsDataStale returns false for a date before next_review_date", () => {
    assert.equal(isStatsDataStale("2026-01-01"), false);
  });

  it("isStatsDataStale returns true for a date on or after next_review_date", () => {
    assert.equal(isStatsDataStale("2027-01-01"), true);
    assert.equal(isStatsDataStale("2027-06-01"), true);
  });
});
