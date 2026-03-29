import test from "node:test";
import assert from "node:assert/strict";

import {
  fetchWithTimeout,
  DEFAULT_FETCH_TIMEOUT_MS,
  DAILY_CAP_USER_AGENT
} from "../src/utils/fetch-with-timeout.js";

test("fetchWithTimeout resolves with a response for a successful URL", async () => {
  // Mock the global fetch for this test
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://example.com/");
    assert.equal(options.headers["User-Agent"], DAILY_CAP_USER_AGENT);
    assert.ok(options.signal instanceof AbortSignal);
    return { ok: true, status: 200, text: async () => "hello" };
  };

  try {
    const response = await fetchWithTimeout("https://example.com/");
    assert.equal(response.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchWithTimeout allows caller headers to override User-Agent", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers["User-Agent"], "MyCustomAgent/1.0");
    return { ok: true, status: 200 };
  };

  try {
    await fetchWithTimeout("https://example.com/", { headers: { "User-Agent": "MyCustomAgent/1.0" } });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchWithTimeout aborts after the given timeout", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_url, options) => {
    // Return a promise that only resolves when aborted
    return new Promise((_resolve, reject) => {
      options.signal.addEventListener("abort", () =>
        reject(Object.assign(new Error("fetch failed"), { cause: new Error("The operation was aborted") }))
      );
    });
  };

  try {
    await assert.rejects(
      () => fetchWithTimeout("https://example.com/", {}, 50),
      (err) => err.message === "fetch failed"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("DEFAULT_FETCH_TIMEOUT_MS is a positive number", () => {
  assert.ok(typeof DEFAULT_FETCH_TIMEOUT_MS === "number");
  assert.ok(DEFAULT_FETCH_TIMEOUT_MS > 0);
});

test("DAILY_CAP_USER_AGENT is a non-empty string", () => {
  assert.ok(typeof DAILY_CAP_USER_AGENT === "string");
  assert.ok(DAILY_CAP_USER_AGENT.length > 0);
});
