/**
 * Curated Canadian Service Endpoints
 *
 * Maintained list of important service entry points that may not appear
 * in traffic-based rankings (recent activity, top tasks).
 *
 * Includes:
 * - high-value entry points with lower traffic but critical services
 * - status checkers, calculators, and specialized tools
 * - institutional signposts for less-trafficked departments
 */

export const CURATED_ENDPOINTS = [
  {
    id: "curated-001",
    service_name: "Apply for a Social Insurance Number",
    url_en: "https://www.canada.ca/en/employment-social-development/services/sin.html",
    url_fr: "https://www.canada.ca/fr/emploi-developpement-social/services/nas.html",
    institution: "ESDC",
    service_category: "identity",
    service_pattern: "application",
    page_load_count: 45000,
    priority_weight: 0.85
  },
  {
    id: "curated-002",
    service_name: "Check my Service Canada Account",
    url_en: "https://www.canada.ca/en/employment-social-development/services/my-account.html",
    url_fr: "https://www.canada.ca/fr/emploi-developpement-social/services/mon-dossier.html",
    institution: "ESDC",
    service_category: "account",
    service_pattern: "sign-in",
    page_load_count: 170000,
    priority_weight: 0.95
  },
  {
    id: "curated-003",
    service_name: "Find your local Service Canada office",
    url_en: "https://www.canada.ca/en/employment-social-development/services/office.html",
    url_fr: "https://www.canada.ca/fr/emploi-developpement-social/services/bureau.html",
    institution: "ESDC",
    service_category: "help",
    service_pattern: "help",
    page_load_count: 35000,
    priority_weight: 0.7
  },
  {
    id: "curated-004",
    service_name: "Canada Border Wait Times",
    url_en: "https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html",
    url_fr: "https://www.cbsa-asfc.gc.ca/bwt-taf/menu-fra.html",
    institution: "CBSA",
    service_category: "travel",
    service_pattern: "status",
    page_load_count: 94000,
    priority_weight: 0.86
  },
  {
    id: "curated-005",
    service_name: "Environment and Climate Change Canada",
    url_en: "https://www.canada.ca/en/environment-climate-change.html",
    url_fr: "https://www.canada.ca/fr/environnement-changement-climatique.html",
    institution: "ECCC",
    service_category: "information",
    service_pattern: "help",
    page_load_count: 52000,
    priority_weight: 0.75
  },
  {
    id: "curated-006",
    service_name: "Justice Laws Website",
    url_en: "https://laws-lois.justice.gc.ca/",
    url_fr: "https://laws-lois.justice.gc.ca/",
    institution: "Justice",
    service_category: "information",
    service_pattern: "dashboard",
    page_load_count: 88000,
    priority_weight: 0.8
  },
  {
    id: "curated-007",
    service_name: "Government of Canada Social Media",
    url_en: "https://www.canada.ca/en/social-media.html",
    url_fr: "https://www.canada.ca/fr/medias-sociaux.html",
    institution: "CSPS",
    service_category: "information",
    service_pattern: "help",
    page_load_count: 25000,
    priority_weight: 0.65
  },
  {
    id: "curated-008",
    service_name: "IRCC: Apply for permanent residency",
    url_en: "https://www.canada.ca/en/immigration-refugees-citizenship/services/application.html",
    url_fr: "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande.html",
    institution: "IRCC",
    service_category: "immigration",
    service_pattern: "application",
    page_load_count: 78000,
    priority_weight: 0.9
  },
  {
    id: "curated-009",
    service_name: "Consumer Price Index",
    url_en: "https://www.statcan.gc.ca/subjects-sujets/cpi-ipc/index-eng.html",
    url_fr: "https://www.statcan.gc.ca/subjects-sujets/cpi-ipc/index-fra.html",
    institution: "StatsCan",
    service_category: "information",
    service_pattern: "dashboard",
    page_load_count: 42000,
    priority_weight: 0.72
  },
  {
    id: "curated-010",
    service_name: "Health Infobase Canada",
    url_en: "https://www.canada.ca/en/public-health/services/diseases.html",
    url_fr: "https://www.canada.ca/fr/sante-publique/services/maladies.html",
    institution: "PHAC",
    service_category: "health",
    service_pattern: "information",
    page_load_count: 65000,
    priority_weight: 0.85
  }
];

export function getCuratedEndpoints() {
  return CURATED_ENDPOINTS;
}

export function getCuratedEndpointsByCategory(category) {
  return CURATED_ENDPOINTS.filter((ep) => ep.service_category === category);
}

export function getCuratedEndpointsByInstitution(institution) {
  return CURATED_ENDPOINTS.filter((ep) => ep.institution === institution);
}
