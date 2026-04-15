import test from "node:test";
import assert from "node:assert/strict";

import { runScans } from "../src/scanners/execution-manager.js";

const TARGET = {
  inventory_id: "svc-1-en",
  canonical_url: "https://example.com/service",
  language: "en",
  service_name: "Service",
  institution: "Test"
};

test("runScans keeps scan successful when axe fails but lighthouse succeeds", async () => {
  const originalFetch = globalThis.fetch;
  const originalChromePath = process.env.CHROME_PATH;

  globalThis.fetch = async (url) => {
    const asString = String(url);
    if (asString.startsWith("https://api.thegreenwebfoundation.org/")) {
      return {
        ok: true,
        json: async () => ({ green: true, hosted_by: "test-host" })
      };
    }

    return {
      ok: true,
      status: 200,
      text: async () =>
        "<html lang=\"en\"><head><title>Example</title></head><body><a href=\"/accessibility\">Accessibility statement</a></body></html>",
      headers: { get: () => "" }
    };
  };
  process.env.CHROME_PATH = "/definitely/missing/chrome";

  try {
    const results = await runScans([TARGET], {
      mode: "live",
      concurrency: 1,
      lighthouseContexts: [{ form_factor: "desktop", color_scheme: "light" }],
      axeContexts: [{ form_factor: "desktop", color_scheme: "light" }]
    });

    assert.equal(results.length, 1);
    assert.equal(results[0].scan_status, "success");
    assert.equal(results[0].failure_reason, null);
    assert.ok(results[0].lighthouse);
    assert.equal(results[0].axe, null);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalChromePath === undefined) {
      delete process.env.CHROME_PATH;
    } else {
      process.env.CHROME_PATH = originalChromePath;
    }
  }
});
