import test from "node:test";
import assert from "node:assert/strict";

import { runGreenWebCheck } from "../src/scanners/green-web-runner.js";

const TARGET = {
  canonical_url: "https://example.com/service",
  language: "en"
};

test("runGreenWebCheck returns deterministic mock result", async () => {
  const a = await runGreenWebCheck(TARGET, "mock");
  const b = await runGreenWebCheck(TARGET, "mock");

  assert.deepEqual(a, b);
  assert.ok(a.check_url.includes("thegreenwebfoundation.org/green-web-check/?url="));
  assert.equal(typeof a.is_green, "boolean");
});
