<?php
/**
 * Read-only verification for the final July 2026 GSC opportunity update.
 *
 * Run with:
 *   wp eval-file seo-final-opportunity-verify-2026-07.php
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Load WordPress before running this file.\n");
    exit(1);
}

if (!function_exists('get_field')) {
    fwrite(STDERR, "ACF is required for this verification.\n");
    exit(1);
}

$expected = [
    108 => [
        'slug' => 'saas-market-size-statistics-2026',
        'title' => 'SaaS Market Size 2026: Spending and Growth Data',
        'excerpt' => 'Review 2026 SaaS market size estimates, software spending, growth forecasts, and public-company indicators, with each source scope clearly explained.',
    ],
    574 => [
        'slug' => 'zoho-vs-freshsales-vs-close',
        'source_urls' => [
            'https://www.zoho.com/crm/zohocrm-pricing.html',
            'https://www.freshworks.com/crm/pricing/',
            'https://www.close.com/pricing',
        ],
    ],
];

$failures = [];

foreach ($expected as $post_id => $rules) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
        $failures[] = "Post {$post_id}: missing or not published.";
        continue;
    }
    if ($post->post_name !== $rules['slug']) {
        $failures[] = "Post {$post_id}: slug mismatch ({$post->post_name}).";
    }
    if (isset($rules['title']) && $post->post_title !== $rules['title']) {
        $failures[] = "Post {$post_id}: title mismatch.";
    }
    if (isset($rules['excerpt']) && wp_strip_all_tags($post->post_excerpt) !== $rules['excerpt']) {
        $failures[] = "Post {$post_id}: excerpt mismatch.";
    }
    if (isset($rules['source_urls'])) {
        $sources = get_field('sources', $post_id);
        $actual_urls = [];
        foreach (is_array($sources) ? $sources : [] as $source) {
            if (!empty($source['url'])) {
                $actual_urls[] = untrailingslashit($source['url']);
            }
        }
        $expected_urls = array_map('untrailingslashit', $rules['source_urls']);
        sort($actual_urls);
        sort($expected_urls);
        if ($actual_urls !== $expected_urls) {
            $failures[] = "Post {$post_id}: expected three official source URLs.";
        }
    }
}

if ($failures) {
    foreach ($failures as $failure) {
        fwrite(STDERR, $failure . "\n");
    }
    exit(1);
}

echo "Final opportunity verification passed for 2 posts.\n";
