export interface CategoryResearchProfile {
  summary: string;
  coverage: string[];
}
const CATEGORY_RESEARCH_PROFILES: Readonly<Record<string, CategoryResearchProfile>> = {
  analytics: {
    summary:
      'Research on SaaS market size, software adoption, operating benchmarks, and analytics platforms. Use the linked articles to compare definitions, reporting periods, and source limitations before combining figures.',
    coverage: [
      'SaaS and cloud market estimates',
      'Analytics platform adoption and usage',
      'Recurring-revenue and operating benchmarks',
    ],
  },
  crm: {
    summary:
      'Research on CRM platforms, sales technology, customer operations, and vendor comparisons. Figures are organized by product and topic so readers can trace each claim to the article-level source list.',
    coverage: [
      'CRM market and adoption research',
      'Vendor-specific public metrics',
      'Sales workflow and automation comparisons',
    ],
  },
  security: {
    summary:
      'Research on cybersecurity markets, incidents, controls, and security software. Articles distinguish reported observations from forecasts and retain links to the public sources used for each review.',
    coverage: [
      'Cybersecurity market research',
      'Threat, breach, and incident reporting',
      'Security software and control adoption',
    ],
  },
  ecommerce: {
    summary:
      'Research on e-commerce platforms, online retail activity, payments, and merchant technology. Coverage separates company disclosures, market estimates, and third-party observations where their scopes differ.',
    coverage: [
      'E-commerce platform research',
      'Online retail and payment trends',
      'Merchant software comparisons',
    ],
  },
  hr: {
    summary:
      'Research on HR software, workforce operations, recruiting, compensation, and employee experience. Articles state the population, geography, and period when those details are available from the source.',
    coverage: [
      'HR software and HCM research',
      'Workforce and recruiting trends',
      'Compensation and employee-experience data',
    ],
  },
};

export function getCategoryResearchProfile(
  slug: string,
  categoryName: string,
): CategoryResearchProfile {
  return CATEGORY_RESEARCH_PROFILES[slug] || {
    summary: `Research covering ${categoryName} software, market activity, adoption, and vendor comparisons. Article pages contain the source-level context and limitations for individual figures.`,
    coverage: [
      `${categoryName} market research`,
      'Software adoption and usage',
      'Vendor and product comparisons',
    ],
  };
}
