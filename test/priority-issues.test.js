import test from "node:test";
import assert from "node:assert/strict";

import { summarizePriorityIssues } from "../src/aggregation/priority-issues.js";

test("summarizePriorityIssues ranks issues and tracks recurrence across reports", () => {
  const historical = [
    {
      run_date: "2026-03-25",
      bilingual_parity: {
        missing_counterparts: [
          { pair_id: "svc-a", has_en: true, has_fr: false }
        ],
        pairs: []
      },
      accessibility_statements: {
        missing_statement_examples: [{ inventory_id: "svc-a-en" }]
      },
      top_urls: [
        {
          inventory_id: "svc-a-en",
          scan_status: "success",
          page_load_count: 150000,
          lighthouse: { accessibility_score: 62 }
        }
      ]
    }
  ];

  const current = {
    run_date: "2026-03-26",
    bilingual_parity: {
      missing_counterparts: [
        {
          pair_id: "svc-a",
          service_name: "Service A",
          institution: "CRA",
          has_en: true,
          has_fr: false,
          url_en: "https://example.com/a",
          page_load_count: 150000,
          tier: "tier-1",
          service_pattern: "sign-in"
        }
      ],
      pairs: []
    },
    accessibility_statements: {
      missing_statement_examples: [
        {
          inventory_id: "svc-a-en",
          service_name: "Service A",
          institution: "CRA",
          language: "en",
          canonical_url: "https://example.com/a",
          page_load_count: 150000,
          tier: "tier-1",
          service_pattern: "sign-in"
        }
      ]
    },
    top_urls: [
      {
        inventory_id: "svc-a-en",
        service_name: "Service A",
        institution: "CRA",
        language: "en",
        canonical_url: "https://example.com/a",
        page_load_count: 150000,
        tier: "tier-1",
        service_pattern: "sign-in",
        scan_status: "success",
        lighthouse: { accessibility_score: 62 }
      }
    ]
  };

  const result = summarizePriorityIssues(current, historical);

  assert.ok(result.top_priority_issues.length >= 2);
  assert.ok(result.recurring_issues.length >= 2);
  assert.equal(result.top_priority_issues[0].institution, "CRA");
  assert.ok(result.top_priority_issues[0].priority_score >= result.top_priority_issues[1].priority_score);
  assert.ok(result.recurring_issues.every((issue) => issue.recurrence_days >= 2));
});