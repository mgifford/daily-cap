import { createHash } from "node:crypto";

function hashNumber(text) {
  const digest = createHash("sha256").update(text).digest("hex");
  return Number.parseInt(digest.slice(0, 8), 16);
}

function detectLanguage(html, fallback) {
  const langMatch = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  if (!langMatch) {
    return fallback || null;
  }
  const lang = String(langMatch[1]).toLowerCase();
  if (lang.startsWith("fr")) {
    return "fr";
  }
  if (lang.startsWith("en")) {
    return "en";
  }
  return null;
}

function findStatementLink(html) {
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const statementTerms = [
    /accessibility\s+statement/i,
    /statement\s+on\s+accessibility/i,
    /declaration\s+d['’]accessibilite/i,
    /accessibilite/i
  ];

  let match;
  while ((match = anchorPattern.exec(html)) !== null) {
    const href = match[1] || "";
    const text = String(match[2] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) {
      continue;
    }

    const combined = `${text} ${href}`;
    if (statementTerms.some((term) => term.test(combined))) {
      return {
        href,
        text
      };
    }
  }

  return null;
}

function extractSignals(html) {
  const normalized = String(html || "");

  const hasContactInfo =
    /mailto:/i.test(normalized) ||
    /\b1[-\s]?800[-\s]?\d{3}[-\s]?\d{4}\b/.test(normalized) ||
    /\bcontact\b|\bcontactez\b|\btelephone\b|\bcourriel\b/i.test(normalized);

  const mentionsComplianceStatus =
    /wcag|conformance|compliance|non-conform|partially conform/i.test(normalized) ||
    /conforme|conformite|non conforme/i.test(normalized);

  const mentionsAlternativeSupport =
    /alternative format|request accommodation|assistive support|support options/i.test(normalized) ||
    /format de rechange|mesure d['’]adaptation|aide supplementaire/i.test(normalized);

  const hasFreshnessMarker =
    /last updated|updated on|date modified|published on/i.test(normalized) ||
    /date de modification|derniere mise a jour|publie le/i.test(normalized);

  return {
    has_contact_info: hasContactInfo,
    mentions_compliance_status: mentionsComplianceStatus,
    mentions_alternative_support: mentionsAlternativeSupport,
    has_freshness_marker: hasFreshnessMarker
  };
}

function buildMockResult(target) {
  const seed = hashNumber(`${target.canonical_url}:${target.language}:statement`);
  const statementDetected = seed % 5 !== 0;
  const hasContactInfo = seed % 3 !== 0;
  const mentionsComplianceStatus = seed % 2 === 0;
  const mentionsAlternativeSupport = seed % 4 !== 0;
  const hasFreshnessMarker = seed % 6 !== 0;

  return {
    statement_detected: statementDetected,
    statement_link_text: statementDetected
      ? target.language === "fr"
        ? "Declaration d'accessibilite"
        : "Accessibility statement"
      : null,
    statement_link_url: statementDetected
      ? `${target.canonical_url.replace(/\/$/, "")}/accessibility`
      : null,
    has_contact_info: statementDetected ? hasContactInfo : false,
    mentions_compliance_status: statementDetected ? mentionsComplianceStatus : false,
    mentions_alternative_support: statementDetected ? mentionsAlternativeSupport : false,
    has_freshness_marker: statementDetected ? hasFreshnessMarker : false,
    detected_language: target.language || null,
    confidence: statementDetected ? 0.72 : 0.3
  };
}

export async function runAccessibilityStatementCheck(target, mode) {
  if (mode === "mock") {
    return buildMockResult(target);
  }

  const response = await fetch(target.canonical_url, {
    method: "GET",
    redirect: "follow"
  });
  const html = await response.text();
  const statementLink = findStatementLink(html);

  const signals = extractSignals(html);
  const statementDetected = Boolean(statementLink);

  return {
    statement_detected: statementDetected,
    statement_link_text: statementLink?.text || null,
    statement_link_url: statementLink?.href || null,
    has_contact_info: statementDetected ? signals.has_contact_info : false,
    mentions_compliance_status: statementDetected
      ? signals.mentions_compliance_status
      : false,
    mentions_alternative_support: statementDetected
      ? signals.mentions_alternative_support
      : false,
    has_freshness_marker: statementDetected ? signals.has_freshness_marker : false,
    detected_language: detectLanguage(html, target.language),
    confidence: statementDetected ? 0.8 : 0.35
  };
}
