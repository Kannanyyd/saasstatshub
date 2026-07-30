<?php
/**
 * Guarded GSC opportunity update for July 30, 2026.
 *
 * Dry run:
 *   wp eval-file seo-gsc-opportunity-update-2026-07.php
 *
 * Apply after exporting the affected post metadata:
 *   wp eval-file seo-gsc-opportunity-update-2026-07.php apply
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Load WordPress before running this file.\n");
    exit(1);
}

if (!function_exists('get_field') || !function_exists('update_field')) {
    fwrite(STDERR, "ACF is required for this update.\n");
    exit(1);
}

$updates = [
    136 => [
        'slug' => 'ai-saas-statistics-2026',
        'old_title' => 'AI SaaS Statistics 2026: Spending, Adoption and Enterprise Scale',
        'old_excerpt' => 'Explore 2026 AI SaaS statistics on spending and enterprise adoption, with clear distinctions between AI software, infrastructure, services, and SaaS.',
        'title' => 'AI SaaS Statistics 2026: Spending and Adoption',
        'excerpt' => 'Explore 2026 AI SaaS statistics on spending and enterprise adoption, with clear distinctions between AI software, infrastructure, services, and SaaS.',
    ],
    140 => [
        'slug' => 'cybersecurity-statistics-2026',
        'old_title' => 'Cybersecurity Statistics 2026: Breach Costs, Crime and Ransomware',
        'old_excerpt' => 'Review 2026 cybersecurity statistics from the FBI, IBM, Verizon, and CISA covering reported losses, breach costs, ransomware, and exploited vulnerabilities.',
        'title' => 'Cybersecurity Statistics 2026: Breaches and Ransomware',
        'excerpt' => 'Review 2026 cybersecurity statistics from the FBI, IBM, Verizon, and CISA covering reported losses, breach costs, ransomware, and exploited vulnerabilities.',
    ],
    574 => [
        'slug' => 'zoho-vs-freshsales-vs-close',
        'old_title' => 'Zoho vs Freshsales vs Close: 2026 CRM Comparison for Startups',
        'old_excerpt' => 'Compare Zoho CRM, Freshsales, and Close by workflow, sales communication, automation, ecosystem, and current official pricing for startup teams.',
        'title' => 'Zoho vs Freshsales vs Close (2026): CRM Comparison',
        'excerpt' => 'Compare Zoho CRM, Freshsales, and Close by workflow, sales communication, automation, ecosystem, and current official pricing for startup teams.',
        'expected_counts' => [
            'quick_overview_items' => 10,
            'key_takeaways' => 10,
            'faq' => 4,
        ],
        'fields' => [
            'quick_overview_items' => [
                ['stat_label' => 'Customization and ecosystem', 'stat_value' => 'Zoho CRM'],
                ['stat_label' => 'Integrated sales workspace', 'stat_value' => 'Freshsales'],
                ['stat_label' => 'Outbound communication workflow', 'stat_value' => 'Close'],
            ],
            'key_takeaways' => [
                ['takeaway_text' => 'Zoho CRM is the strongest fit when customization and a broad connected software suite matter most.'],
                ['takeaway_text' => 'Freshsales suits teams that want CRM, communication, and automation in one product family.'],
                ['takeaway_text' => 'Close is designed around calling, email, SMS, sequences, and outbound rep productivity.'],
                ['takeaway_text' => 'Plan limits and communication allowances should be verified on each vendor\'s official pricing page.'],
                ['takeaway_text' => 'A trial using the same pipeline, import, automation, and report is more useful than a feature checklist alone.'],
            ],
            'faq' => [
                [
                    'question' => 'Which CRM is best for a startup sales team?',
                    'answer' => 'The answer depends on the sales motion. Zoho CRM favors customization and ecosystem breadth, Freshsales favors an integrated sales workspace, and Close favors communication-heavy outbound teams.',
                ],
                [
                    'question' => 'Is Zoho CRM more customizable than Freshsales and Close?',
                    'answer' => 'Zoho CRM generally offers the broadest configuration and connected application ecosystem of the three, although that flexibility can require more setup and administration.',
                ],
                [
                    'question' => 'How should teams compare CRM pricing?',
                    'answer' => 'Compare the exact plan, user count, communication allowances, automation limits, integrations, add-ons, and billing terms on each vendor\'s official pricing page.',
                ],
            ],
        ],
    ],
    584 => [
        'slug' => 'best-crm-small-business',
        'old_title' => 'Best CRM for Small Business 2026: Pricing and Features Compared',
        'old_excerpt' => 'Compare six small-business CRM options using official product information, workflow fit, pricing transparency, integrations, and practical selection criteria.',
        'title' => 'Best CRM for Small Business 2026: Pricing and Features Compared',
        'excerpt' => 'Compare six small-business CRM options using official product information, workflow fit, pricing transparency, integrations, and practical selection criteria.',
        'expected_counts' => [
            'quick_overview_items' => 11,
            'key_takeaways' => 10,
            'faq' => 4,
        ],
        'fields' => [
            'quick_overview_items' => [
                ['stat_label' => 'Products compared', 'stat_value' => '6 CRM platforms'],
                ['stat_label' => 'Evaluation focus', 'stat_value' => 'Workflow, setup, reporting, pricing and integrations'],
                ['stat_label' => 'Pricing reference', 'stat_value' => 'Official vendor pages'],
            ],
            'key_takeaways' => [
                ['takeaway_text' => 'The best CRM depends on the sales workflow and the team\'s ability to maintain the system consistently.'],
                ['takeaway_text' => 'HubSpot is a strong shortlist option for teams connecting sales with inbound marketing and service workflows.'],
                ['takeaway_text' => 'Zoho CRM emphasizes customization, while Pipedrive emphasizes visual pipeline management.'],
                ['takeaway_text' => 'Salesforce Starter offers a path into the wider Salesforce ecosystem, while Freshsales combines sales communication and automation.'],
                ['takeaway_text' => 'Teams should test imports, permissions, automation, reporting, and integrations before committing to a plan.'],
            ],
            'faq' => [
                [
                    'question' => 'What is the best CRM for a small business?',
                    'answer' => 'There is no universal winner. The best fit depends on the sales process, required integrations, reporting needs, budget, and the amount of configuration the team can support.',
                ],
                [
                    'question' => 'Should a small business choose a free CRM?',
                    'answer' => 'A free CRM can be a useful starting point, but teams should check the paid features they may later need, including automation, reporting, permissions, integrations, and support.',
                ],
                [
                    'question' => 'How should a small business test CRM software?',
                    'answer' => 'Use representative data to test one real lead from capture through close, including imports, duplicate handling, permissions, automation, reporting, and handoff.',
                ],
            ],
        ],
    ],
    598 => [
        'slug' => 'state-of-saas-2026-annual-report',
        'old_title' => 'State of SaaS 2026: Market Trends, Buyers and Cloud Operations',
        'old_excerpt' => 'Read a source-scoped 2026 SaaS industry report covering cloud spending context, software buying, SaaS operations, AI, security, and methodology.',
        'title' => '7 B2B SaaS Market Trends for 2026: State of SaaS',
        'excerpt' => 'Explore seven B2B SaaS market trends for 2026 covering software buying, SaaS operations, AI, security, consolidation, and cloud spending context.',
        'expected_counts' => [
            'quick_overview_items' => 48,
            'key_takeaways' => 14,
            'faq' => 4,
        ],
        'fields' => [
            'quick_overview_items' => [
                ['stat_label' => 'Report scope', 'stat_value' => '7 B2B SaaS market trends'],
                ['stat_label' => 'Evidence approach', 'stat_value' => 'Named reports with source limits'],
                ['stat_label' => 'Coverage', 'stat_value' => 'Buying, operations, AI, security and platforms'],
            ],
            'key_takeaways' => [
                ['takeaway_text' => 'Public-cloud spending is useful context but should not be relabeled as SaaS revenue.'],
                ['takeaway_text' => 'Software buyers increasingly evaluate AI, security, integration, and vendor risk together.'],
                ['takeaway_text' => 'SaaS management now includes ownership, utilization, renewals, access, and spend governance.'],
                ['takeaway_text' => 'Platform consolidation and specialized products will continue to coexist.'],
                ['takeaway_text' => 'Forecasts and vendor benchmarks are directional evidence rather than universal market facts.'],
            ],
            'faq' => [
                [
                    'question' => 'What are the main B2B SaaS trends for 2026?',
                    'answer' => 'The report covers cloud spending context, more deliberate software buying, SaaS operations, AI expectations, security and resilience, platform consolidation, and the signals to watch through 2026.',
                ],
                [
                    'question' => 'Does this report estimate the total SaaS market size?',
                    'answer' => 'No. It keeps public-cloud, vendor, platform, and buyer-survey evidence in their original scopes instead of combining incompatible estimates into one market total.',
                ],
                [
                    'question' => 'How were sources selected for the State of SaaS report?',
                    'answer' => 'The report prioritizes named reports and direct links, identifies vendor and platform samples, labels forecasts, and explains important scope and methodology limits.',
                ],
            ],
        ],
    ],
];

$apply = in_array('apply', $args ?? [], true);
$errors = [];

foreach ($updates as $post_id => $update) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
        $errors[] = "Post {$post_id}: missing or not published.";
        continue;
    }
    if ($post->post_name !== $update['slug']) {
        $errors[] = "Post {$post_id}: slug mismatch.";
    }
    if (!in_array($post->post_title, [$update['old_title'], $update['title']], true)) {
        $errors[] = "Post {$post_id}: title guard mismatch.";
    }
    if (!in_array($post->post_excerpt, [$update['old_excerpt'], $update['excerpt']], true)) {
        $errors[] = "Post {$post_id}: excerpt guard mismatch.";
    }
    foreach ($update['expected_counts'] ?? [] as $field => $expected_count) {
        $actual = get_field($field, $post_id, false);
        $actual_count = is_array($actual) ? count($actual) : (int) $actual;
        $target_count = count($update['fields'][$field]);
        if (!in_array($actual_count, [$expected_count, $target_count], true)) {
            $errors[] = "Post {$post_id}: {$field} count mismatch ({$actual_count}).";
        }
    }
}

if ($errors) {
    foreach ($errors as $error) {
        fwrite(STDERR, $error . "\n");
    }
    exit(1);
}

if (!$apply) {
    foreach ($updates as $post_id => $update) {
        echo "READY {$post_id} {$update['slug']}\n";
    }
    echo "Dry run passed for " . count($updates) . " posts.\n";
    exit(0);
}

foreach ($updates as $post_id => $update) {
    $post = get_post($post_id);
    $payload = ['ID' => $post_id];
    if ($post->post_title !== $update['title']) {
        $payload['post_title'] = $update['title'];
    }
    if ($post->post_excerpt !== $update['excerpt']) {
        $payload['post_excerpt'] = $update['excerpt'];
    }
    if (count($payload) > 1) {
        $result = wp_update_post(wp_slash($payload), true);
        if (is_wp_error($result)) {
            throw new RuntimeException("Post {$post_id}: {$result->get_error_message()}");
        }
    }

    foreach ($update['fields'] ?? [] as $field => $value) {
        if (!update_field($field, $value, $post_id)) {
            $stored = get_field($field, $post_id, false);
            if (!is_array($stored) || count($stored) !== count($value)) {
                throw new RuntimeException("Post {$post_id}: failed to update {$field}.");
            }
        }
    }
    echo "UPDATED {$post_id} {$update['slug']}\n";
}

echo "Applied GSC opportunity updates to " . count($updates) . " posts.\n";
