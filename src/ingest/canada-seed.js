const SEED_ENTRIES = [
  {
    id: "cap-001",
    service_name: "Taxes",
    url_en: "https://www.canada.ca/en/revenue-agency.html",
    url_fr: "https://www.canada.ca/fr/agence-revenu.html",
    source: "curated",
    service_category: "tax",
    service_pattern: "dashboard",
    institution: "CRA",
    priority_weight: 1.0,
    page_load_count: 220000
  },
  {
    id: "cap-002",
    service_name: "Employment Insurance",
    url_en: "https://www.canada.ca/en/services/benefits/ei.html",
    url_fr: "https://www.canada.ca/fr/services/prestations/ae.html",
    source: "top-task",
    service_category: "benefits",
    service_pattern: "application",
    institution: "ESDC",
    priority_weight: 1.0,
    page_load_count: 180000
  },
  {
    id: "cap-003",
    service_name: "My Service Canada Account",
    url_en: "https://www.canada.ca/en/employment-social-development/services/my-account.html",
    url_fr: "https://www.canada.ca/fr/emploi-developpement-social/services/mon-dossier.html",
    source: "curated",
    service_category: "account",
    service_pattern: "sign-in",
    institution: "ESDC",
    priority_weight: 1.0,
    page_load_count: 170000
  },
  {
    id: "cap-004",
    service_name: "Immigration and citizenship",
    url_en: "https://www.canada.ca/en/services/immigration-citizenship.html",
    url_fr: "https://www.canada.ca/fr/services/immigration-citoyennete.html",
    source: "recent",
    service_category: "immigration",
    service_pattern: "application",
    institution: "IRCC",
    priority_weight: 1.0,
    page_load_count: 240000
  },
  {
    id: "cap-005",
    service_name: "Passport services",
    url_en: "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports.html",
    url_fr: "https://www.canada.ca/fr/immigration-refugies-citoyennete/services/passeports-canadiens.html",
    source: "top-task",
    service_category: "travel",
    service_pattern: "status",
    institution: "IRCC",
    priority_weight: 0.95,
    page_load_count: 160000
  },
  {
    id: "cap-006",
    service_name: "Weather office",
    url_en: "https://weather.gc.ca/",
    url_fr: "https://meteo.gc.ca/",
    source: "recent",
    service_category: "information",
    service_pattern: "dashboard",
    institution: "ECCC",
    priority_weight: 0.9,
    page_load_count: 260000
  },
  {
    id: "cap-007",
    service_name: "Health services",
    url_en: "https://www.canada.ca/en/public-health/services/health-services-benefits.html",
    url_fr: "https://www.canada.ca/fr/sante-publique/services/services-prestations-sante.html",
    source: "recent",
    service_category: "health",
    service_pattern: "help",
    institution: "PHAC",
    priority_weight: 0.88,
    page_load_count: 120000
  },
  {
    id: "cap-008",
    service_name: "Student aid",
    url_en: "https://www.canada.ca/en/services/benefits/education/student-aid.html",
    url_fr: "https://www.canada.ca/fr/services/prestations/education/aide-etudiants.html",
    source: "top-task",
    service_category: "education",
    service_pattern: "application",
    institution: "ESDC",
    priority_weight: 0.9,
    page_load_count: 105000
  },
  {
    id: "cap-009",
    service_name: "Business and industry",
    url_en: "https://www.canada.ca/en/services/business.html",
    url_fr: "https://www.canada.ca/fr/services/entreprises.html",
    source: "recent",
    service_category: "business",
    service_pattern: "help",
    institution: "ISED",
    priority_weight: 0.8,
    page_load_count: 98000
  },
  {
    id: "cap-010",
    service_name: "Border wait times",
    url_en: "https://www.cbsa-asfc.gc.ca/bwt-taf/menu-eng.html",
    url_fr: "https://www.cbsa-asfc.gc.ca/bwt-taf/menu-fra.html",
    source: "curated",
    service_category: "travel",
    service_pattern: "status",
    institution: "CBSA",
    priority_weight: 0.86,
    page_load_count: 94000
  }
];

export function loadSeedInventory() {
  return [...SEED_ENTRIES];
}
