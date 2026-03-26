import test from "node:test";
import assert from "node:assert/strict";

import { summarizeBarrierHistory } from "../src/aggregation/barrier-history.js";

test("summarizeBarrierHistory builds ordered daily barrier points", () => {
  const current = {
    run_date: "2026-03-26",
    scan_summary: { total: 10 },
    accessibility_statements: { summary: { statements_detected: 8 } },
    bilingual_parity: {
      summary: {
        missing_french: 4,
        missing_english: 0,
        high_accessibility_gap_pairs: 2,
        average_absolute_accessibility_gap: 11.5
      }
    },
    impact_model: { summary: { directional_affected_share_percent: 35 } }
  };

  const history = [
    {
      run_date: "2026-03-24",
      scan_summary: { total: 10 },
      accessibility_statements: { summary: { statements_detected: 9 } },
      bilingual_parity: { summary: { missing_french: 2, missing_english: 0, high_accessibility_gap_pairs: 1, average_absolute_accessibility_gap: 6 } },
      impact_model: { summary: { directional_affected_share_percent: 21 } }
    },
    {
      run_date: "2026-03-25",
      scan_summary: { total: 10 },
      accessibility_statements: { summary: { statements_detected: 7 } },
      bilingual_parity: { summary: { missing_french: 3, missing_english: 0, high_accessibility_gap_pairs: 1, average_absolute_accessibility_gap: 9 } },
      impact_model: { summary: { directional_affected_share_percent: 28 } }
    }
  ];

  const result = summarizeBarrierHistory(current, history);

  assert.equal(result.summary.points, 3);
  assert.equal(result.summary.start_date, "2026-03-24");
  assert.equal(result.summary.end_date, "2026-03-26");
  assert.equal(result.points[2].missing_statements, 2);
  assert.equal(result.points[2].missing_french, 4);
});