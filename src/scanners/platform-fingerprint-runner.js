import { createHash } from "node:crypto";
import { fetchWithTimeout } from "../utils/fetch-with-timeout.js";

function hashNumber(text) {
  const digest = createHash("sha256").update(text).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
}

function detectCms(html, headers = {}) {
  const body = String(html || "");
  const poweredBy = String(headers["x-powered-by"] || "");

  if (/drupal-settings-json|\/sites\/default\/files|drupal/i.test(body)) {
    return "drupal";
  }

  if (/wp-content|wp-includes|wordpress/i.test(body)) {
    return "wordpress";
  }

  if (/AEM|adobe\s+experience\s+manager|cq:\/|\/_jcr_content/i.test(body)) {
    return "aem";
  }

  if (/sharepoint|spclient|_layouts\//i.test(body)) {
    return "sharepoint";
  }

  if (/xenforo|vbulletin|discourse/i.test(body)) {
    return "forum-platform";
  }

  if (/php\/?\d|php/i.test(poweredBy)) {
    return "php-custom";
  }

  return "unknown";
}

function detectDesignSystem(html) {
  const body = String(html || "");

  if (/wet-boew|gcweb|canada\.ca\/wet-boew|theme-gc-intranet/i.test(body)) {
    return "gcweb-wet";
  }

  if (/gcds|design\.system|gc-design-system|canada\.ca\/design-system/i.test(body)) {
    return "gcds";
  }

  if (/bootstrap(\.min)?\.css|class=\"[^\"]*\bcontainer\b/i.test(body)) {
    return "bootstrap-like";
  }

  return "unknown";
}

function detectHostingHints(headers = {}) {
  const server = String(headers.server || "").toLowerCase();
  const via = String(headers.via || "").toLowerCase();

  if (/cloudfront/.test(via) || /cloudfront/.test(server)) {
    return "aws-cloudfront";
  }
  if (/azure/.test(server) || /azure/.test(via)) {
    return "azure";
  }
  if (/akamai/.test(via) || /akamai/.test(server)) {
    return "akamai";
  }
  if (/fastly/.test(via) || /fastly/.test(server)) {
    return "fastly";
  }
  return "unknown";
}

function buildMockFingerprint(target) {
  const seed = hashNumber(`${target.canonical_url}:${target.language}:platform`);

  const cmsCandidates = ["drupal", "wordpress", "aem", "php-custom", "unknown"];
  const dsCandidates = ["gcweb-wet", "gcds", "bootstrap-like", "unknown"];
  const hostCandidates = ["aws-cloudfront", "azure", "akamai", "unknown"];

  const cms = cmsCandidates[seed % cmsCandidates.length];
  const designSystem = dsCandidates[(seed >>> 3) % dsCandidates.length];
  const hostingHint = hostCandidates[(seed >>> 5) % hostCandidates.length];

  return {
    cms,
    design_system: designSystem,
    hosting_hint: hostingHint,
    confidence: cms === "unknown" && designSystem === "unknown" ? 0.35 : 0.68
  };
}

export async function runPlatformFingerprint(target, mode) {
  if (mode === "mock") {
    return buildMockFingerprint(target);
  }

  const response = await fetchWithTimeout(target.canonical_url, {
    method: "GET",
    redirect: "follow"
  });

  const html = await response.text();
  const headers = {
    server: response.headers.get("server") || "",
    via: response.headers.get("via") || "",
    "x-powered-by": response.headers.get("x-powered-by") || ""
  };

  const cms = detectCms(html, headers);
  const designSystem = detectDesignSystem(html);
  const hostingHint = detectHostingHints(headers);

  return {
    cms,
    design_system: designSystem,
    hosting_hint: hostingHint,
    confidence: cms !== "unknown" || designSystem !== "unknown" ? 0.8 : 0.45
  };
}
