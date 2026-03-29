import { createHash } from "node:crypto";
import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";

function hashNumber(text) {
  const digest = createHash("sha256").update(text).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
}

export async function runScanGov(target, mode) {
  const seed = hashNumber(`${target.canonical_url}:${target.language}`);

  if (mode === "mock") {
    return {
      critical: seed % 2,
      serious: seed % 5,
      moderate: seed % 8,
      minor: seed % 13
    };
  }

  const response = await fetchWithTimeout(target.canonical_url, {
    method: "GET",
    redirect: "follow"
  });
  const html = await response.text();

  const hasSkipLink = /skip|passer/i.test(html);
  const hasForm = /<form/i.test(html);

  return {
    critical: hasForm ? 0 : 1,
    serious: hasSkipLink ? 1 : 3,
    moderate: html.includes("aria-") ? 2 : 5,
    minor: 4
  };
}
