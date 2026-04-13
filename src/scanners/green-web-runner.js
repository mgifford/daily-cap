import { createHash } from "node:crypto";
import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";

function hashNumber(text) {
  const digest = createHash("sha256").update(text).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
}

function buildCheckUrl(url) {
  return `https://www.thegreenwebfoundation.org/green-web-check/?url=${encodeURIComponent(url)}`;
}

function buildMockResult(target) {
  const seed = hashNumber(`${target.canonical_url}:${target.language}:greenweb`);
  const isGreen = seed % 2 === 0;

  return {
    check_url: buildCheckUrl(target.canonical_url),
    is_green: isGreen,
    hosted_by: isGreen ? "verified-green-provider" : "unknown-provider",
    checked_with: "green-web-foundation",
    confidence: isGreen ? 0.75 : 0.4
  };
}

export async function runGreenWebCheck(target, mode) {
  if (mode === "mock") {
    return buildMockResult(target);
  }

  const checkUrl = buildCheckUrl(target.canonical_url);

  try {
    const response = await fetchWithTimeout(
      `https://api.thegreenwebfoundation.org/greencheck/${encodeURIComponent(target.canonical_url)}`,
      { method: "GET", redirect: "follow" },
      15_000
    );

    if (!response.ok) {
      return {
        check_url: checkUrl,
        is_green: null,
        hosted_by: null,
        checked_with: "green-web-foundation",
        confidence: 0,
        failure_reason: `green-web-api-http-${response.status}`
      };
    }

    const payload = await response.json();
    const isGreen = typeof payload.green === "boolean" ? payload.green : null;
    const hostedBy =
      typeof payload.hosted_by === "string"
        ? payload.hosted_by
        : typeof payload.hostedby === "string"
          ? payload.hostedby
          : null;

    return {
      check_url: checkUrl,
      is_green: isGreen,
      hosted_by: hostedBy,
      checked_with: "green-web-foundation",
      confidence: isGreen === null ? 0.45 : 0.85
    };
  } catch (error) {
    return {
      check_url: checkUrl,
      is_green: null,
      hosted_by: null,
      checked_with: "green-web-foundation",
      confidence: 0,
      failure_reason: error instanceof Error ? error.message : String(error)
    };
  }
}
