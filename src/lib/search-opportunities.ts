export interface SearchOpportunityLink {
  label: string;
  href: string;
}

export const HOMEPAGE_SEARCH_OPPORTUNITY_SLUGS = [
  'zoho-vs-freshsales-vs-close',
  'ecommerce-statistics-2026',
  'cybersecurity-statistics-2026',
  'cloud-computing-statistics-2026',
  'saas-market-size-statistics-2026',
  'saas-sales-rep-salary',
] as const;

export const CATEGORY_SEARCH_OPPORTUNITIES: Record<string, SearchOpportunityLink[]> = {
  analytics: [
    { label: 'SaaS Market Size and Growth Data', href: '/analytics/saas-market-size-statistics-2026/' },
    { label: 'Cloud Computing Statistics 2026', href: '/analytics/cloud-computing-statistics-2026/' },
  ],
  crm: [
    { label: 'Zoho vs Freshsales vs Close: 2026 CRM Comparison', href: '/crm/zoho-vs-freshsales-vs-close/' },
    { label: 'CRM Software Statistics 2026: Platform Data', href: '/crm/crm-software-statistics-2026/' },
  ],
  ecommerce: [
    { label: 'E-commerce Statistics 2026: Market and Buyer Data', href: '/ecommerce/ecommerce-statistics-2026/' },
  ],
  security: [
    { label: 'Cybersecurity Statistics 2026: Breaches and Ransomware', href: '/security/cybersecurity-statistics-2026/' },
    { label: 'Ransomware Statistics 2026', href: '/security/ransomware-statistics-2026/' },
  ],
  hr: [
    { label: 'How Much Do SaaS Sales Reps Make in 2026?', href: '/hr/saas-sales-rep-salary/' },
    { label: 'Best HR Software for Small Business', href: '/hr/best-hr-software-small-business/' },
  ],
};
