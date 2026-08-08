<?php
/** Verify the evidence rewrite for post 592. */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Load WordPress before running this file.\n");
    exit(1);
}

$post = get_post(592);
$failures = [];
$required = [
    'There is no official government wage series specifically for SaaS sales representatives.',
    '$60,000 median base',
    '$190,000 median OTE',
    '$87,040 annual mean wage',
    'Methodology and Limitations',
];
$forbidden = [
    '$120,000–$200,000', '$350K OTE', '70–80% of US', '80–100% of US',
    '0.01–0.05%', '30–50% of total compensation', '6–12 months for enterprise',
];

if (!$post || $post->post_status !== 'publish' || $post->post_name !== 'saas-sales-rep-salary') {
    $failures[] = 'Post 592 is missing, unpublished, or has the wrong slug.';
} else {
    foreach ($required as $needle) {
        if (strpos($post->post_content, $needle) === false) {
            $failures[] = "Missing required content: {$needle}";
        }
    }
    foreach ($forbidden as $needle) {
        if (strpos($post->post_content, $needle) !== false) {
            $failures[] = "Forbidden unsupported claim remains: {$needle}";
        }
    }
    $words = str_word_count(wp_strip_all_tags($post->post_content));
    if ($words < 1200 || $words > 1900) {
        $failures[] = "Content word count outside 1200-1900: {$words}";
    }
}

foreach (['quick_overview_items' => 6, 'key_takeaways' => 5, 'sources' => 4] as $field => $count) {
    $value = get_field($field, 592, false);
    if (!is_array($value) || count($value) !== $count) {
        $actual = is_array($value) ? count($value) : 0;
        $failures[] = "{$field} count {$actual}; expected {$count}.";
    }
}

$sources = get_field('sources', 592);
foreach ((array) $sources as $source) {
    if (empty($source['url']) || !filter_var($source['url'], FILTER_VALIDATE_URL)) {
        $failures[] = 'A source URL is missing or invalid.';
    }
}

if ($failures) {
    foreach ($failures as $failure) {
        fwrite(STDERR, $failure . "\n");
    }
    exit(1);
}

echo "VERIFIED 592 saas-sales-rep-salary words={$words} sources=4\n";
