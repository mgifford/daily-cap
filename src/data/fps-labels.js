/**
 * Canadian Functional Performance Statements (FPS) from CAN/ASC EN 301 549:2024.
 *
 * The Canadian standard defines 11 FPS categories, corresponding to clauses 4.2.1-4.2.11.
 * This is an adaptation of the European EN 301 549 standard as adopted by the
 * Accessibility Standards Canada (ASC).
 *
 * Sources:
 *   - CAN/ASC EN 301 549:2024 - Section 4.2 Functional Performance Statements
 *     https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services
 *   - Annex B (informative) - Relationship between requirements and FPS
 *     https://accessible.canada.ca/creating-accessibility-standards/canasc-en-301-5492024-accessibility-requirements-ict-products-and-services/annex-b-informative-relationship-between-requirements-and-functional-performance-statements
 *   - GC Web Accessibility Standard:
 *     https://www.tbs-sct.canada.ca/pol/doc-eng.aspx?id=23601
 *
 * FPS codes used in this project:
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
 *
 * Note: The Canadian FPS differ from U.S. Section 508 FPC in several ways:
 *   - WVC replaces WS (Without Speech) and is broader in scope
 *   - LMS combines Limited Manipulation and part of Limited Reach and Strength
 *   - LR covers reach specifically
 *   - PST (photosensitive seizures) is an explicit FPS with no U.S. FPC equivalent
 *   - P (Privacy) is a distinct FPS with no U.S. FPC equivalent
 *   - LLCLA is replaced by LC which also covers language and learning
 */

/** Short codes for the 11 Canadian FPS categories. */
export const FPS_CODES = ['WV', 'LV', 'WPC', 'WH', 'LH', 'WVC', 'LMS', 'LR', 'PST', 'LC', 'P'];

/** Full English labels for each FPS code, matching clause headings in CAN/ASC EN 301 549:2024. */
export const FPS_LABELS = {
  WV:  'Usage without vision',
  LV:  'Usage with limited vision',
  WPC: 'Usage without perception of colour',
  WH:  'Usage without hearing',
  LH:  'Usage with limited hearing',
  WVC: 'Usage with no or limited vocal capability',
  LMS: 'Usage with limited manipulation or strength',
  LR:  'Usage with limited reach',
  PST: 'Minimize photosensitive seizure triggers',
  LC:  'Usage with limited cognition, language or learning',
  P:   'Privacy'
};

/** Clause numbers in CAN/ASC EN 301 549:2024 for each FPS code. */
export const FPS_CLAUSES = {
  WV:  '4.2.1',
  LV:  '4.2.2',
  WPC: '4.2.3',
  WH:  '4.2.4',
  LH:  '4.2.5',
  WVC: '4.2.6',
  LMS: '4.2.7',
  LR:  '4.2.8',
  PST: '4.2.9',
  LC:  '4.2.10',
  P:   '4.2.11'
};

/**
 * Short human-readable descriptions of each FPS category, for use in
 * tooltips, report captions, and alt text.
 */
export const FPS_DESCRIPTIONS = {
  WV:  'People who are blind or have no functional vision',
  LV:  'People with low vision who need magnification, high contrast, or enlarged text',
  WPC: 'People who cannot distinguish certain colours (colour blindness)',
  WH:  'People who are deaf and cannot hear audio content',
  LH:  'People with hearing loss who need audio accommodations',
  WVC: 'People who cannot use speech or have limited vocal capability',
  LMS: 'People with limited hand, finger, or fine motor dexterity or strength',
  LR:  'People with limited reach who cannot access controls in certain positions',
  PST: 'People with photosensitive epilepsy or seizure disorders',
  LC:  'People with cognitive, learning, or language differences',
  P:   'People who require the same level of privacy when using accessibility features'
};

/**
 * Inline SVG icons representing each FPS category.
 * All icons use a 24x24 viewBox, stroke-based style.
 * Each SVG carries role="img", aria-label, a <title>, and a <desc> for full accessibility.
 */
export const FPS_SVGS = {
  WV: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage without vision"><title>Usage without vision</title><desc>People who are blind or have no functional vision</desc><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  LV: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage with limited vision"><title>Usage with limited vision</title><desc>People with low vision who need magnification, high contrast, or enlarged text</desc><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  WPC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage without perception of colour"><title>Usage without perception of colour</title><desc>People who cannot distinguish certain colours (colour blindness)</desc><circle cx="8" cy="10" r="3"/><circle cx="16" cy="10" r="3"/><circle cx="12" cy="17" r="3"/><line x1="3" y1="3" x2="21" y2="21"/></svg>`,
  WH: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage without hearing"><title>Usage without hearing</title><desc>People who are deaf and cannot hear audio content</desc><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`,
  LH: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage with limited hearing"><title>Usage with limited hearing</title><desc>People with hearing loss who need audio accommodations</desc><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  WVC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage with no or limited vocal capability"><title>Usage with no or limited vocal capability</title><desc>People who cannot use speech or have limited vocal capability</desc><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  LMS: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage with limited manipulation or strength"><title>Usage with limited manipulation or strength</title><desc>People with limited hand, finger, or fine motor dexterity or strength</desc><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>`,
  LR: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage with limited reach"><title>Usage with limited reach</title><desc>People with limited reach who cannot access controls in certain positions</desc><circle cx="12" cy="4.5" r="2"/><path d="M9 8h6l-1 5H9z"/><path d="M7.5 10.5c-2 1-3.5 3-3.5 5.5a5.5 5.5 0 0 0 11 0"/><path d="M14 13l2 7"/></svg>`,
  PST: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Minimize photosensitive seizure triggers"><title>Minimize photosensitive seizure triggers</title><desc>People with photosensitive epilepsy or seizure disorders</desc><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  LC: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Usage with limited cognition, language or learning"><title>Usage with limited cognition, language or learning</title><desc>People with cognitive, learning, or language differences</desc><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.44-2.14"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.44-2.14"/></svg>`,
  P: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="fps-icon" role="img" aria-label="Privacy"><title>Privacy</title><desc>People who require the same level of privacy when using accessibility features</desc><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
};
