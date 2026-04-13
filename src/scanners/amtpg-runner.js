import { createHash } from "node:crypto";
import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";

function hashNumber(text) {
  const digest = createHash("sha256").update(text).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
}

function buildScanUrl(url) {
  return `https://amtpg.run/?url=${encodeURIComponent(url)}`;
}

function buildMockResult(target) {
  const seed = hashNumber(`${target.canonical_url}:${target.language}:amtpg`);
  const grade = ["A", "B", "C", "D"][seed % 4];

  return {
    scan_url: buildScanUrl(target.canonical_url),
    status: "available",
    grade
  };
}

export async function runAmtpgScan(target, mode) {
  if (mode === "mock") {
    return buildMockResult(target);
  }

  const scanUrl = buildScanUrl(target.canonical_url);

  try {
    const response = await fetchWithTimeout("https://amtpg.run/", {
      method: "GET",
      redirect: "follow"
    }, 15_000);

    if (!response.ok) {
      return {
        scan_url: scanUrl,
        status: "unavailable",
        grade: null,
        failure_reason: `amtpg-http-${response.status}`
      };
    }

    return {
      scan_url: scanUrl,
      status: "available",
      grade: null
    };
  } catch (error) {
    return {
      scan_url: scanUrl,
      status: "unavailable",
      grade: null,
      failure_reason: error instanceof Error ? error.message : String(error)
    };
  }
}
