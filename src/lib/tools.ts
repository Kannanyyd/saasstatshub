export interface ToolMeta {
  slug: string;
  title: string;
  description: string;
  filename: string;
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'churn-rate-calculator',
    title: 'Churn Rate Calculator',
    description: 'Calculate customer churn, revenue churn, and retention impact from your subscription metrics.',
    filename: 'churn-rate-calculator.html',
  },
  {
    slug: 'crm-roi-calculator',
    title: 'CRM ROI Calculator',
    description: 'Estimate CRM payback, productivity gains, and revenue lift from your implementation assumptions.',
    filename: 'crm-roi-calculator.html',
  },
  {
    slug: 'customer-acquisition-cost-calculator',
    title: 'Customer Acquisition Cost Calculator',
    description: 'Measure CAC from sales and marketing spend, new customers, and channel assumptions.',
    filename: 'customer-acquisition-cost-calculator.html',
  },
  {
    slug: 'customer-lifetime-value-calculator',
    title: 'Customer Lifetime Value Calculator',
    description: 'Model LTV from ARPU, gross margin, churn, and customer retention assumptions.',
    filename: 'customer-lifetime-value-calculator.html',
  },
  {
    slug: 'ecommerce-revenue-calculator',
    title: 'Ecommerce Revenue Calculator',
    description: 'Forecast ecommerce revenue from traffic, conversion rate, average order value, and repeat purchase rate.',
    filename: 'ecommerce-revenue-calculator.html',
  },
  {
    slug: 'employee-turnover-cost-calculator',
    title: 'Employee Turnover Cost Calculator',
    description: 'Estimate hiring, training, productivity, and vacancy costs from employee turnover.',
    filename: 'employee-turnover-cost-calculator.html',
  },
  {
    slug: 'lead-scoring-calculator',
    title: 'Lead Scoring Calculator',
    description: 'Score leads using fit, intent, engagement, and sales readiness signals.',
    filename: 'lead-scoring-calculator.html',
  },
  {
    slug: 'marketing-roi-calculator',
    title: 'Marketing ROI Calculator',
    description: 'Calculate marketing return on investment from spend, pipeline, conversion, and revenue data.',
    filename: 'marketing-roi-calculator.html',
  },
  {
    slug: 'monthly-recurring-revenue-calculator',
    title: 'Monthly Recurring Revenue Calculator',
    description: 'Calculate MRR, expansion, contraction, churned revenue, and net recurring revenue movement.',
    filename: 'monthly-recurring-revenue-calculator.html',
  },
  {
    slug: 'project-roi-calculator',
    title: 'Project ROI Calculator',
    description: 'Estimate project return, payback period, and net value from cost and benefit assumptions.',
    filename: 'project-roi-calculator.html',
  },
  {
    slug: 'saas-metrics-dashboard',
    title: 'SaaS Metrics Dashboard',
    description: 'Track core SaaS metrics including MRR, churn, CAC, LTV, and growth efficiency.',
    filename: 'saas-metrics-dashboard.html',
  },
  {
    slug: 'saas-pricing-calculator-v2',
    title: 'SaaS Pricing Calculator v2',
    description: 'Model SaaS pricing, customer tiers, recurring revenue, and monetization scenarios.',
    filename: 'saas-pricing-calculator-v2.html',
  },
  {
    slug: 'sales-commission-calculator',
    title: 'Sales Commission Calculator',
    description: 'Calculate sales commissions from quota, attainment, accelerators, and payout rules.',
    filename: 'sales-commission-calculator.html',
  },
  {
    slug: 'security-risk-score-calculator',
    title: 'Security Risk Score Calculator',
    description: 'Estimate business security risk using exposure, control maturity, and incident impact factors.',
    filename: 'security-risk-score-calculator.html',
  },
  {
    slug: 'subscription-billing-calculator',
    title: 'Subscription Billing Calculator',
    description: 'Calculate subscription revenue, billing intervals, plan changes, and recurring revenue impact.',
    filename: 'subscription-billing-calculator.html',
  },
];

export function toolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}
