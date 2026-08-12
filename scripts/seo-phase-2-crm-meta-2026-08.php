<?php
/**
 * Guarded correction for the malformed CRM statistics excerpt.
 *
 * Dry run:
 *   wp eval-file seo-phase-2-crm-meta-2026-08.php
 *
 * Apply:
 *   wp eval-file seo-phase-2-crm-meta-2026-08.php apply
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Load WordPress before running this file.\n");
    exit(1);
}

$post_id = 219;
$slug = 'crm-software-statistics-2026';
$old_excerpt = 'CRM Software Statistics 2026: Platform Data and Disclosure Limits: (NYSE: HUBS) are two of the largest publicly traded providers of CRM software.';
$new_excerpt = 'Review 2026 CRM software statistics using public company disclosures, platform data, and clearly labeled limits for market, adoption, and vendor comparisons.';
$apply = in_array('apply', $args ?? [], true);

$post = get_post($post_id);
if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
    fwrite(STDERR, "Post {$post_id} is missing or not published.\n");
    exit(1);
}
if ($post->post_name !== $slug) {
    fwrite(STDERR, "Post {$post_id} slug mismatch.\n");
    exit(1);
}
if (!in_array($post->post_excerpt, [$old_excerpt, $new_excerpt], true)) {
    fwrite(STDERR, "Post {$post_id} excerpt guard mismatch.\n");
    exit(1);
}

if (!$apply) {
    echo "READY {$post_id} {$slug}\n";
    exit(0);
}

if ($post->post_excerpt !== $new_excerpt) {
    $result = wp_update_post(wp_slash([
        'ID' => $post_id,
        'post_excerpt' => $new_excerpt,
    ]), true);
    if (is_wp_error($result)) {
        fwrite(STDERR, "Post {$post_id}: {$result->get_error_message()}\n");
        exit(1);
    }
}

$verified = get_post($post_id);
if (!$verified || $verified->post_excerpt !== $new_excerpt) {
    fwrite(STDERR, "Post {$post_id} write verification failed.\n");
    exit(1);
}

echo "UPDATED {$post_id} {$slug}\n";
