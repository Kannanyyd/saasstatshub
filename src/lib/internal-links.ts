/**
 * Internal Link Auto-Injection System for Phase C-1 Articles
 *
 * Problem: Phase C-1's 30 comparison/guide/best-of articles have ZERO
 * internal links (no references to A+B statistics articles) and ZERO
 * external source links. This makes them "orphan islands" that Google
 * sees as low-authority content.
 *
 * Solution: At SSG build time, scan article HTML for brand/topic keywords
 * and inject contextual internal links to relevant A+B statistics articles.
 * This runs in the Astro rendering pipeline, NOT in WordPress — the
 * original content is untouched.
 *
 * Design principles:
 * 1. Only inject on Phase C article pages (comparison/guide/best-of)
 * 2. Only link the FIRST occurrence of each keyword per article
 * 3. Never re-link text that's already inside an <a> tag
 * 4. Prioritize links to high-value statistics articles (the ones that
 *    support our affiliate CTA funnel)
 * 5. Max 5-7 links per article (avoid over-optimization penalty)
 *
 * Usage: call injectInternalLinks(html, articleSlug) in [slug].astro
 * before the Fragment renders.
 */

// ============================================================
// Keyword → Target Article Mapping
// ============================================================

interface LinkRule {
  /** Regex pattern to match in article text (case-insensitive) */
  pattern: RegExp;
  /** Target URL on our site */
  href: string;
  /** Display text to wrap in the link (uses the matched text) */
  title: string;
  /** Priority: 1 = highest (always inject if found), 3 = lowest */
  priority: 1 | 2 | 3;
  /** Only apply to articles whose slug contains one of these substrings (empty = all) */
  restrictToSlugs?: string[];
}

/**
 * Master mapping table.
 *
 * Priority 1: Core SaaS metrics that support the calculator CTA funnel
 * Priority 2: Product-specific statistics that directly relate to the comparison
 * Priority 3: Broad category/topic statistics (nice to have)
 */
const LINK_RULES: LinkRule[] = [
  // ===== SaaS Core Metrics (Priority 1) =====
  {
    pattern: /\bSaaS (?:industry|market|sector)\b/i,
    href: '/analytics/saas-industry-statistics-2026/',
    title: 'SaaS industry statistics',
    priority: 1,
  },
  {
    pattern: /\bSaaS market size\b/i,
    href: '/analytics/saas-market-size-statistics-2026/',
    title: 'SaaS market size',
    priority: 1,
  },
  {
    pattern: /\bSaaS (?:churn|churn rate|customer churn)\b/i,
    href: '/analytics/saas-churn-rate-statistics-2026/',
    title: 'SaaS churn rate statistics',
    priority: 1,
  },
  {
    pattern: /\bSaaS pricing\b/i,
    href: '/marketing/saas-pricing-statistics-2026/',
    title: 'SaaS pricing statistics',
    priority: 1,
  },
  {
    pattern: /\bSaaS statistics\b(?!\s+2026)/i,
    href: '/analytics/saas-statistics-2026/',
    title: 'SaaS statistics',
    priority: 1,
  },

  // ===== CRM Product Stats (Priority 2) =====
  {
    pattern: /\bSalesforce\b/i,
    href: '/crm/salesforce-statistics-2026/',
    title: 'Salesforce statistics',
    priority: 2,
    restrictToSlugs: ['salesforce', 'crm', 'best-crm'],
  },
  {
    pattern: /\bHubSpot\b/i,
    href: '/crm/hubspot-statistics-2026/',
    title: 'HubSpot statistics',
    priority: 2,
    restrictToSlugs: ['hubspot', 'crm', 'best-crm', 'marketing-automation'],
  },
  {
    pattern: /\bZoho\b/i,
    href: '/crm/zoho-statistics-2026/',
    title: 'Zoho statistics',
    priority: 2,
    restrictToSlugs: ['zoho', 'crm', 'best-crm'],
  },
  {
    pattern: /\bPipedrive\b/i,
    href: '/crm/pipedrive-statistics-2026/',
    title: 'Pipedrive statistics',
    priority: 2,
    restrictToSlugs: ['pipedrive', 'crm', 'salesforce-vs-hubspot'],
  },
  {
    pattern: /\bFreshsales\b/i,
    href: '/crm/freshsales-statistics-2026/',
    title: 'Freshsales statistics',
    priority: 2,
    restrictToSlugs: ['freshsales', 'zoho-vs'],
  },
  {
    pattern: /\bMicrosoft Dynamics 365\b/i,
    href: '/crm/microsoft-dynamics-365-statistics-2026/',
    title: 'Microsoft Dynamics 365 statistics',
    priority: 2,
    restrictToSlugs: ['crm', 'best-crm'],
  },
  {
    pattern: /\bCRM (?:software|platform|system|tool)\b/i,
    href: '/crm/crm-software-statistics-2026/',
    title: 'CRM software statistics',
    priority: 2,
    restrictToSlugs: ['crm', 'best-crm', 'intercom-vs', 'zendesk'],
  },
  {
    pattern: /\bCRM adoption\b/i,
    href: '/crm/crm-adoption-by-industry-statistics-2026/',
    title: 'CRM adoption statistics',
    priority: 2,
    restrictToSlugs: ['crm'],
  },
  {
    pattern: /\bCRM ROI\b/i,
    href: '/crm/crm-roi-statistics-2026/',
    title: 'CRM ROI statistics',
    priority: 2,
    restrictToSlugs: ['crm'],
  },
  {
    pattern: /\bCRM (?:implementation|deploy)\b/i,
    href: '/crm/crm-implementation-statistics-2026/',
    title: 'CRM implementation statistics',
    priority: 2,
    restrictToSlugs: ['crm'],
  },
  {
    pattern: /\bsmall business CRM\b/i,
    href: '/crm/small-business-crm-statistics-2026/',
    title: 'Small business CRM statistics',
    priority: 2,
    restrictToSlugs: ['best-crm-small-business'],
  },
  {
    pattern: /\bIntercom\b/i,
    href: '/crm/crm-software-statistics-2026/',
    title: 'CRM software statistics',
    priority: 2,
    restrictToSlugs: ['intercom-vs', 'zendesk', 'crm', 'best-crm'],
  },
  {
    pattern: /\bZendesk\b/i,
    href: '/crm/crm-software-statistics-2026/',
    title: 'CRM software statistics',
    priority: 2,
    restrictToSlugs: ['intercom-vs', 'zendesk', 'crm', 'best-crm'],
  },
  {
    pattern: /\bcustomer support (?:software|platform|tool)\b/i,
    href: '/crm/crm-software-statistics-2026/',
    title: 'CRM software statistics',
    priority: 2,
    restrictToSlugs: ['intercom-vs', 'zendesk', 'crm'],
  },
  {
    pattern: /\bhelp(?:\s|-)?desk (?:software|platform|tool)\b/i,
    href: '/crm/crm-software-statistics-2026/',
    title: 'CRM software statistics',
    priority: 2,
    restrictToSlugs: ['intercom-vs', 'zendesk', 'crm'],
  },

  // ===== Marketing Stats (Priority 2) =====
  {
    pattern: /\bemail marketing\b/i,
    href: '/marketing/email-marketing-statistics-2026/',
    title: 'Email marketing statistics',
    priority: 2,
    restrictToSlugs: ['email-marketing', 'mailchimp', 'activecampaign', 'klaviyo'],
  },
  {
    pattern: /\bmarketing automation\b/i,
    href: '/marketing/marketing-automation-statistics-2026/',
    title: 'Marketing automation statistics',
    priority: 2,
    restrictToSlugs: ['marketing-automation', 'hubspot', 'activecampaign'],
  },
  {
    pattern: /\bcontent marketing\b/i,
    href: '/marketing/content-marketing-statistics-2026/',
    title: 'Content marketing statistics',
    priority: 2,
    restrictToSlugs: ['marketing'],
  },
  {
    pattern: /\bdigital marketing\b/i,
    href: '/marketing/digital-marketing-statistics-2026/',
    title: 'Digital marketing statistics',
    priority: 2,
    restrictToSlugs: ['marketing'],
  },
  {
    pattern: /\b(?:PPC|pay.per.click|Google Ads)\b/i,
    href: '/marketing/ppc-google-ads-statistics-2026/',
    title: 'PPC & Google Ads statistics',
    priority: 2,
    restrictToSlugs: ['marketing'],
  },
  {
    pattern: /\bSEO\b/i,
    href: '/marketing/seo-statistics-2026/',
    title: 'SEO statistics',
    priority: 2,
    restrictToSlugs: ['marketing'],
  },
  {
    pattern: /\bsocial media marketing\b/i,
    href: '/marketing/social-media-marketing-statistics-2026/',
    title: 'Social media marketing statistics',
    priority: 2,
    restrictToSlugs: ['marketing'],
  },
  {
    pattern: /\bconversion rate\b/i,
    href: '/marketing/conversion-rate-optimization-statistics-2026/',
    title: 'Conversion rate optimization statistics',
    priority: 2,
    restrictToSlugs: ['marketing', 'ecommerce'],
  },

  // ===== E-commerce Stats (Priority 2) =====
  {
    pattern: /\bShopify\b/i,
    href: '/ecommerce/shopify-statistics-2026/',
    title: 'Shopify statistics',
    priority: 2,
    restrictToSlugs: ['shopify', 'ecommerce', 'best-ecommerce'],
  },
  {
    pattern: /\bWooCommerce\b/i,
    href: '/ecommerce/woocommerce-statistics-2026/',
    title: 'WooCommerce statistics',
    priority: 2,
    restrictToSlugs: ['woocommerce', 'shopify-vs', 'ecommerce'],
  },
  {
    pattern: /\bBigCommerce\b/i,
    href: '/ecommerce/bigcommerce-statistics-2026/',
    title: 'BigCommerce statistics',
    priority: 2,
    restrictToSlugs: ['bigcommerce', 'shopify-vs', 'ecommerce'],
  },
  {
    pattern: /\be[\-]?commerce (?:market|industry|sales)\b/i,
    href: '/ecommerce/ecommerce-statistics-2026/',
    title: 'E-commerce statistics',
    priority: 2,
    restrictToSlugs: ['ecommerce'],
  },
  {
    pattern: /\bStripe\b/i,
    href: '/ecommerce/stripe-statistics-2026/',
    title: 'Stripe statistics',
    priority: 2,
    restrictToSlugs: ['stripe', 'ecommerce'],
  },
  {
    pattern: /\bcross[\-]?border e[\-]?commerce\b/i,
    href: '/ecommerce/cross-border-ecommerce-statistics-2026/',
    title: 'Cross-border e-commerce statistics',
    priority: 2,
    restrictToSlugs: ['ecommerce'],
  },

  // ===== Project Management Stats (Priority 2) =====
  {
    pattern: /\bAsana\b/i,
    href: '/project-management/asana-statistics-2026/',
    title: 'Asana statistics',
    priority: 2,
    restrictToSlugs: ['asana', 'project-management', 'monday-vs'],
  },
  {
    pattern: /\bJira\b/i,
    href: '/project-management/jira-statistics-2026/',
    title: 'Jira statistics',
    priority: 2,
    restrictToSlugs: ['jira', 'project-management', 'monday-vs'],
  },
  {
    pattern: /\bMonday\.?com\b/i,
    href: '/project-management/monday-com-statistics-2026/',
    title: 'Monday.com statistics',
    priority: 2,
    restrictToSlugs: ['monday', 'asana-vs', 'project-management'],
  },
  {
    pattern: /\bTrello\b/i,
    href: '/project-management/trello-statistics-2026/',
    title: 'Trello statistics',
    priority: 2,
    restrictToSlugs: ['trello', 'jira-vs', 'project-management'],
  },
  {
    pattern: /\bNotion\b/i,
    href: '/project-management/notion-statistics-2026/',
    title: 'Notion statistics',
    priority: 2,
    restrictToSlugs: ['notion', 'jira-vs', 'project-management'],
  },
  {
    pattern: /\bClickUp\b/i,
    href: '/project-management/clickup-statistics-2026/',
    title: 'ClickUp statistics',
    priority: 2,
    restrictToSlugs: ['clickup', 'asana-vs', 'project-management'],
  },
  {
    pattern: /\b(?:project management|PM) (?:software|tool|platform)\b/i,
    href: '/project-management/project-management-software-statistics-2026/',
    title: 'Project management software statistics',
    priority: 2,
    restrictToSlugs: ['project-management'],
  },
  {
    pattern: /\bscrum\b/i,
    href: '/project-management/scrum-statistics-2026/',
    title: 'Scrum statistics',
    priority: 2,
    restrictToSlugs: ['project-management', 'jira'],
  },

  // ===== HR Stats (Priority 2) =====
  {
    pattern: /\bHR (?:technology|tech)\b/i,
    href: '/hr/hr-technology-statistics-2026/',
    title: 'HR technology statistics',
    priority: 2,
    restrictToSlugs: ['hr', 'rippling', 'gusto', 'bamboohr'],
  },
  {
    pattern: /\bpayroll\b/i,
    href: '/hr/payroll-statistics-2026/',
    title: 'Payroll statistics',
    priority: 2,
    restrictToSlugs: ['hr', 'rippling', 'gusto', 'salary'],
  },
  {
    pattern: /\btalent acquisition\b/i,
    href: '/hr/talent-acquisition-statistics-2026/',
    title: 'Talent acquisition statistics',
    priority: 2,
    restrictToSlugs: ['hr', 'salary', 'jobs'],
  },
  {
    pattern: /\bemployee engagement\b/i,
    href: '/hr/employee-engagement-statistics-2026/',
    title: 'Employee engagement statistics',
    priority: 2,
    restrictToSlugs: ['hr'],
  },
  {
    pattern: /\bemployee benefits\b/i,
    href: '/hr/employee-benefits-statistics-2026/',
    title: 'Employee benefits statistics',
    priority: 2,
    restrictToSlugs: ['hr'],
  },
  {
    pattern: /\bcompensation\b/i,
    href: '/hr/compensation-and-benefits-statistics-2026/',
    title: 'Compensation & benefits statistics',
    priority: 2,
    restrictToSlugs: ['salary', 'hr'],
  },

  // ===== Analytics Stats (Priority 2) =====
  {
    pattern: /\bbusiness intelligence\b/i,
    href: '/analytics/business-intelligence-statistics-2026/',
    title: 'Business intelligence statistics',
    priority: 2,
    restrictToSlugs: ['bi', 'analytics'],
  },
  {
    pattern: /\bbig data\b/i,
    href: '/analytics/big-data-statistics-2026/',
    title: 'Big data statistics',
    priority: 2,
    restrictToSlugs: ['analytics', 'bi'],
  },
  {
    pattern: /\bcloud computing\b/i,
    href: '/analytics/cloud-computing-statistics-2026/',
    title: 'Cloud computing statistics',
    priority: 2,
    restrictToSlugs: ['analytics'],
  },
  {
    pattern: /\b(?:Google Analytics|GA4)\b/i,
    href: '/analytics/real-time-analytics-statistics-2026/',
    title: 'Real-time analytics statistics',
    priority: 2,
    restrictToSlugs: ['mixpanel', 'amplitude', 'google-analytics', 'analytics'],
  },
  {
    pattern: /\bSaaS funding\b/i,
    href: '/analytics/saas-funding-statistics-2026/',
    title: 'SaaS funding statistics',
    priority: 2,
    restrictToSlugs: ['state-of-saas', 'saas-industry'],
  },
  {
    pattern: /\b(?:AI|artificial intelligence) (?:in |and )?SaaS\b/i,
    href: '/analytics/ai-saas-statistics-2026/',
    title: 'AI in SaaS statistics',
    priority: 2,
    restrictToSlugs: ['saas', 'analytics'],
  },
  {
    pattern: /\bartificial intelligence\b/i,
    href: '/analytics/artificial-intelligence-statistics-2026/',
    title: 'Artificial intelligence statistics',
    priority: 3,
    restrictToSlugs: ['ai', 'saas'],
  },

  // ===== Security Stats (Priority 2) =====
  {
    pattern: /\bcybersecurity\b/i,
    href: '/security/cybersecurity-statistics-2026/',
    title: 'Cybersecurity statistics',
    priority: 2,
    restrictToSlugs: ['security', 'crowdstrike', 'okta', 'datadog'],
  },
  {
    pattern: /\bcloud security\b/i,
    href: '/security/cloud-security-statistics-2026/',
    title: 'Cloud security statistics',
    priority: 2,
    restrictToSlugs: ['security', 'crowdstrike'],
  },
  {
    pattern: /\bendpoint security\b/i,
    href: '/security/endpoint-security-statistics-2026/',
    title: 'Endpoint security statistics',
    priority: 2,
    restrictToSlugs: ['security', 'crowdstrike'],
  },
  {
    pattern: /\bransomware\b/i,
    href: '/security/ransomware-statistics-2026/',
    title: 'Ransomware statistics',
    priority: 2,
    restrictToSlugs: ['security'],
  },
  {
    pattern: /\bdata privacy\b/i,
    href: '/security/data-privacy-statistics-2026/',
    title: 'Data privacy statistics',
    priority: 2,
    restrictToSlugs: ['security', 'okta'],
  },
  {
    pattern: /\bcyber insurance\b/i,
    href: '/security/cyber-insurance-statistics-2026/',
    title: 'Cyber insurance statistics',
    priority: 2,
    restrictToSlugs: ['security'],
  },
  {
    pattern: /\b(?:identity|IAM|identity management)\b/i,
    href: '/security/iam-statistics-2026/',
    title: 'IAM statistics',
    priority: 2,
    restrictToSlugs: ['okta', 'security'],
  },
  {
    pattern: /\bnetwork security\b/i,
    href: '/security/network-security-statistics-2026/',
    title: 'Network security statistics',
    priority: 2,
    restrictToSlugs: ['security'],
  },

  // ===== Communication Stats (Priority 2) =====
  {
    pattern: /\bSlack\b/i,
    href: '/communication/slack-statistics-2026/',
    title: 'Slack statistics',
    priority: 2,
    restrictToSlugs: ['slack', 'communication', 'remote-work'],
  },
  {
    pattern: /\bMicrosoft Teams\b/i,
    href: '/communication/microsoft-teams-statistics-2026/',
    title: 'Microsoft Teams statistics',
    priority: 2,
    restrictToSlugs: ['teams', 'communication', 'remote-work'],
  },
  {
    pattern: /\bZoom\b/i,
    href: '/communication/zoom-statistics-2026/',
    title: 'Zoom statistics',
    priority: 2,
    restrictToSlugs: ['zoom', 'communication', 'remote-work'],
  },
  {
    pattern: /\bremote work\b/i,
    href: '/project-management/remote-work-statistics-2026/',
    title: 'Remote work statistics',
    priority: 2,
    restrictToSlugs: ['remote-work', 'communication'],
  },
  {
    pattern: /\bvideo conferencing\b/i,
    href: '/communication/video-conferencing-statistics-2026/',
    title: 'Video conferencing statistics',
    priority: 2,
    restrictToSlugs: ['zoom', 'communication'],
  },
  {
    pattern: /\bUCaaS\b/i,
    href: '/communication/ucaas-statistics-2026/',
    title: 'UCaaS statistics',
    priority: 2,
    restrictToSlugs: ['communication', 'teams', 'zoom'],
  },
  {
    pattern: /\bteam communication\b/i,
    href: '/communication/team-communication-statistics-2026/',
    title: 'Team communication statistics',
    priority: 2,
    restrictToSlugs: ['communication', 'slack', 'teams'],
  },

  // ===== Broad Category Stats (Priority 3) =====
  {
    pattern: /\bCRM\b/i,
    href: '/crm/crm-software-statistics-2026/',
    title: 'CRM software statistics',
    priority: 3,
    restrictToSlugs: ['crm', 'best-crm'],
  },
  {
    pattern: /\bproject management\b/i,
    href: '/categories/project-management/',
    title: 'Project management statistics',
    priority: 3,
    restrictToSlugs: ['project-management'],
  },
  {
    pattern: /\bSaaS onboarding\b/i,
    href: '/analytics/saas-onboarding-statistics-2026/',
    title: 'SaaS onboarding statistics',
    priority: 3,
  },
  {
    pattern: /\bcustomer experience\b/i,
    href: '/marketing/customer-experience-statistics-2026/',
    title: 'Customer experience statistics',
    priority: 3,
  },
  {
    pattern: /\bdigital transformation\b/i,
    href: '/analytics/digital-transformation-statistics-2026/',
    title: 'Digital transformation statistics',
    priority: 3,
  },
  {
    pattern: /\bDevOps\b/i,
    href: '/categories/devops/',
    title: 'DevOps statistics',
    priority: 3,
    restrictToSlugs: ['jira', 'project-management'],
  },
  {
    pattern: /\bstartup\b/i,
    href: '/analytics/startup-statistics-2026/',
    title: 'Startup statistics',
    priority: 3,
    restrictToSlugs: ['saas', 'state-of-saas', 'salary'],
  },
];

// ============================================================
// Phase C-1 article slugs (the 30 articles that need auto-linking)
// ============================================================

const PHASE_C_SLUGS = new Set([
  'asana-vs-monday-vs-clickup',
  'best-bi-tools',
  'best-crm-small-business',
  'best-ecommerce-platforms',
  'best-email-marketing-software',
  'best-hr-software-small-business',
  'best-marketing-automation-tools',
  'best-project-management-tools',
  'best-remote-work-tools',
  'complete-saas-glossary',
  'crowdstrike-vs-okta-vs-datadog',
  'hubspot-marketing-hub-vs-activecampaign',
  'intercom-vs-zendesk',
  'jira-vs-notion-vs-trello',
  'mailchimp-vs-activecampaign-vs-klaviyo',
  'mixpanel-vs-amplitude-vs-google-analytics',
  'monday-vs-jira',
  'most-in-demand-saas-jobs',
  'rippling-vs-gusto-vs-bamboohr',
  'saas-founder-salary',
  'saas-product-manager-salary',
  'saas-sales-rep-salary',
  'saas-software-engineer-salary',
  'salesforce-vs-hubspot-vs-pipedrive',
  'salesforce-vs-zoho',
  'shopify-vs-woocommerce-vs-bigcommerce',
  'slack-vs-teams-vs-zoom',
  'state-of-saas-2026-annual-report',
  'stripe-vs-paypal-vs-square',
  'zoho-vs-freshsales-vs-close',
]);

// ============================================================
// Injection Engine
// ============================================================

const MAX_LINKS_PER_ARTICLE = 6;

/**
 * Check if a position in HTML is inside an existing <a> tag.
 * Simple heuristic: look backward for <a and forward for </a>.
 */
function isInsideAnchor(html: string, position: number): boolean {
  // Look backward for <a (opening tag) without a closing </a> in between
  const before = html.substring(Math.max(0, position - 2000), position);
  const lastOpenA = before.lastIndexOf('<a ');
  const lastCloseA = before.lastIndexOf('</a>');
  if (lastOpenA === -1) return false;
  if (lastCloseA > lastOpenA) return false;
  return true;
}

/**
 * Check if a position is inside an HTML tag (between < and >).
 */
function isInsideTag(html: string, position: number): boolean {
  const before = html.substring(Math.max(0, position - 500), position);
  const lastOpen = before.lastIndexOf('<');
  const lastClose = before.lastIndexOf('>');
  return lastOpen > lastClose;
}

/**
 * Check if a position is inside a heading tag (h1-h6).
 * We avoid injecting links inside headings.
 */
function isInsideHeading(html: string, position: number): boolean {
  const before = html.substring(Math.max(0, position - 500), position);
  // Look for <h1 through <h6 that hasn't been closed
  for (let level = 1; level <= 6; level++) {
    const openTag = `<h${level}`;
    const closeTag = `</h${level}`;
    const lastOpen = before.lastIndexOf(openTag);
    const lastClose = before.lastIndexOf(closeTag);
    if (lastOpen > lastClose && lastOpen !== -1) return true;
  }
  return false;
}

export function injectInternalLinks(html: string, articleSlug: string): string {
  // Previously limited to 30 Phase C-1 articles. Now applied to all articles
  // so high-impression pages (and all other pages) get contextual internal
  // links to relevant statistics articles. Classification relevance is
  // enforced by each rule's `restrictToSlugs` field, which prevents
  // cross-category link stuffing.
  //
  // Safety guards:
  // 1. Never link an article to itself (rule.href must not match articleSlug)
  // 2. Never link inside an existing <a> tag, HTML tag, or heading
  // 3. Max MAX_LINKS_PER_ARTICLE links per article (avoid over-optimization)
  // 4. Only first occurrence of each keyword is linked

  // Collect applicable rules for this article
  const applicableRules = LINK_RULES.filter((rule) => {
    // Skip self-links: if the rule's target href contains the current
    // article's slug, don't inject a link to itself.
    if (articleSlug && rule.href.includes(articleSlug)) return false;

    if (rule.restrictToSlugs && rule.restrictToSlugs.length > 0) {
      return rule.restrictToSlugs.some((s) => articleSlug.includes(s));
    }
    return true;
  });

  // Sort by priority (1 first)
  applicableRules.sort((a, b) => a.priority - b.priority);

  // Track which rules have been applied and how many total links injected
  let linksInjected = 0;
  const appliedPatterns = new Set<RegExp>();

  // Process rules in priority order
  for (const rule of applicableRules) {
    if (linksInjected >= MAX_LINKS_PER_ARTICLE) break;
    if (appliedPatterns.has(rule.pattern)) continue;

    // Find the first valid occurrence
    const match = rule.pattern.exec(html);
    if (!match || match.index === -1) continue;

    const position = match.index;
    const matchedText = match[0];

    // Skip if inside anchor, tag, or heading
    if (isInsideAnchor(html, position)) continue;
    if (isInsideTag(html, position)) continue;
    if (isInsideHeading(html, position)) continue;

    // Inject the link
    const replacement = `<a href="${rule.href}" title="${rule.title}">${matchedText}</a>`;
    html = html.substring(0, position) + replacement + html.substring(position + matchedText.length);

    appliedPatterns.add(rule.pattern);
    linksInjected++;
  }

  return html;
}
