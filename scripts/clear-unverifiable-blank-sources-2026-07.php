<?php
/** Clear ACF source repeaters when every row lacks a verifiable URL. */

$apply = in_array('apply', $args ?? [], true);
$ids = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids']);
$posts = 0;
$rows = 0;
foreach ($ids as $post_id) {
    $sources = function_exists('get_field') ? get_field('sources', $post_id) : [];
    if (!is_array($sources) || !$sources) continue;

    $has_url = false;
    foreach ($sources as $source) {
        if (!empty($source['url']) && preg_match('/^https?:\/\//i', trim($source['url']))) {
            $has_url = true;
            break;
        }
    }
    if ($has_url) continue;

    $posts++;
    $rows += count($sources);
    echo implode("\t", [$post_id, get_post_field('post_name', $post_id), count($sources)]) . "\n";
    if ($apply) update_field('sources', [], $post_id);
}
fwrite(STDERR, "SUMMARY posts=$posts rows=$rows mode=" . ($apply ? 'apply' : 'dry-run') . "\n");

