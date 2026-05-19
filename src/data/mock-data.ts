/**
 * Mock data for development — used when WP GraphQL is unavailable
 * Types align with wp-api.ts exports
 */

import type { HomePageData, CategoryPageData, ArticleDetail } from '../lib/wp-api';

export const mockHomePageData: HomePageData = {
  categories: [
    { id: '1', name: 'CRM', slug: 'crm', count: 12, description: 'Comprehensive CRM statistics covering Salesforce, HubSpot, and the broader customer relationship management market.' },
    { id: '2', name: 'Marketing', slug: 'marketing', count: 9, description: 'Marketing automation and digital marketing statistics covering Mailchimp, Hootsuite, and more.' },
    { id: '3', name: 'E-commerce', slug: 'ecommerce', count: 7, description: 'E-commerce platform statistics covering Shopify, WooCommerce, and the digital commerce market.' },
    { id: '4', name: 'Project Mgmt', slug: 'project-management', count: 6, description: 'Project management statistics covering Asana, Monday.com, Trello, and the PM software market.' },
    { id: '5', name: 'HR', slug: 'hr', count: 5, description: 'HR technology statistics covering Workday, BambooHR, and the HR tech market.' },
    { id: '6', name: 'Analytics', slug: 'analytics', count: 8, description: 'Analytics and business intelligence statistics covering Tableau, Looker, and the data analytics market.' },
    { id: '7', name: 'Security', slug: 'security', count: 4, description: 'Cybersecurity statistics covering CrowdStrike, Okta, and the SaaS security market.' },
    { id: '8', name: 'Communication', slug: 'communication', count: 5, description: 'Communication platform statistics covering Slack, Zoom, Teams, and the collaboration market.' },
  ],
  latestArticles: [
    { id: '1', title: 'Salesforce Statistics 2026: 35+ Key Data Points & Trends', slug: 'salesforce-statistics', excerpt: 'Explore 35+ Salesforce statistics for 2026, including market size, revenue, user growth, and key trends shaping the CRM industry.', date: 'May 10, 2026', image: '', imageAlt: 'Salesforce Statistics', category: { name: 'CRM', slug: 'crm' }, readTime: 12 },
    { id: '2', title: 'SaaS Market Size Statistics 2026: 50+ Key Data Points', slug: 'saas-market-size-statistics', excerpt: 'The global SaaS market is projected to reach $232 billion in 2026. Here are 50+ statistics covering market size, growth, and forecasts.', date: 'May 8, 2026', image: '', imageAlt: 'SaaS Market Size', category: { name: 'Analytics', slug: 'analytics' }, readTime: 15 },
    { id: '3', title: 'HubSpot Statistics 2026: 30+ Key Data Points & Trends', slug: 'hubspot-statistics', excerpt: 'Dive into 30+ HubSpot statistics covering revenue, customers, market share, and product trends for 2026.', date: 'May 5, 2026', image: '', imageAlt: 'HubSpot Statistics', category: { name: 'CRM', slug: 'crm' }, readTime: 10 },
    { id: '4', title: 'Cloud Computing Statistics 2026: 40+ Key Data Points & Trends', slug: 'cloud-computing-statistics', excerpt: 'From IaaS to SaaS, explore 40+ cloud computing statistics covering adoption, spending, and market trends for 2026.', date: 'May 3, 2026', image: '', imageAlt: 'Cloud Computing Statistics', category: { name: 'Analytics', slug: 'analytics' }, readTime: 14 },
    { id: '5', title: 'Shopify Statistics 2026: 25+ Key Data Points & Trends', slug: 'shopify-statistics', excerpt: 'Explore 25+ Shopify statistics for 2026 including merchant count, GMV, revenue, and e-commerce trends.', date: 'Apr 30, 2026', image: '', imageAlt: 'Shopify Statistics', category: { name: 'E-commerce', slug: 'ecommerce' }, readTime: 9 },
    { id: '6', title: 'Slack Statistics 2026: 20+ Key Data Points & Trends', slug: 'slack-statistics', excerpt: 'Discover 20+ Slack statistics covering daily active users, revenue, enterprise adoption, and the collaboration market.', date: 'Apr 28, 2026', image: '', imageAlt: 'Slack Statistics', category: { name: 'Communication', slug: 'communication' }, readTime: 8 },
  ],
};

export const mockCategoryData: Record<string, CategoryPageData> = {
  crm: {
    category: mockHomePageData.categories[0],
    articles: [
      { id: '1', title: 'Salesforce Statistics 2026: 35+ Key Data Points & Trends', slug: 'salesforce-statistics', excerpt: 'Explore 35+ Salesforce statistics for 2026.', date: 'May 10, 2026', image: '', imageAlt: '', category: { name: 'CRM', slug: 'crm' }, readTime: 12 },
      { id: '3', title: 'HubSpot Statistics 2026: 30+ Key Data Points & Trends', slug: 'hubspot-statistics', excerpt: 'Dive into 30+ HubSpot statistics for 2026.', date: 'May 5, 2026', image: '', imageAlt: '', category: { name: 'CRM', slug: 'crm' }, readTime: 10 },
      { id: '10', title: 'CRM Market Size Statistics 2026: 25+ Key Data Points', slug: 'crm-market-size-statistics', excerpt: 'CRM software market growth and adoption stats.', date: 'Apr 22, 2026', image: '', imageAlt: '', category: { name: 'CRM', slug: 'crm' }, readTime: 11 },
      { id: '11', title: 'Zoho Statistics 2026: 20+ Key Data Points & Trends', slug: 'zoho-statistics', excerpt: 'Zoho statistics covering users, revenue, and growth.', date: 'Apr 18, 2026', image: '', imageAlt: '', category: { name: 'CRM', slug: 'crm' }, readTime: 8 },
    ],
    hasNextPage: false,
    endCursor: '',
  },
};

// For other categories, generate empty article lists
for (const cat of mockHomePageData.categories) {
  if (!mockCategoryData[cat.slug]) {
    mockCategoryData[cat.slug] = {
      category: cat,
      articles: [],
      hasNextPage: false,
      endCursor: '',
    };
  }
}

export const mockArticleDetail: ArticleDetail = {
  id: '2',
  title: 'SaaS Market Size Statistics 2026: 50+ Key Data Points',
  slug: 'saas-market-size-statistics',
  date: '2026-05-08',
  modified: '2026-05-14',
  excerpt: 'The global SaaS market is projected to reach $232 billion in 2026. Here are 50+ statistics covering market size, growth, and forecasts.',
  content: `
<h2 id="global-saas-market-overview">Global SaaS Market Overview</h2>
<p>The Software-as-a-Service (SaaS) market has experienced remarkable growth over the past decade, transforming how businesses consume software. As of 2026, the global SaaS market is valued at approximately <strong>$232 billion</strong>, reflecting a compound annual growth rate (CAGR) of 14.2% from 2024 to 2030.</p>

<h2 id="key-saas-market-size-statistics">Key SaaS Market Size Statistics</h2>
<p>Here are the most important statistics that define the current state of the SaaS market:</p>
<ul>
<li>The global SaaS market reached $232 billion in 2026, up from $197 billion in 2024</li>
<li>North America accounts for 47% of the global SaaS market</li>
<li>Enterprise SaaS adoption rate stands at 78% among Fortune 500 companies</li>
<li>The average company uses 112 SaaS applications</li>
<li>SaaS spending per employee averages $8,500 annually</li>
</ul>

<blockquote>
<p>"The SaaS industry has fundamentally changed enterprise software economics — every line item that used to be a capital expense is now a subscription, and that compounds growth in unexpected ways." — Gartner Analyst Briefing, Q1 2026</p>
</blockquote>

<h2 id="saas-market-growth-by-segment">SaaS Market Growth by Segment</h2>
<p>Different SaaS segments show varying growth rates, with some emerging categories outpacing the market average:</p>
<ul>
<li><strong>CRM SaaS</strong>: $82 billion (17% YoY growth)</li>
<li><strong>ERP SaaS</strong>: $45 billion (15% YoY growth)</li>
<li><strong>Collaboration SaaS</strong>: $38 billion (22% YoY growth)</li>
<li><strong>HR SaaS</strong>: $28 billion (19% YoY growth)</li>
<li><strong>Security SaaS</strong>: $24 billion (21% YoY growth)</li>
</ul>

<h2 id="regional-saas-market-distribution">Regional SaaS Market Distribution</h2>
<p>The SaaS market shows distinct regional patterns:</p>
<table>
<thead>
<tr><th>Region</th><th>Market Size</th><th>Share</th></tr>
</thead>
<tbody>
<tr><td>North America</td><td>$109 billion</td><td>47%</td></tr>
<tr><td>Europe</td><td>$58 billion</td><td>25%</td></tr>
<tr><td>Asia-Pacific</td><td>$44 billion</td><td>19%</td></tr>
<tr><td>Latin America</td><td>$12 billion</td><td>5%</td></tr>
<tr><td>Middle East &amp; Africa</td><td>$9 billion</td><td>4%</td></tr>
</tbody>
</table>

<h2 id="future-outlook">Future Outlook</h2>
<p>The SaaS market is projected to continue its strong growth trajectory, reaching an estimated <strong>$376 billion by 2030</strong>. Key drivers include AI integration, vertical SaaS expansion, and increased adoption in emerging markets.</p>
`,
  image: '',
  imageAlt: 'SaaS Market Size Statistics 2026',
  category: { name: 'Analytics', slug: 'analytics' },
  tags: [
    { name: 'SaaS Market Size', slug: 'saas-market-size' },
    { name: 'Cloud Computing', slug: 'cloud-computing' },
    { name: 'SaaS Growth', slug: 'saas-growth' },
  ],
  lastUpdated: 'May 14, 2026',
  readTime: 15,
  focusKeywords: 'saas market size, saas statistics, saas growth rate',
  quickOverview: [
    { statLabel: 'Global SaaS Market Size (2026)', statValue: '$232 Billion' },
    { statLabel: 'CAGR 2024–2030', statValue: '14.2%' },
    { statLabel: 'North America Market Share', statValue: '47%' },
    { statLabel: 'Enterprise Adoption Rate', statValue: '78%' },
    { statLabel: 'Avg SaaS Apps per Company', statValue: '112' },
    { statLabel: 'Projected Market Size (2030)', statValue: '$376 Billion' },
  ],
  keyTakeaways: [
    { takeawayText: 'The global SaaS market reached $232 billion in 2026, growing at 14.2% CAGR' },
    { takeawayText: 'North America dominates with 47% market share, followed by Europe at 25%' },
    { takeawayText: 'Collaboration SaaS is the fastest-growing segment at 22% YoY growth' },
    { takeawayText: 'Enterprise adoption has reached 78% among Fortune 500 companies' },
    { takeawayText: 'The market is projected to reach $376 billion by 2030' },
  ],
  sources: [
    { name: 'Gartner', title: 'SaaS Market Forecast 2026', date: 'Jan 2026', url: 'https://www.gartner.com/' },
    { name: 'Statista', title: 'SaaS Revenue Worldwide', date: 'Mar 2026', url: 'https://www.statista.com/' },
  ],
  relatedArticles: [
    { id: '1', title: 'Salesforce Statistics 2026: 35+ Key Data Points & Trends', slug: 'salesforce-statistics', excerpt: '', date: '', image: '', imageAlt: '', category: { name: 'CRM', slug: 'crm' }, readTime: 12 },
    { id: '4', title: 'Cloud Computing Statistics 2026: 40+ Key Data Points', slug: 'cloud-computing-statistics', excerpt: '', date: '', image: '', imageAlt: '', category: { name: 'Analytics', slug: 'analytics' }, readTime: 14 },
    { id: '5', title: 'Shopify Statistics 2026: 25+ Key Data Points & Trends', slug: 'shopify-statistics', excerpt: '', date: '', image: '', imageAlt: '', category: { name: 'E-commerce', slug: 'ecommerce' }, readTime: 9 },
  ],
};
