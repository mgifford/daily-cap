import test from "node:test";
import assert from "node:assert";
import { computeTopAxeIssues } from "../src/aggregation/axe-top-issues.js";

test("computeTopAxeIssues returns empty when no successful scans", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/1",
      scan_status: "failed",
      scangov: { critical: 1, serious: 2, moderate: 1, minor: 1 }
    },
    {
      canonical_url: "https://example.com/2",
      scan_status: "failed",
      scangov: { critical: 0, serious: 0, moderate: 0, minor: 0 }
    }
  ];

  const result = computeTopAxeIssues(scanned);

  assert.deepEqual(result.summary, {
    scanned_urls: 0,
    urls_with_violations: 0,
    total_violations: 0
  });
  assert.equal(result.top_issues.length, 0);
});

test("computeTopAxeIssues aggregates violations by severity", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/1",
      language: "en",
      service_name: "Service 1",
      scan_status: "success",
      scangov: { critical: 2, serious: 1, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/2",
      language: "fr",
      service_name: "Service 2",
      scan_status: "success",
      scangov: { critical: 1, serious: 2, moderate: 1, minor: 0 }
    },
    {
      canonical_url: "https://example.com/3",
      language: "en",
      service_name: "Service 3",
      scan_status: "success",
      scangov: { critical: 0, serious: 0, moderate: 3, minor: 2 }
    }
  ];

  const result = computeTopAxeIssues(scanned);

  assert.equal(result.summary.scanned_urls, 3);
  assert.equal(result.summary.total_violations, 12); // 2+1+1+2+1+3+2
  assert.equal(result.top_issues.length, 4);

  // Check critical issues are first
  assert.equal(result.top_issues[0].severity, "critical");
  assert.equal(result.top_issues[0].total_occurrences, 3);
  assert.equal(result.top_issues[0].affected_pages, 2);

  // Check serious issues
  assert.equal(result.top_issues[1].severity, "serious");
  assert.equal(result.top_issues[1].total_occurrences, 3);
  assert.equal(result.top_issues[1].affected_pages, 2);

  // Check moderate issues
  assert.equal(result.top_issues[2].severity, "moderate");
  assert.equal(result.top_issues[2].total_occurrences, 4);
  assert.equal(result.top_issues[2].affected_pages, 2);

  // Check minor issues
  assert.equal(result.top_issues[3].severity, "minor");
  assert.equal(result.top_issues[3].total_occurrences, 2);
  assert.equal(result.top_issues[3].affected_pages, 1);
});

test("computeTopAxeIssues includes sample pages with violation counts", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/a",
      language: "en",
      service_name: "Service A",
      scan_status: "success",
      scangov: { critical: 5, serious: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/b",
      language: "fr",
      service_name: "Service B",
      scan_status: "success",
      scangov: { critical: 3, serious: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/c",
      language: "en",
      service_name: "Service C",
      scan_status: "success",
      scangov: { critical: 1, serious: 0, moderate: 0, minor: 0 }
    }
  ];

  const result = computeTopAxeIssues(scanned);
  const criticalIssue = result.top_issues[0];

  assert.equal(criticalIssue.severity, "critical");
  assert.equal(criticalIssue.sample_pages.length, 3); // All 3 pages have critical
  assert.equal(criticalIssue.sample_pages[0].service_name, "Service A");
  assert.equal(criticalIssue.sample_pages[0].count, 5);
  assert.equal(criticalIssue.sample_pages[1].service_name, "Service B");
  assert.equal(criticalIssue.sample_pages[1].count, 3);
});

test("computeTopAxeIssues limits results to default limit", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/1",
      language: "en",
      service_name: "Service 1",
      scan_status: "success",
      scangov: { critical: 1, serious: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/2",
      language: "en",
      service_name: "Service 2",
      scan_status: "success",
      scangov: { critical: 0, serious: 1, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/3",
      language: "en",
      service_name: "Service 3",
      scan_status: "success",
      scangov: { critical: 0, serious: 0, moderate: 1, minor: 0 }
    },
    {
      canonical_url: "https://example.com/4",
      language: "en",
      service_name: "Service 4",
      scan_status: "success",
      scangov: { critical: 0, serious: 0, moderate: 0, minor: 1 }
    }
  ];

  const result = computeTopAxeIssues(scanned, { limit: 2 });

  assert.equal(result.top_issues.length, 2);
  assert.equal(result.top_issues[0].severity, "critical");
  assert.equal(result.top_issues[1].severity, "serious");
});

test("computeTopAxeIssues calculates average per page correctly", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/1",
      language: "en",
      service_name: "Service 1",
      scan_status: "success",
      scangov: { critical: 5, serious: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/2",
      language: "en",
      service_name: "Service 2",
      scan_status: "success",
      scangov: { critical: 4, serious: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/3",
      language: "en",
      service_name: "Service 3",
      scan_status: "success",
      scangov: { critical: 1, serious: 0, moderate: 0, minor: 0 }
    }
  ];

  const result = computeTopAxeIssues(scanned);
  const criticalIssue = result.top_issues[0];

  // (5 + 4 + 1) / 3 = 10 / 3 = 3.33... rounds to 3.3
  assert.equal(criticalIssue.average_per_page, 3.3);
});

test("computeTopAxeIssues ignores scans without violations", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/1",
      language: "en",
      service_name: "Service 1",
      scan_status: "success",
      scangov: { critical: 0, serious: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/2",
      language: "en",
      service_name: "Service 2",
      scan_status: "success",
      scangov: { critical: 2, serious: 1, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/3",
      language: "en",
      service_name: "Service 3",
      scan_status: "success",
      scangov: null
    }
  ];

  const result = computeTopAxeIssues(scanned);

  assert.equal(result.summary.scanned_urls, 3);
  // Only Service 2 has violations
  assert.equal(result.top_issues[0].affected_pages, 1);
});

test("computeTopAxeIssues includes language in sample pages", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/en",
      language: "en",
      service_name: "Service EN",
      scan_status: "success",
      scangov: { critical: 1, serious: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/fr",
      language: "fr",
      service_name: "Service FR",
      scan_status: "success",
      scangov: { critical: 1, serious: 0, moderate: 0, minor: 0 }
    }
  ];

  const result = computeTopAxeIssues(scanned);
  const criticalIssue = result.top_issues[0];

  assert.equal(criticalIssue.sample_pages[0].language, "en");
  assert.equal(criticalIssue.sample_pages[1].language, "fr");
});

test("computeTopAxeIssues sorts sample pages by occurrence count descending", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/low",
      language: "en",
      service_name: "Low Issues",
      scan_status: "success",
      scangov: { serious: 1, critical: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/mid",
      language: "en",
      service_name: "Mid Issues",
      scan_status: "success",
      scangov: { serious: 5, critical: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/high",
      language: "en",
      service_name: "High Issues",
      scan_status: "success",
      scangov: { serious: 10, critical: 0, moderate: 0, minor: 0 }
    }
  ];

  const result = computeTopAxeIssues(scanned);
  const seriousIssue = result.top_issues[0];

  assert.equal(seriousIssue.sample_pages[0].service_name, "High Issues");
  assert.equal(seriousIssue.sample_pages[0].count, 10);
  assert.equal(seriousIssue.sample_pages[1].service_name, "Mid Issues");
  assert.equal(seriousIssue.sample_pages[1].count, 5);
  assert.equal(seriousIssue.sample_pages[2].service_name, "Low Issues");
  assert.equal(seriousIssue.sample_pages[2].count, 1);
});

test("computeTopAxeIssues limits sample pages to 5 per issue", () => {
  const scanned = Array.from({ length: 10 }, (_, i) => ({
    canonical_url: `https://example.com/${i}`,
    language: "en",
    service_name: `Service ${i}`,
    scan_status: "success",
    scangov: {
      critical: 10 - i, // Decreasing counts to test sorting
      serious: 0,
      moderate: 0,
      minor: 0
    }
  }));

  const result = computeTopAxeIssues(scanned);
  const criticalIssue = result.top_issues[0];

  assert.equal(criticalIssue.sample_pages.length, 5);
  // Should include top 5 by count
  assert.equal(criticalIssue.sample_pages[0].count, 10);
  assert.equal(criticalIssue.sample_pages[4].count, 6);
});

test("computeTopAxeIssues handles missing scangov fields gracefully", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/1",
      language: "en",
      service_name: "Service 1",
      scan_status: "success",
      scangov: { critical: 1 } // Missing serious, moderate, minor
    },
    {
      canonical_url: "https://example.com/2",
      language: "en",
      service_name: "Service 2",
      scan_status: "success",
      scangov: {} // All missing
    }
  ];

  const result = computeTopAxeIssues(scanned);

  assert.equal(result.summary.scanned_urls, 2);
  assert.equal(result.summary.total_violations, 1);
  assert.equal(result.top_issues.length, 1);
  assert.equal(result.top_issues[0].severity, "critical");
});

test("computeTopAxeIssues returns sorted issues by severity order", () => {
  const scanned = [
    {
      canonical_url: "https://example.com/1",
      language: "en",
      service_name: "Service 1",
      scan_status: "success",
      scangov: { critical: 10, serious: 0, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/2",
      language: "en",
      service_name: "Service 2",
      scan_status: "success",
      scangov: { critical: 0, serious: 20, moderate: 0, minor: 0 }
    },
    {
      canonical_url: "https://example.com/3",
      language: "en",
      service_name: "Service 3",
      scan_status: "success",
      scangov: { critical: 0, serious: 0, moderate: 5, minor: 0 }
    }
  ];

  const result = computeTopAxeIssues(scanned);

  // Should be sorted by severity order: critical > serious > moderate > minor
  assert.equal(result.top_issues[0].severity, "critical");
  assert.equal(result.top_issues[0].total_occurrences, 10);
  assert.equal(result.top_issues[1].severity, "serious");
  assert.equal(result.top_issues[1].total_occurrences, 20);
  assert.equal(result.top_issues[2].severity, "moderate");
  assert.equal(result.top_issues[2].total_occurrences, 5);
});
