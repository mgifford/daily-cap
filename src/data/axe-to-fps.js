/**
 * Mapping from axe-core rule IDs to CAN/ASC EN 301 549:2024 Functional Performance
 * Statement (FPS) codes.
 *
 * The Canadian standard defines 11 FPS categories (clauses 4.2.1-4.2.11).
 * See src/data/fps-labels.js for code definitions, labels, and clause references.
 *
 * Sources:
 *   - CAN/ASC EN 301 549:2024, Annex B (informative) - Relationship between requirements and FPS
 *     https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services/annex-b-informative-relationship-between-requirements-and-functional-performance-statements
 *   - CAN/ASC EN 301 549:2024, Section 4.2 - Functional Performance Statements
 *     https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services
 *   - WCAG 2.1/2.2 SC to EN 301 549 clause mappings (section 9.x.x.x corresponds to WCAG SC)
 *   - Adapted from Daily DAP AXE_TO_FPC mapping (U.S. Section 508) with FPS codes updated
 *     to reflect Canadian standard category differences:
 *       WS (Without Speech) -> WVC (Usage with no or limited vocal capability)
 *       LM (Limited Manipulation) + LRS (Limited Reach and Strength) -> LMS + LR
 *       LLCLA -> LC (also covers language and learning)
 *       PST and P are new Canadian FPS categories with no U.S. FPC equivalent
 *
 * Review schedule: This mapping should be reviewed every 6 months to keep pace with
 * axe-core releases and any updates to the CAN/ASC EN 301 549 standard.
 * Next review: 2026-10-01
 *
 * FPS codes:
 *   WV    = Usage without vision (4.2.1)
 *   LV    = Usage with limited vision (4.2.2)
 *   WPC   = Usage without perception of colour (4.2.3)
 *   WH    = Usage without hearing (4.2.4)
 *   LH    = Usage with limited hearing (4.2.5)
 *   WVC   = Usage with no or limited vocal capability (4.2.6)
 *   LMS   = Usage with limited manipulation or strength (4.2.7)
 *   LR    = Usage with limited reach (4.2.8)
 *   PST   = Minimize photosensitive seizure triggers (4.2.9)
 *   LC    = Usage with limited cognition, language or learning (4.2.10)
 *   P     = Privacy (4.2.11)
 */

/**
 * Map from axe rule ID to an array of CAN/ASC EN 301 549:2024 FPS codes.
 * Only primary and strong secondary relationships are included.
 *
 * @type {Map<string, string[]>}
 */
export const AXE_TO_FPS = new Map([
  ['area-alt',                         ['WV', 'WH', 'LMS']],
  ['aria-allowed-attr',                ['WV', 'WH', 'LMS']],
  ['aria-allowed-role',                ['WV', 'WH', 'LMS']],
  ['aria-command-name',                ['WV', 'WH', 'LMS']],
  ['aria-hidden-body',                 ['WV']],
  ['aria-hidden-focus',                ['WV', 'LV', 'WH', 'LMS']],
  ['aria-input-field-name',            ['WV', 'WH', 'LMS']],
  ['aria-required-attr',               ['WV', 'WH', 'LMS']],
  ['aria-required-children',           ['WV', 'WH', 'LMS']],
  ['aria-required-parent',             ['WV', 'WH', 'LMS']],
  ['aria-roledescription',             ['WV', 'WH', 'LMS']],
  ['aria-roles',                       ['WV', 'WH', 'LMS']],
  ['aria-toggle-field-name',           ['WV', 'WH', 'LMS']],
  ['aria-valid-attr',                  ['WV', 'WH', 'LMS']],
  ['aria-valid-attr-value',            ['WV', 'WH', 'LMS']],
  ['autocomplete-valid',               ['WV', 'LV', 'WH', 'LMS', 'LC']],
  ['avoid-inline-spacing',             ['WV', 'LV', 'WH', 'LMS', 'LC']],
  ['blink',                            ['LV', 'LMS', 'LC', 'PST']],
  ['button-name',                      ['WV', 'WH']],
  ['bypass',                           ['WV', 'WH']],
  ['color-contrast',                   ['LV', 'WPC']],
  ['css-orientation-lock',             ['LV', 'LMS', 'LC']],
  ['definition-list',                  ['WV', 'WH']],
  ['dlitem',                           ['WV', 'WH', 'LMS']],
  ['document-title',                   ['WV', 'WH', 'LMS']],
  ['duplicate-id',                     ['WV', 'WH']],
  ['duplicate-id-active',              ['WV', 'WH']],
  ['duplicate-id-aria',                ['WV', 'WH']],
  ['empty-heading',                    ['WV', 'WH', 'LMS']],
  ['focus-order-semantics',            ['WV', 'WH', 'LMS']],
  ['form-field-multiple-labels',       ['WV', 'LV', 'WH', 'LMS']],
  ['frame-tested',                     ['WV', 'WH']],
  ['frame-title',                      ['WV', 'WH', 'LMS']],
  ['frame-title-unique',               ['WV', 'WH', 'LMS']],
  ['heading-order',                    ['WV', 'WH', 'LMS']],
  ['hidden-content',                   ['WV', 'WPC']],
  ['html-has-lang',                    ['WV', 'WH', 'LC']],
  ['html-lang-valid',                  ['WV', 'WH', 'LC']],
  ['html-xml-lang-mismatch',           ['WV', 'WH', 'LC']],
  ['identical-links-same-purpose',     ['WV', 'WH']],
  ['image-alt',                        ['WV', 'WH']],
  ['image-redundant-alt',              ['WV', 'WH']],
  ['input-button-name',                ['WV', 'WH']],
  ['input-image-alt',                  ['WV', 'WH', 'LMS']],
  ['label',                            ['WV', 'LV', 'WH', 'LMS']],
  ['label-content-name-mismatch',      ['WV', 'LV', 'WH', 'LMS']],
  ['label-title-only',                 ['WV', 'WH', 'LMS']],
  ['landmark-banner-is-top-level',     ['WV', 'WH']],
  ['landmark-complementary-is-top-level', ['WV', 'WH', 'LMS']],
  ['landmark-contentinfo-is-top-level', ['WV', 'WH']],
  ['landmark-main-is-top-level',       ['WV', 'WH', 'LMS']],
  ['landmark-no-duplicate-banner',     ['WV', 'WH']],
  ['landmark-no-duplicate-contentinfo', ['WV', 'WH']],
  ['landmark-no-duplicate-main',       ['WV', 'WH', 'LMS']],
  ['landmark-one-main',                ['WV', 'WH', 'LMS']],
  ['landmark-unique',                  ['WV', 'WH']],
  ['link-in-text-block',               ['LV', 'WPC']],
  ['link-name',                        ['WV', 'WH', 'LMS']],
  ['list',                             ['WV', 'WH']],
  ['listitem',                         ['WV', 'WH', 'LMS']],
  ['marquee',                          ['LV', 'LMS', 'LC', 'PST']],
  ['meta-refresh',                     ['WV', 'WH', 'LMS']],
  ['meta-viewport',                    ['LV']],
  ['meta-viewport-large',              ['LV']],
  ['no-autoplay-audio',                ['WV', 'WH', 'LC']],
  ['object-alt',                       ['WV', 'WH']],
  ['p-as-heading',                     ['WV', 'WH', 'LMS']],
  ['page-has-heading-one',             ['WV', 'LV', 'WH']],
  ['region',                           ['WV', 'WH', 'LMS']],
  ['role-img-alt',                     ['WV', 'WH']],
  ['scope-attr-valid',                 ['WV', 'WH', 'LMS']],
  ['scrollable-region-focusable',      ['WV', 'WH', 'LMS']],
  ['server-side-image-map',            ['WV', 'WH', 'LMS']],
  ['skip-link',                        ['WV', 'WH', 'LMS']],
  ['svg-img-alt',                      ['WV', 'WH', 'LMS']],
  ['table-duplicate-name',             ['WV', 'WH']],
  ['table-fake-caption',               ['WV', 'WH']],
  ['tabindex',                         ['WV', 'WH', 'LMS']],
  ['target-size',                      ['LMS', 'LR']],
  ['td-has-header',                    ['WV', 'WH']],
  ['td-headers-attr',                  ['WV', 'WH']],
  ['th-has-data-cells',                ['WV', 'WH']],
  ['valid-lang',                       ['WV', 'WH', 'LC']]
]);

/**
 * Look up the FPS codes for a given axe rule ID.
 *
 * @param {string} ruleId - axe-core rule ID (e.g. "color-contrast")
 * @returns {string[]} Array of FPS codes, or empty array if no mapping exists.
 */
export function getFpsCodesForRule(ruleId) {
  return AXE_TO_FPS.get(ruleId) ?? [];
}

/**
 * Returns true if the given axe rule ID has at least one FPS mapping.
 *
 * @param {string} ruleId
 * @returns {boolean}
 */
export function hasFpsMapping(ruleId) {
  return AXE_TO_FPS.has(ruleId);
}
