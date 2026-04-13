/**
 * Canadian disability prevalence data mapped to CAN/ASC EN 301 549:2024 Functional
 * Performance Statement (FPS) codes.
 *
 * Used for directional impact modeling in Daily CAP. These figures are population-level
 * estimates applied to web traffic counts to produce rough directional estimates.
 * They are not precise measurements of harm.
 *
 * ============================================================
 * PRIMARY SOURCE
 * ============================================================
 * Statistics Canada, Canadian Survey on Disability (CSD), 2022
 * Catalogue no. 89-654-X
 * https://www150.statcan.gc.ca/n1/pub/89-654-x/89-654-x2023002-eng.htm
 *
 * The CSD 2022 is the most comprehensive source of disability prevalence in Canada.
 * It covers Canadians aged 15 and over living in private households. It uses a
 * broader definition of disability than earlier surveys, which increases reported rates.
 *
 * Key CSD 2022 findings used here:
 *   - 27% of Canadians aged 15+ reported at least one disability (8.0 million people)
 *   - The most common types were pain-related, flexibility, and mental health disabilities
 *   - Many Canadians have more than one type of disability (multimorbidity)
 *
 * ============================================================
 * SUPPLEMENTAL SOURCES
 * ============================================================
 * Statistics Canada, Focus on Geography Series, 2016 Census
 *   https://www12.statcan.gc.ca/census-recensement/2016/as-sa/fogs-spg/index-eng.cfm
 *
 * Canadian Hearing Services - Hard of Hearing and Deaf population estimates
 *   https://www.chs.ca/
 *
 * CNIB (Canadian National Institute for the Blind) - vision loss prevalence
 *   https://cnib.ca/en/sight-loss-info/blindness/
 *
 * INCA / Fighting Blindness Canada - 1.2 million Canadians with vision loss
 *   https://www.fightingblindness.ca/
 *
 * Health Canada / Public Health Agency of Canada - epilepsy prevalence
 *   https://www.canada.ca/en/public-health/services/chronic-diseases/epilepsy.html
 *
 * ============================================================
 * FPS ALIGNMENT NOTES
 * ============================================================
 * The CSD 2022 disability types do not map 1:1 to EN 301 549 FPS categories.
 * The mappings below are the closest defensible alignments:
 *
 *   WV  (Without vision, 4.2.1):
 *     CSD "seeing" disability, severe subset. CNIB estimates ~1.2 million
 *     Canadians have vision loss severe enough to affect daily activities.
 *     Estimate: ~1.2M / 40.1M = ~3.0%
 *
 *   LV  (Limited vision, 4.2.2):
 *     All CSD "seeing" disability. CSD 2022 reports 4.2% of Canadians 15+
 *     with a seeing disability. Adjusted to whole population (~3.5%).
 *
 *   WPC (Without perception of colour, 4.2.3):
 *     Colour vision deficiency. No direct CSD data. Using international
 *     estimates: ~8% of males, ~0.5% of females -> ~4.3% of population.
 *     Source: Colour Blind Awareness / NIH NEI (consistent across populations).
 *
 *   WH  (Without hearing, 4.2.4):
 *     Deaf (non-functional hearing). Canadian Hearing Services estimates
 *     ~357,000 Canadians are deaf. Estimate: ~0.9% of population.
 *
 *   LH  (Limited hearing, 4.2.5):
 *     All CSD "hearing" disability. CSD 2022 reports 8.1% of Canadians 15+
 *     with a hearing disability. Adjusted to whole population (~6.5%).
 *
 *   WVC (No or limited vocal capability, 4.2.6):
 *     CSD "speaking" disability subset. CSD 2022: ~1.4% of Canadians 15+.
 *     Adjusted to whole population (~1.1%).
 *
 *   LMS (Limited manipulation or strength, 4.2.7):
 *     CSD "dexterity" disability. CSD 2022 reports 6.2% of Canadians 15+.
 *     Adjusted to whole population (~5.0%).
 *
 *   LR  (Limited reach, 4.2.8):
 *     CSD "mobility" disability, subset affecting reach specifically.
 *     CSD 2022: 9.7% with mobility disability. Using partial subset (~4.0%).
 *
 *   PST (Photosensitive seizure triggers, 4.2.9):
 *     Epilepsy prevalence. Health Canada estimates ~0.6% of Canadians have
 *     epilepsy; photosensitive epilepsy is a subset (~3-5% of epilepsy cases).
 *     Using broader epilepsy rate as conservative estimate: ~0.6%.
 *
 *   LC  (Limited cognition, language or learning, 4.2.10):
 *     CSD "cognitive", "learning", and "mental health" combined.
 *     CSD 2022: cognitive 4.1%, learning 3.3%, mental health 9.0%.
 *     These overlap significantly. Using cognitive + learning, adjusted:
 *     ~6.0% of population (conservative; mental health excluded as it
 *     does not always affect web accessibility in the same way).
 *
 *   P   (Privacy, 4.2.11):
 *     Privacy is a cross-cutting FPS that applies to all users of
 *     accessibility features. No prevalence rate applies; excluded from
 *     directional impact calculations.
 *
 * ============================================================
 * IMPORTANT CAVEATS
 * ============================================================
 * - CSD 2022 covers Canadians aged 15+ in private households only. It
 *   excludes people in institutions, on reserves, and children under 15.
 * - Many Canadians have multiple disability types; applying rates independently
 *   will overcount. These estimates are directional only.
 * - The Canadian population base used here is ~40.1 million (2022 estimate).
 * - All rates are applied to page load counts as rough directional signals.
 *   They do not represent measured exclusion and must not be cited as such.
 *
 * Review schedule: Annually. CSD is conducted every 5 years; next cycle ~2027.
 * Interim updates should incorporate new Statistics Canada releases.
 * Next review: 2027-01-01
 */

/** @readonly */
export const STATISTICS_CANADA_DISABILITY_STATS = {
  /** Calendar year of the primary CSD dataset. */
  vintage_year: 2022,

  /** ISO-8601 date after which this data should be reviewed and potentially updated. */
  next_review_date: "2027-01-01",

  /** Human-readable citation for the primary data source. */
  source: "Statistics Canada, Canadian Survey on Disability (CSD), 2022, Catalogue no. 89-654-X",

  /** URL for the primary CSD 2022 publication. */
  source_url: "https://www150.statcan.gc.ca/n1/pub/89-654-x/89-654-x2023002-eng.htm",

  /** Canadian population estimate for the reference year. */
  canada_population: 40_100_000,

  /**
   * Disability prevalence rates per CAN/ASC EN 301 549:2024 FPS code.
   *
   * Each entry contains:
   *   - rate: fraction of the Canadian population affected (0.0 to 1.0)
   *   - estimated_population: approximate number of Canadians affected
   *   - source_note: brief citation and methodology note for this estimate
   *
   * The "P" (Privacy) FPS is intentionally excluded: it is a cross-cutting
   * statement that does not correspond to a discrete disability population.
   */
  fps_rates: {
    WV: {
      rate: 0.030,
      estimated_population: 1_200_000,
      source_note:
        "CNIB / Fighting Blindness Canada: ~1.2 million Canadians with vision loss severe enough to affect daily activities. Estimate ~3.0% of population."
    },
    LV: {
      rate: 0.035,
      estimated_population: 1_400_000,
      source_note:
        "CSD 2022: 4.2% of Canadians 15+ with a seeing disability. Adjusted to whole population including under-15s: ~3.5%."
    },
    WPC: {
      rate: 0.043,
      estimated_population: 1_700_000,
      source_note:
        "No Canadian-specific CSD data for colour vision deficiency. Using international estimates: ~8% of males, ~0.5% of females (consistent with NIH/NEI and European data), yielding ~4.3% of population."
    },
    WH: {
      rate: 0.009,
      estimated_population: 357_000,
      source_note:
        "Canadian Hearing Services: approximately 357,000 Canadians are deaf (non-functional hearing). ~0.9% of population."
    },
    LH: {
      rate: 0.065,
      estimated_population: 2_600_000,
      source_note:
        "CSD 2022: 8.1% of Canadians 15+ with a hearing disability. Adjusted to whole population: ~6.5%. Includes mild to profound hearing loss."
    },
    WVC: {
      rate: 0.011,
      estimated_population: 440_000,
      source_note:
        "CSD 2022: ~1.4% of Canadians 15+ with a speaking disability. Adjusted to whole population: ~1.1%."
    },
    LMS: {
      rate: 0.050,
      estimated_population: 2_000_000,
      source_note:
        "CSD 2022: 6.2% of Canadians 15+ with a dexterity disability (difficulty using hands or fingers). Adjusted to whole population: ~5.0%."
    },
    LR: {
      rate: 0.040,
      estimated_population: 1_600_000,
      source_note:
        "CSD 2022: 9.7% of Canadians 15+ with a mobility disability. Using a partial subset reflecting reach-related limitations: ~4.0% of population."
    },
    PST: {
      rate: 0.006,
      estimated_population: 240_000,
      source_note:
        "Health Canada / PHAC: ~0.6% of Canadians have epilepsy. Photosensitive epilepsy is a subset; using the broader epilepsy rate as a conservative upper bound."
    },
    LC: {
      rate: 0.060,
      estimated_population: 2_400_000,
      source_note:
        "CSD 2022: cognitive disability 4.1%, learning disability 3.3% (these overlap). Combined conservative estimate: ~6.0% of population. Mental health disability (9.0%) excluded as it does not uniformly affect web accessibility barriers captured by automated scanning."
    }
  }
};

/**
 * Returns true if the disability statistics are considered stale (past next_review_date).
 *
 * @param {string} [today] - ISO-8601 date string; defaults to current date.
 * @returns {boolean}
 */
export function isStatsDataStale(today) {
  const checkDate = today ?? new Date().toISOString().slice(0, 10);
  return checkDate >= STATISTICS_CANADA_DISABILITY_STATS.next_review_date;
}

/**
 * Returns a plain-object map of FPS code -> prevalence rate, suitable for
 * use in impact calculations.
 *
 * @returns {Record<string, number>}
 */
export function getFpsPrevalenceRates() {
  return Object.fromEntries(
    Object.entries(STATISTICS_CANADA_DISABILITY_STATS.fps_rates).map(([code, data]) => [
      code,
      data.rate
    ])
  );
}
