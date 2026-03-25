/**
 * Service Inventory Schema
 *
 * Formal specification for normalized inventory records and scan targets.
 * All inventory entries conform to this schema.
 */

export const INVENTORY_SCHEMA = {
  // Identifier and sources
  id: {
    type: "string",
    description: "Unique inventory entry ID (e.g., cap-001, top-task-1, curated-100)",
    required: true
  },
  service_name: {
    type: "string",
    description: "Human-readable service name",
    required: true
  },

  // URLs (bilingual pairs)
  url_en: {
    type: "string|null",
    description: "English URL",
    required: false
  },
  url_fr: {
    type: "string|null",
    description: "French URL",
    required: false
  },
  canonical_url: {
    type: "string",
    description: "Primary URL (for single-language or aggregated entries)",
    required: false
  },

  // Classification and context
  source: {
    type: "string",
    enum: ["recent", "top-task", "curated", "discovered"],
    description: "Data source that contributed this entry",
    required: true
  },
  service_category: {
    type: "string",
    enum: [
      "tax",
      "benefits",
      "employment",
      "education",
      "health",
      "immigration",
      "travel",
      "account",
      "identity",
      "information",
      "help",
      "service",
      "business"
    ],
    description: "Service category for cohort analysis",
    required: true
  },
  service_pattern: {
    type: "string",
    enum: [
      "sign-in",
      "dashboard",
      "application",
      "status",
      "estimator",
      "payment",
      "help",
      "information",
      "unknown"
    ],
    description: "Service interaction pattern",
    required: true
  },
  institution: {
    type: "string|null",
    description: "Owning or responsible institution (CRA, ESDC, IRCC, etc.)",
    required: false
  },

  // Ranking factors
  page_load_count: {
    type: "number",
    description: "Estimated monthly page loads / traffic signal",
    required: false,
    default: 0
  },
  priority_weight: {
    type: "number",
    min: 0,
    max: 1,
    description: "Manual priority adjustment (0=low, 1=high)",
    required: false,
    default: 0.5
  },
  rank_score: {
    type: "number",
    description: "Computed ranking score (deterministic from traffic + weight)",
    required: false
  },

  // Flags and status
  protected_flag: {
    type: "boolean",
    description: "If true, always included in Tier 1 regardless of score",
    required: false,
    default: false
  },
  tier: {
    type: "string",
    enum: ["tier-1", "tier-2", "tier-3"],
    description: "Assigned tier after ranking and selection",
    required: false
  },

  // Bilingual pair metadata
  language: {
    type: "string",
    enum: ["en", "fr", null],
    description: "If bilingual entry was expanded: en or fr (null if paired)",
    required: false
  },
  paired_inventory_id: {
    type: "string|null",
    description: "ID of paired entry in opposite language (if expanded)",
    required: false
  }
};

/**
 * Inventory entry type for TypeScript compatibility
 */
export interface InventoryEntry {
  id: string;
  service_name: string;
  url_en?: string | null;
  url_fr?: string | null;
  canonical_url?: string;
  source: "recent" | "top-task" | "curated" | "discovered";
  service_category: string;
  service_pattern: string;
  institution?: string | null;
  page_load_count?: number;
  priority_weight?: number;
  rank_score?: number;
  protected_flag?: boolean;
  tier?: "tier-1" | "tier-2" | "tier-3";
  language?: "en" | "fr" | null;
  paired_inventory_id?: string | null;
}
