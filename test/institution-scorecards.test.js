import test from "node:test";
import assert from "node:assert/strict";

import { summarizeInstitutionScorecards } from "../src/aggregation/institution-scorecards.js";

test("summarizeInstitutionScorecards groups issues and scan metrics by institution", () => {
  const topUrls = [
    {
      institution: "CRA",
      page_load_count: 100000,
      lighthouse: { accessibility_score: 70, performance_score: 60 }
    },
    {
      institution: "CRA",
      page_load_count: 50000,
      lighthouse: { accessibility_score: 80, performance_score: 75 }
    },
    {
      institution: "IRCC",
      page_load_count: 40000,
      lighthouse: { accessibility_score: 90, performance_score: 82 }
    }
  ];

  const priorityIssues = {
    all_issues: [
      { institution: "CRA", issue_type: "missing-french-counterpart", recurrence_days: 2, priority_score: 95 },
      { institution: "CRA", issue_type: "missing-accessibility-statement", recurrence_days: 1, priority_score: 70 },
      { institution: "IRCC", issue_type: "high-impact-low-accessibility", recurrence_days: 3, priority_score: 80 }
    ]
  };

  const result = summarizeInstitutionScorecards(topUrls, priorityIssues);

  assert.equal(result.summary.institutions, 2);
  assert.equal(result.summary.institutions_with_priority_issues, 2);
  assert.equal(result.scorecards[0].institution, "CRA");
  assert.equal(result.scorecards[0].missing_french_count, 1);
  assert.equal(result.scorecards[0].missing_statement_count, 1);
});