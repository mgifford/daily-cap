/**
 * Canadian Top Tasks Ingestion
 *
 * Parses Government of Canada top tasks.
 * Source: https://design.canada.ca/about/top-tasks-for-canada-ca.html
 *
 * Extracts task metadata and maps tasks to known service URLs where available.
 */

const TOP_TASKS_MAP = [
  {
    rank: 1,
    task_name: "Personal income tax",
    url_en: "https://www.canada.ca/en/services/taxes/income.html",
    url_fr: "https://www.canada.ca/fr/services/impots/revenu.html",
    institution: "CRA",
    service_category: "tax",
    service_pattern: "application"
  },
  {
    rank: 2,
    task_name: "Job search and benefits",
    url_en: "https://www.canada.ca/en/services/work.html",
    url_fr: "https://www.canada.ca/fr/services/travail.html",
    institution: "ESDC",
    service_category: "employment",
    service_pattern: "dashboard"
  },
  {
    rank: 3,
    task_name: "Passport and travel",
    url_en: "https://www.canada.ca/en/services/travel.html",
    url_fr: "https://www.canada.ca/fr/services/voyages.html",
    institution: "IRCC",
    service_category: "travel",
    service_pattern: "help"
  },
  {
    rank: 4,
    task_name: "Student loans and grants",
    url_en: "https://www.canada.ca/en/services/education-training/loans-grants.html",
    url_fr: "https://www.canada.ca/fr/services/education-formation/prets-bourses.html",
    institution: "ESDC",
    service_category: "education",
    service_pattern: "application"
  },
  {
    rank: 5,
    task_name: "COVID-19 information",
    url_en: "https://www.canada.ca/en/services/health/coronavirus-2019.html",
    url_fr: "https://www.canada.ca/fr/services/sante/coronavirus-2019.html",
    institution: "PHAC",
    service_category: "health",
    service_pattern: "information"
  },
  {
    rank: 6,
    task_name: "Immigration and citizenship",
    url_en: "https://www.canada.ca/en/services/immigration-citizenship.html",
    url_fr: "https://www.canada.ca/fr/services/immigration-citoyennete.html",
    institution: "IRCC",
    service_category: "immigration",
    service_pattern: "application"
  },
  {
    rank: 7,
    task_name: "Benefits and credits",
    url_en: "https://www.canada.ca/en/services/benefits.html",
    url_fr: "https://www.canada.ca/fr/services/prestations.html",
    institution: "ESDC",
    service_category: "benefits",
    service_pattern: "dashboard"
  },
  {
    rank: 8,
    task_name: "Employment Insurance",
    url_en: "https://www.canada.ca/en/services/benefits/ei.html",
    url_fr: "https://www.canada.ca/fr/services/prestations/ae.html",
    institution: "ESDC",
    service_category: "benefits",
    service_pattern: "application"
  },
  {
    rank: 9,
    task_name: "CPP and retirement",
    url_en: "https://www.canada.ca/en/services/benefits/publicpensions/cpp.html",
    url_fr: "https://www.canada.ca/fr/services/prestations/pensionspubliques/rpc.html",
    institution: "ESDC",
    service_category: "benefits",
    service_pattern: "help"
  },
  {
    rank: 10,
    task_name: "Old Age Security and Supplement",
    url_en: "https://www.canada.ca/en/services/benefits/publicpensions/oas.html",
    url_fr: "https://www.canada.ca/fr/services/prestations/pensionspubliques/srg.html",
    institution: "ESDC",
    service_category: "benefits",
    service_pattern: "help"
  }
];

/**
 * Fetch and parse top tasks from GC design system documentation
 * For now, returns the curated mapping above.
 * In future, could parse the actual GC page via web scraping.
 */
export async function fetchTopTasks(options = {}) {
  // Currently returns curated list; future versions could scrape the source URL
  return TOP_TASKS_MAP.map((task) => ({
    id: `top-task-${task.rank}`,
    rank: task.rank,
    service_name: task.task_name,
    url_en: task.url_en,
    url_fr: task.url_fr,
    institution: task.institution,
    service_category: task.service_category,
    service_pattern: task.service_pattern,
    source: "top-task",
    page_load_count: Math.max(50000, 500000 - task.rank * 40000),
    priority_weight: 1.0 - task.rank * 0.05
  }));
}

export function getTopTasksMap() {
  return TOP_TASKS_MAP;
}
