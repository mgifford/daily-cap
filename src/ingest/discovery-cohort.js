/**
 * Discovery Cohort Ingestion
 *
 * Expands benchmark coverage with additional Canadian federal
 * service entry pages that are meaningful but often lower-traffic.
 *
 * These are directional discovery candidates with conservative
 * priority weights so they do not displace core Tier 1 pages.
 */

const DISCOVERY_URLS_EN = [
  "https://www.canada.ca/en/services/jobs.html",
  "https://www.canada.ca/en/services/immigration-citizenship.html",
  "https://www.canada.ca/en/services/travel.html",
  "https://www.canada.ca/en/services/business.html",
  "https://www.canada.ca/en/services/benefits.html",
  "https://www.canada.ca/en/services/health.html",
  "https://www.canada.ca/en/services/taxes.html",
  "https://www.canada.ca/en/services/environment.html",
  "https://www.canada.ca/en/services/defence.html",
  "https://www.canada.ca/en/services/policing.html",
  "https://www.canada.ca/en/services/culture.html",
  "https://www.canada.ca/en/services/transport.html",
  "https://www.canada.ca/en/services/canada-world.html",
  "https://www.canada.ca/en/services/finance.html",
  "https://www.canada.ca/en/services/science.html",
  "https://www.canada.ca/en/services/justice.html",
  "https://www.canada.ca/en/services/national-security.html",
  "https://www.canada.ca/en/services/indigenous-peoples.html",
  "https://www.canada.ca/en/services/veterans-military.html",
  "https://www.canada.ca/en/services/youth.html",
  "https://www.canada.ca/en/services/veterans-military/canadian-armed-forces.html",
  "https://www.canada.ca/en/services/veterans-military/health-support.html",
  "https://www.canada.ca/en/services/veterans-military/pensions-benefits.html",
  "https://www.canada.ca/en/services/benefits/ei.html",
  "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html",
  "https://www.canada.ca/en/services/benefits/publicpensions/oas.html",
  "https://www.canada.ca/en/services/benefits/education.html",
  "https://www.canada.ca/en/services/benefits/disability.html",
  "https://www.canada.ca/en/services/benefits/finder.html",
  "https://www.canada.ca/en/services/benefits/audience.html",
  "https://www.canada.ca/en/services/taxes/income.html",
  "https://www.canada.ca/en/services/taxes/business-number.html",
  "https://www.canada.ca/en/services/taxes/gsthst.html",
  "https://www.canada.ca/en/services/taxes/payments.html",
  "https://www.canada.ca/en/services/taxes/child-and-family-benefits.html",
  "https://www.canada.ca/en/services/taxes/savings-and-pension-plans.html",
  "https://www.canada.ca/en/services/taxes/excise-taxes-duties-and-levies.html",
  "https://www.canada.ca/en/services/taxes/charities.html",
  "https://www.canada.ca/en/services/taxes/international-non-residents.html",
  "https://www.canada.ca/en/services/immigration-citizenship/services/application.html",
  "https://www.canada.ca/en/services/immigration-citizenship/check-processing-times.html",
  "https://www.canada.ca/en/services/immigration-citizenship/check-application-status.html",
  "https://www.canada.ca/en/services/immigration-citizenship/visit-canada.html",
  "https://www.canada.ca/en/services/immigration-citizenship/work-canada.html",
  "https://www.canada.ca/en/services/immigration-citizenship/study-canada.html",
  "https://www.canada.ca/en/services/immigration-citizenship/new-immigrants.html",
  "https://www.canada.ca/en/services/immigration-citizenship/canadian-citizenship.html",
  "https://www.canada.ca/en/services/immigration-citizenship/enforcement-violations.html",
  "https://www.canada.ca/en/services/immigration-citizenship/passport.html",
  "https://www.canada.ca/en/services/immigration-citizenship/services/canadian-passports.html",
  "https://www.canada.ca/en/services/travel/advisories.html",
  "https://www.canada.ca/en/services/travel/canadian-passports.html",
  "https://www.canada.ca/en/services/travel/travel-insurance.html",
  "https://www.canada.ca/en/services/travel/children.html",
  "https://www.canada.ca/en/services/travel/cruise.html",
  "https://www.canada.ca/en/services/travel/air.html",
  "https://www.canada.ca/en/services/travel/health-safety.html",
  "https://www.canada.ca/en/services/travel/travelling.html",
  "https://www.canada.ca/en/services/travel/returning.html",
  "https://www.canada.ca/en/services/travel/visa.html",
  "https://www.canada.ca/en/services/jobs/opportunities.html",
  "https://www.canada.ca/en/services/jobs/training.html",
  "https://www.canada.ca/en/services/jobs/workplace.html",
  "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards.html",
  "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/work-hours.html",
  "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/leaves.html",
  "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/termination.html",
  "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/equal-treatment.html",
  "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/pay.html",
  "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/vacations-holidays.html",
  "https://www.canada.ca/en/services/jobs/workplace/federal-labour-standards/filing-complaint.html",
  "https://www.canada.ca/en/services/health/drug-health-products.html",
  "https://www.canada.ca/en/services/health/food-nutrition.html",
  "https://www.canada.ca/en/services/health/publications.html",
  "https://www.canada.ca/en/services/health/vaccines-immunization.html",
  "https://www.canada.ca/en/services/health/diseases-conditions.html",
  "https://www.canada.ca/en/services/health/healthy-living.html",
  "https://www.canada.ca/en/services/health/aboriginal-health.html",
  "https://www.canada.ca/en/services/health/health-risks-safety.html",
  "https://www.canada.ca/en/services/health/mental-health-wellness.html",
  "https://www.canada.ca/en/services/health/system-services.html",
  "https://www.canada.ca/en/services/business/start.html",
  "https://www.canada.ca/en/services/business/grants.html",
  "https://www.canada.ca/en/services/business/taxes.html",
  "https://www.canada.ca/en/services/business/hire.html",
  "https://www.canada.ca/en/services/business/trade.html",
  "https://www.canada.ca/en/services/business/permits.html",
  "https://www.canada.ca/en/services/business/research.html",
  "https://www.canada.ca/en/services/business/ip.html",
  "https://www.canada.ca/en/services/business/maintaingrowimprovebusiness.html",
  "https://www.canada.ca/en/services/business/bankruptcy.html",
  "https://www.canada.ca/en/services/finance/manage.html",
  "https://www.canada.ca/en/services/finance/plan.html",
  "https://www.canada.ca/en/services/finance/borrow.html",
  "https://www.canada.ca/en/services/finance/save-invest.html",
  "https://www.canada.ca/en/services/finance/protect.html",
  "https://www.canada.ca/en/services/finance/retirement.html",
  "https://www.canada.ca/en/services/environment/weather.html",
  "https://www.canada.ca/en/services/environment/pollution-waste-management.html",
  "https://www.canada.ca/en/services/environment/conservation.html",
  "https://www.canada.ca/en/services/environment/climate-change.html",
  "https://www.canada.ca/en/services/environment/environmental-assessments.html",
  "https://www.canada.ca/en/services/transport/air.html",
  "https://www.canada.ca/en/services/transport/marine.html",
  "https://www.canada.ca/en/services/transport/rail.html",
  "https://www.canada.ca/en/services/transport/road.html",
  "https://www.canada.ca/en/services/transport/vehicles.html",
  "https://www.canada.ca/en/services/culture/canadian-identity-society.html",
  "https://www.canada.ca/en/services/culture/history-heritage.html",
  "https://www.canada.ca/en/services/culture/arts-media.html",
  "https://www.canada.ca/en/services/culture/sport.html",
  "https://www.canada.ca/en/services/culture/holidays-commemorations.html",
  "https://www.canada.ca/en/services/science/research-funding.html",
  "https://www.canada.ca/en/services/science/innovation.html",
  "https://www.canada.ca/en/services/science/space.html",
  "https://www.canada.ca/en/services/science/oceans.html",
  "https://www.canada.ca/en/services/justice/family-law.html",
  "https://www.canada.ca/en/services/justice/victims.html",
  "https://www.canada.ca/en/services/justice/young-offenders.html",
  "https://www.canada.ca/en/services/justice/legal-aid.html",
  "https://www.canada.ca/en/services/justice/human-rights.html",
  "https://www.canada.ca/en/services/policing/police/index.html",
  "https://www.canada.ca/en/services/policing/cybercrime.html",
  "https://www.canada.ca/en/services/policing/fraud.html",
  "https://www.canada.ca/en/services/national-security/cyber-safety.html",
  "https://www.canada.ca/en/services/national-security/emergencies.html",
  "https://www.canada.ca/en/services/national-security/critical-infrastructure.html",
  "https://www.canada.ca/en/services/indigenous-peoples/benefits-services.html",
  "https://www.canada.ca/en/services/indigenous-peoples/health-social.html",
  "https://www.canada.ca/en/services/indigenous-peoples/education-training.html",
  "https://www.canada.ca/en/services/indigenous-peoples/environment-natural-resources.html",
  "https://www.canada.ca/en/services/youth/canada-service-corps.html",
  "https://www.canada.ca/en/services/youth/jobs-internships.html",
  "https://www.canada.ca/en/services/youth/travel-abroad.html",
  "https://www.canada.ca/en/services/youth/civic-engagement.html"
];

function inferCategory(url) {
  const lower = url.toLowerCase();

  if (lower.includes("tax")) return "tax";
  if (lower.includes("immigration") || lower.includes("passport")) return "immigration";
  if (lower.includes("benefit") || lower.includes("pension") || lower.includes("ei")) return "benefits";
  if (lower.includes("health")) return "health";
  if (lower.includes("business")) return "business";
  if (lower.includes("travel") || lower.includes("transport")) return "travel";
  if (lower.includes("justice") || lower.includes("policing")) return "justice";
  if (lower.includes("environment") || lower.includes("climate") || lower.includes("weather")) return "environment";
  return "service";
}

function inferPattern(url) {
  const lower = url.toLowerCase();

  if (lower.includes("apply") || lower.includes("application") || lower.includes("grants")) {
    return "application";
  }
  if (lower.includes("status") || lower.includes("processing-times") || lower.includes("wait")) {
    return "status";
  }
  if (lower.includes("account") || lower.includes("sign")) {
    return "sign-in";
  }
  if (lower.includes("finder") || lower.includes("office") || lower.includes("help")) {
    return "help";
  }
  if (lower.includes("calculator") || lower.includes("estimate")) {
    return "estimator";
  }
  return "dashboard";
}

export function getDiscoveryCohort() {
  return DISCOVERY_URLS_EN.map((url, index) => ({
    id: `discovery-${String(index + 1).padStart(3, "0")}`,
    service_name: `Discovery: ${new URL(url).pathname.replace("/en/services/", "").replace(/\.html$/, "").replaceAll("/", " - ")}`,
    url_en: url,
    url_fr: null,
    institution: null,
    service_category: inferCategory(url),
    service_pattern: inferPattern(url),
    page_load_count: 5000,
    priority_weight: 0.35,
    source: "discovered"
  }));
}
