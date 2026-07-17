<?php
/**
 * Verify the July 2026 GSC priority title and excerpt values.
 *
 * Run with:
 *   wp eval-file seo-ctr-verify-2026-07.php
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Load WordPress before running this file.\n");
    exit(1);
}

$expected = [
    592 => ['saas-sales-rep-salary', 'SaaS Sales Rep Salary 2026: Base Pay, OTE and Commission', 'Compare SaaS sales representative compensation across base pay, commission, OTE, and role levels, with source notes, methodology, and practical limits.'],
    404 => ['small-business-crm-statistics-2026', 'Small Business CRM Statistics 2026: Vendor and Workflow Data', 'Review 2026 small-business CRM statistics using public HubSpot and Salesforce evidence, with workflow context, source notes, and clear data limitations.'],
    142 => ['ecommerce-statistics-2026', 'E-commerce Statistics 2026: U.S. Sales and Mobile Trends', 'Explore 2026 e-commerce statistics on U.S. online sales, mobile shopping, retail share, and platform trends, with source scope and limitations explained.'],
    144 => ['hr-hcm-statistics-2026', 'HR &amp; HCM Statistics 2026: Workforce, Spending &amp; Adoption Data', 'Review 2026 HR and HCM statistics covering workforce software, vendor disclosures, spending context, and adoption signals, with source limits explained.'],
    423 => ['bigcommerce-statistics-2026', 'BigCommerce Statistics 2026: Revenue and Merchant Trends', 'Review 2026 BigCommerce statistics covering public company results, platform context, merchant trends, and the Commerce.com rebrand, with source limits.'],
    420 => ['amazon-fba-statistics-2026', 'Amazon FBA Statistics 2026: Seller and Program Data', 'Review 2026 Amazon FBA statistics covering program rules, seller economics, fees, and the limits of public success and ROI data, with source notes.'],
    572 => ['slack-vs-teams-vs-zoom', 'Slack vs Microsoft Teams vs Zoom 2026', 'Compare Slack, Microsoft Teams, and Zoom for messaging, meetings, integrations, administration, and common business use cases in this 2026 guide.'],
    576 => ['mixpanel-vs-amplitude-vs-google-analytics', 'Mixpanel vs Amplitude vs Google Analytics 2026', 'Compare Mixpanel, Amplitude, and Google Analytics for product analytics, event tracking, reporting, implementation, and common 2026 use cases today.'],
    590 => ['best-bi-tools', 'Best Business Intelligence Tools 2026', 'Compare leading business intelligence tools for dashboards, reporting, data modeling, governance, deployment, and team fit in this practical 2026 guide.'],
    589 => ['best-hr-software-small-business', 'Best HR Software for Small Business 2026', 'Compare HR software for small businesses across payroll, hiring, benefits, compliance, integrations, pricing considerations, and implementation fit.'],
];

$failures = [];
foreach ($expected as $postId => [$slug, $title, $excerpt]) {
    $post = get_post($postId);
    if (!$post || $post->post_status !== 'publish') {
        $failures[] = "Post {$postId}: missing or not published.";
        continue;
    }
    if ($post->post_name !== $slug) {
        $failures[] = "Post {$postId}: slug mismatch.";
    }
    if ($post->post_title !== $title) {
        $failures[] = "Post {$postId}: title mismatch.";
    }
    if ($post->post_excerpt !== $excerpt) {
        $failures[] = "Post {$postId}: excerpt mismatch.";
    }
    if (strlen($excerpt) < 145 || strlen($excerpt) > 160) {
        $failures[] = "Post {$postId}: excerpt length outside 145-160.";
    }
    echo "CHECKED {$postId} {$slug} title=" . strlen($title) . " excerpt=" . strlen($excerpt) . "\n";
}

if ($failures) {
    foreach ($failures as $failure) {
        fwrite(STDERR, $failure . "\n");
    }
    exit(1);
}

echo "Verified " . count($expected) . " CTR metadata updates.\n";
