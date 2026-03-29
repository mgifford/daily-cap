# About Daily CAP and Daily DAP

Daily CAP and [Daily DAP](https://mgifford.github.io/daily-dap/) are sibling projects with different geographic scope.

- **Daily CAP** benchmarks Canadian federal digital services and measures EN/FR bilingual parity as a first-class signal, reflecting the *Official Languages Act*.
- **Daily DAP** benchmarks U.S. federal digital services. It does not have an equivalent bilingual requirement.

Both projects publish static daily HTML reports with automated Lighthouse diagnostics. They are independent codebases that share a similar reporting approach.

## Comparison

| Feature | Daily CAP (Canada) | Daily DAP (U.S.) |
|---|---|---|
| Geographic scope | Canadian federal digital services | U.S. federal digital services |
| Bilingual requirement | English and French (Official Languages Act) | English only |
| Language parity analysis | Yes — EN/FR gap scoring and missing counterpart detection | Not applicable |
| Accessibility statement detection | Yes — both EN and FR variants checked | Varies by implementation |
| Data sources | Canada.ca recent activity, Top Tasks, curated endpoints | DAP analytics, curated endpoints |
| Scan contexts | Desktop and mobile x light and dark themes | Similar |
| Output format | Static HTML with daily JSON exports | Static HTML with daily JSON exports |

*Both projects produce automated benchmark signals, not legal compliance determinations or manual accessibility audits.*

## Data Sources

Daily CAP draws from public Canadian sources, including:

- [Canada.ca Recent Activity pages](https://www.canada.ca/en/analytics/recent-activity.html)
- Canada Top Tasks pages
- Curated service endpoint inventories
- Statistics Canada prevalence data

Source provenance is preserved in the report JSON exports. Results are directional signals, not comprehensive coverage of all Government of Canada services.

## Methodology Notes

- Scores are averages across scanned pages for the run date.
- Bilingual parity is assessed by comparing English and French counterparts where both exist.
- Accessibility statement detection identifies whether a statement is linked and contains basic quality signals; it does not confirm compliance.
- Impact estimates are directional models using public traffic data. They are not precise measurements.
