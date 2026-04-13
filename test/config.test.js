import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateConfig } from "../src/config/schema.js";
import { loadConfig, applyRuntimeOverrides } from "../src/config/loader.js";

const VALID_CONFIG = {
  scan: {
    url_limit: 130,
    history_lookback_days: 30,
    dashboard_display_days: 14,
    concurrency: 2,
    lighthouse_contexts: [
      { form_factor: "desktop", color_scheme: "light" },
      { form_factor: "mobile", color_scheme: "dark" }
    ]
  },
  impact: {
    prevalence_rates: { vision: 0.03, hearing: 0.04 },
    severity_weights: {
      critical: 1.0,
      serious: 0.6,
      moderate: 0.3,
      minor: 0.1
    },
    fallback_severity_weight: 0.2
  }
};

describe("validateConfig", () => {
  it("accepts a valid config", () => {
    const result = validateConfig(VALID_CONFIG);
    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
  });

  it("rejects a non-object", () => {
    const result = validateConfig(null);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
  });

  it("rejects missing scan section", () => {
    const result = validateConfig({ impact: VALID_CONFIG.impact });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("scan")));
  });

  it("rejects missing impact section", () => {
    const result = validateConfig({ scan: VALID_CONFIG.scan });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("impact")));
  });

  it("rejects url_limit of zero", () => {
    const config = { ...VALID_CONFIG, scan: { ...VALID_CONFIG.scan, url_limit: 0 } };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("url_limit")));
  });

  it("rejects non-integer url_limit", () => {
    const config = { ...VALID_CONFIG, scan: { ...VALID_CONFIG.scan, url_limit: 1.5 } };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
  });

  it("rejects empty lighthouse_contexts", () => {
    const config = { ...VALID_CONFIG, scan: { ...VALID_CONFIG.scan, lighthouse_contexts: [] } };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("lighthouse_contexts")));
  });

  it("rejects invalid form_factor in lighthouse_contexts", () => {
    const config = {
      ...VALID_CONFIG,
      scan: {
        ...VALID_CONFIG.scan,
        lighthouse_contexts: [{ form_factor: "tablet", color_scheme: "light" }]
      }
    };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("form_factor")));
  });

  it("rejects invalid color_scheme in lighthouse_contexts", () => {
    const config = {
      ...VALID_CONFIG,
      scan: {
        ...VALID_CONFIG.scan,
        lighthouse_contexts: [{ form_factor: "desktop", color_scheme: "sepia" }]
      }
    };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("color_scheme")));
  });

  it("rejects prevalence rate outside 0-1", () => {
    const config = {
      ...VALID_CONFIG,
      impact: {
        ...VALID_CONFIG.impact,
        prevalence_rates: { vision: 1.5 }
      }
    };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("prevalence_rates.vision")));
  });

  it("rejects empty prevalence_rates", () => {
    const config = {
      ...VALID_CONFIG,
      impact: { ...VALID_CONFIG.impact, prevalence_rates: {} }
    };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
  });

  it("rejects missing required severity weight", () => {
    const { critical: _removed, ...rest } = VALID_CONFIG.impact.severity_weights;
    const config = {
      ...VALID_CONFIG,
      impact: { ...VALID_CONFIG.impact, severity_weights: rest }
    };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("severity_weights.critical")));
  });

  it("rejects severity weight outside 0-1", () => {
    const config = {
      ...VALID_CONFIG,
      impact: {
        ...VALID_CONFIG.impact,
        severity_weights: { ...VALID_CONFIG.impact.severity_weights, critical: 1.5 }
      }
    };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
  });

  it("rejects fallback_severity_weight outside 0-1", () => {
    const config = {
      ...VALID_CONFIG,
      impact: { ...VALID_CONFIG.impact, fallback_severity_weight: -0.1 }
    };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
  });

  it("accepts optional sources section when it is an object", () => {
    const config = {
      ...VALID_CONFIG,
      sources: { canada_recent_activity_url: "https://www.canada.ca/en/analytics/recent-activity.html" }
    };
    const result = validateConfig(config);
    assert.equal(result.valid, true);
  });

  it("rejects sources section when it is not an object", () => {
    const config = { ...VALID_CONFIG, sources: "not-an-object" };
    const result = validateConfig(config);
    assert.equal(result.valid, false);
  });

  it("accepts config without optional dashboard_display_days", () => {
    const { dashboard_display_days: _removed, ...scanWithout } = VALID_CONFIG.scan;
    const config = { ...VALID_CONFIG, scan: scanWithout };
    const result = validateConfig(config);
    assert.equal(result.valid, true);
  });
});

describe("loadConfig", () => {
  it("loads and validates the default config.yaml without error", () => {
    const config = loadConfig();
    assert.ok(config.scan);
    assert.ok(config.impact);
    assert.ok(typeof config.scan.url_limit === "number");
    assert.ok(Array.isArray(config.scan.lighthouse_contexts));
  });

  it("throws when the config file does not exist", () => {
    assert.throws(
      () => loadConfig("/nonexistent/path/config.yaml"),
      /Failed to read config file/
    );
  });
});

describe("applyRuntimeOverrides", () => {
  it("overrides url_limit", () => {
    const base = loadConfig();
    const result = applyRuntimeOverrides(base, { urlLimit: 25 });
    assert.equal(result.scan.url_limit, 25);
  });

  it("overrides concurrency", () => {
    const base = loadConfig();
    const result = applyRuntimeOverrides(base, { concurrency: 4 });
    assert.equal(result.scan.concurrency, 4);
  });

  it("does not mutate the original config", () => {
    const base = loadConfig();
    const original = base.scan.url_limit;
    applyRuntimeOverrides(base, { urlLimit: 5 });
    assert.equal(base.scan.url_limit, original);
  });

  it("throws when override produces an invalid config", () => {
    const base = loadConfig();
    assert.throws(
      () => applyRuntimeOverrides(base, { urlLimit: 0 }),
      /Config validation failed/
    );
  });
});
