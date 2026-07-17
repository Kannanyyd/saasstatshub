<?php
/**
 * Guarded title and excerpt update for the July 2026 GSC priority set.
 *
 * Dry run:
 *   wp eval-file seo-ctr-update-2026-07.php
 *
 * Apply after a database backup:
 *   wp eval-file seo-ctr-update-2026-07.php apply
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Load WordPress before running this file.\n");
    exit(1);
}

$updates = [
    592 => [
        'slug' => 'saas-sales-rep-salary',
        'old_title' => 'SaaS Sales Rep Salary 2026',
        'old_excerpt' => 'SaaS Sales Rep Salary 2026 organizes the page around methodology, limitations, scope notes, definitions, core concepts, and practical considerations in context.',
        'title' => 'SaaS Sales Rep Salary 2026: Base Pay, OTE and Commission',
        'excerpt' => 'Compare SaaS sales representative compensation across base pay, commission, OTE, and role levels, with source notes, methodology, and practical limits.',
    ],
    404 => [
        'slug' => 'small-business-crm-statistics-2026',
        'old_title' => 'Small Business CRM Statistics 2026: Verified Public Signals and Limits',
        'old_excerpt' => 'Small Business CRM Statistics 2026: Verified Public Signals and Limits: HubSpot and Salesforce pages provide small-business CRM workflow context.',
        'title' => 'Small Business CRM Statistics 2026: Vendor and Workflow Data',
        'excerpt' => 'Review 2026 small-business CRM statistics using public HubSpot and Salesforce evidence, with workflow context, source notes, and clear data limitations.',
    ],
    142 => [
        'slug' => 'ecommerce-statistics-2026',
        'old_title' => 'E-commerce Statistics 2026: U.S. Online Sales, Mobile Shopping, and Platform Growth',
        'old_excerpt' => 'That gap supports a measured conclusion: online sales continue to expand faster than total retail, but the pace is not a reason to invent dramatic claims.',
        'title' => 'E-commerce Statistics 2026: U.S. Sales and Mobile Trends',
        'excerpt' => 'Explore 2026 e-commerce statistics on U.S. online sales, mobile shopping, retail share, and platform trends, with source scope and limitations explained.',
    ],
    144 => [
        'slug' => 'hr-hcm-statistics-2026',
        'old_title' => 'HR &amp; HCM Statistics 2026: Workforce, Spending &amp; Adoption Data',
        'old_excerpt' => 'Public HCM vendors including Workday, ADP, UKG, and Oracle HCM Cloud publish adoption metrics in their quarterly earnings calls and 10-K filings.',
        'title' => 'HR &amp; HCM Statistics 2026: Workforce, Spending &amp; Adoption Data',
        'excerpt' => 'Review 2026 HR and HCM statistics covering workforce software, vendor disclosures, spending context, and adoption signals, with source limits explained.',
    ],
    423 => [
        'slug' => 'bigcommerce-statistics-2026',
        'old_title' => 'BigCommerce Statistics 2026: Platform Revenue, Merchant Trends, and the Commerce.com Rebrand',
        'old_excerpt' => 'BigCommerce Statistics 2026: Platform Revenue, Merchant Trends, and the Commerce.com Rebrand: BigCommerce rebranded its parent company to Commerce.',
        'title' => 'BigCommerce Statistics 2026: Revenue and Merchant Trends',
        'excerpt' => 'Review 2026 BigCommerce statistics covering public company results, platform context, merchant trends, and the Commerce.com rebrand, with source limits.',
    ],
    420 => [
        'slug' => 'amazon-fba-statistics-2026',
        'old_title' => 'Amazon FBA Statistics 2026: Verified Program Signals and Seller Limits',
        'old_excerpt' => 'Amazon FBA may be valuable for eligible products, but public pages do not disclose a verified average profit, success rate, or ROI for all sellers.',
        'title' => 'Amazon FBA Statistics 2026: Seller and Program Data',
        'excerpt' => 'Review 2026 Amazon FBA statistics covering program rules, seller economics, fees, and the limits of public success and ROI data, with source notes.',
    ],
    572 => [
        'slug' => 'slack-vs-teams-vs-zoom',
        'old_title' => 'Slack vs Microsoft Teams vs Zoom 2026',
        'old_excerpt' => 'Slack vs Microsoft Teams vs Zoom 2026 organizes the comparison by capabilities, use cases, implementation considerations, limitations, and evaluation notes.',
        'title' => 'Slack vs Microsoft Teams vs Zoom 2026',
        'excerpt' => 'Compare Slack, Microsoft Teams, and Zoom for messaging, meetings, integrations, administration, and common business use cases in this 2026 guide.',
    ],
    576 => [
        'slug' => 'mixpanel-vs-amplitude-vs-google-analytics',
        'old_title' => 'Mixpanel vs Amplitude vs Google Analytics 2026',
        'old_excerpt' => 'Mixpanel vs Amplitude vs Google Analytics 2026: Founded in 2009, Mixpanel has established itself as the go-to event-based product analytics platform.',
        'title' => 'Mixpanel vs Amplitude vs Google Analytics 2026',
        'excerpt' => 'Compare Mixpanel, Amplitude, and Google Analytics for product analytics, event tracking, reporting, implementation, and common 2026 use cases today.',
    ],
    590 => [
        'slug' => 'best-bi-tools',
        'old_title' => 'Best Business Intelligence Tools 2026',
        'old_excerpt' => 'Best Business Intelligence Tools 2026 organizes methodology, limitations, scope notes, definitions, core concepts, and practical considerations in context.',
        'title' => 'Best Business Intelligence Tools 2026',
        'excerpt' => 'Compare leading business intelligence tools for dashboards, reporting, data modeling, governance, deployment, and team fit in this practical 2026 guide.',
    ],
    589 => [
        'slug' => 'best-hr-software-small-business',
        'old_title' => 'Best HR Software for Small Business 2026',
        'old_excerpt' => 'Best HR Software for Small Business 2026 organizes limitations, scope notes, definitions, core concepts, practical considerations, and methodology in context.',
        'title' => 'Best HR Software for Small Business 2026',
        'excerpt' => 'Compare HR software for small businesses across payroll, hiring, benefits, compliance, integrations, pricing considerations, and implementation fit.',
    ],
];

$apply = in_array('apply', $args ?? [], true);
$guardFailures = [];

foreach ($updates as $postId => $update) {
    $post = get_post($postId);
    if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
        $guardFailures[] = "Post {$postId}: missing or not published.";
        continue;
    }
    if ($post->post_name !== $update['slug']) {
        $guardFailures[] = "Post {$postId}: slug mismatch.";
    }
    if (!in_array($post->post_title, [$update['old_title'], $update['title']], true)) {
        $guardFailures[] = "Post {$postId}: title guard mismatch.";
    }
    if (!in_array($post->post_excerpt, [$update['old_excerpt'], $update['excerpt']], true)) {
        $guardFailures[] = "Post {$postId}: excerpt guard mismatch.";
    }
}

if ($guardFailures) {
    foreach ($guardFailures as $failure) {
        fwrite(STDERR, $failure . "\n");
    }
    exit(1);
}

if (!$apply) {
    foreach ($updates as $postId => $update) {
        $post = get_post($postId);
        $state = $post->post_title === $update['title'] && $post->post_excerpt === $update['excerpt']
            ? 'CURRENT'
            : 'READY';
        echo "{$state} {$postId} {$update['slug']}\n";
    }
    echo "Dry run passed for " . count($updates) . " posts.\n";
    exit(0);
}

foreach ($updates as $postId => $update) {
    $post = get_post($postId);
    $payload = ['ID' => $postId];
    if ($post->post_title !== $update['title']) {
        $payload['post_title'] = $update['title'];
    }
    if ($post->post_excerpt !== $update['excerpt']) {
        $payload['post_excerpt'] = $update['excerpt'];
    }
    if (count($payload) === 1) {
        echo "UNCHANGED {$postId} {$update['slug']}\n";
        continue;
    }
    $result = wp_update_post($payload, true);
    if (is_wp_error($result)) {
        throw new RuntimeException("Post {$postId}: {$result->get_error_message()}");
    }
    echo "UPDATED {$postId} {$update['slug']}\n";
}

echo "Applied CTR metadata updates to " . count($updates) . " posts.\n";
