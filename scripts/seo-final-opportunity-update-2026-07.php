<?php
/**
 * Guarded final July 2026 GSC opportunity update.
 *
 * Dry run:
 *   wp eval-file seo-final-opportunity-update-2026-07.php
 *
 * Apply:
 *   wp eval-file seo-final-opportunity-update-2026-07.php apply
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Load WordPress before running this file.\n");
    exit(1);
}

if (!function_exists('get_field') || !function_exists('update_field')) {
    fwrite(STDERR, "ACF is required for this update.\n");
    exit(1);
}

$market_update = [
    'post_id' => 108,
    'slug' => 'saas-market-size-statistics-2026',
    'old_title' => 'SaaS Market Statistics 2026: Software Spending and Public Company Indicators',
    'old_excerpt' => 'A collaboration product may be counted as application software, SaaS, public cloud, or part of a larger productivity suite depending on the source.',
    'title' => 'SaaS Market Size 2026: Spending and Growth Data',
    'excerpt' => 'Review 2026 SaaS market size estimates, software spending, growth forecasts, and public-company indicators, with each source scope clearly explained.',
];

$comparison_update = [
    'post_id' => 574,
    'slug' => 'zoho-vs-freshsales-vs-close',
    'sources' => [
        [
            'name' => 'Zoho',
            'title' => 'Zoho CRM Pricing and Editions',
            'date' => 'Accessed July 31, 2026',
            'url' => 'https://www.zoho.com/crm/zohocrm-pricing.html',
        ],
        [
            'name' => 'Freshworks',
            'title' => 'Freshsales Pricing and Plans',
            'date' => 'Accessed July 31, 2026',
            'url' => 'https://www.freshworks.com/crm/pricing/',
        ],
        [
            'name' => 'Close',
            'title' => 'Close CRM Pricing',
            'date' => 'Accessed July 31, 2026',
            'url' => 'https://www.close.com/pricing',
        ],
    ],
];

$failures = [];
$market_post = get_post($market_update['post_id']);
$comparison_post = get_post($comparison_update['post_id']);

foreach ([[$market_post, $market_update], [$comparison_post, $comparison_update]] as [$post, $update]) {
    if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
        $failures[] = "Post {$update['post_id']}: missing or not published.";
        continue;
    }
    if ($post->post_name !== $update['slug']) {
        $failures[] = "Post {$update['post_id']}: slug mismatch.";
    }
}

if ($market_post) {
    if (!in_array($market_post->post_title, [$market_update['old_title'], $market_update['title']], true)) {
        $failures[] = "Post 108: title guard mismatch.";
    }
    $market_excerpt = wp_strip_all_tags($market_post->post_excerpt);
    if (!in_array($market_excerpt, [$market_update['old_excerpt'], $market_update['excerpt']], true)) {
        $failures[] = "Post 108: excerpt guard mismatch.";
    }
}

if ($comparison_post) {
    $existing_sources = get_field('sources', $comparison_update['post_id']);
    if (is_array($existing_sources) && count($existing_sources) > 0) {
        $expected_urls = array_map(
            static fn(array $source): string => untrailingslashit($source['url']),
            $comparison_update['sources']
        );
        $existing_urls = array_values(array_filter(array_map(
            static fn($source): string => isset($source['url']) ? untrailingslashit($source['url']) : '',
            $existing_sources
        )));
        sort($expected_urls);
        sort($existing_urls);
        if ($existing_urls !== $expected_urls) {
            $failures[] = "Post 574: existing sources are not empty or already current.";
        }
    }
}

if ($failures) {
    foreach ($failures as $failure) {
        fwrite(STDERR, $failure . "\n");
    }
    exit(1);
}

$apply = in_array('apply', $args ?? [], true);
if (!$apply) {
    echo "READY 108 {$market_update['slug']}\n";
    echo "READY 574 {$comparison_update['slug']}\n";
    echo "Dry run passed for 2 posts.\n";
    exit(0);
}

$result = wp_update_post(wp_slash([
    'ID' => $market_update['post_id'],
    'post_title' => $market_update['title'],
    'post_excerpt' => $market_update['excerpt'],
]), true);
if (is_wp_error($result)) {
    throw new RuntimeException("Post 108: {$result->get_error_message()}");
}

if (!update_field('sources', $comparison_update['sources'], $comparison_update['post_id'])) {
    $stored = get_field('sources', $comparison_update['post_id']);
    if (!is_array($stored) || count($stored) !== count($comparison_update['sources'])) {
        throw new RuntimeException('Post 574: failed to update sources.');
    }
}

echo "UPDATED 108 {$market_update['slug']}\n";
echo "UPDATED 574 {$comparison_update['slug']}\n";
echo "Applied final opportunity updates to 2 posts.\n";
