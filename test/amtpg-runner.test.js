import test from "node:test";
import assert from "node:assert/strict";

import { runAmtpgScan } from "../src/scanners/amtpg-runner.js";

const TARGET = {
  canonical_url: "https://example.com/service",
  language: "en"
};

test("runAmtpgScan returns deterministic mock result", async () => {
  const a = await runAmtpgScan(TARGET, "mock");
  const b = await runAmtpgScan(TARGET, "mock");

  assert.deepEqual(a, b);
  assert.ok(a.scan_url.includes("amtpg.run/?url="));
  assert.equal(a.status, "available");
});
