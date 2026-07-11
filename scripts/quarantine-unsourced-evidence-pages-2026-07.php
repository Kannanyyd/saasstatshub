<?php
/** Quarantine published evidence-dependent pages that have no clickable source. */

$apply = in_array('apply', $args ?? [], true);
$ids = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids']);
$changed = 0;
foreach ($ids as $post_id) {
    $post = get_post($post_id);
    if (!preg_match('/\b(?:statistics?|market size|annual report|state of|benchmarks?|survey|research report|data and trends)\b/i', $post->post_title)) continue;
    if (preg_match('/<a\b[^>]*href=["\']https?:\/\//i', $post->post_content)) continue;

    $has_source_url = false;
    $sources = function_exists('get_field') ? get_field('sources', $post_id) : [];
    if (is_array($sources)) {
        foreach ($sources as $source) {
            if (!empty($source['url']) && preg_match('/^https?:\/\//i', $source['url'])) {
                $has_source_url = true;
                break;
            }
        }
    }
    if ($has_source_url) continue;

    printf("%s\t%d\t%s\t%s\n", $apply ? 'quarantine' : 'would-quarantine', $post_id, $post->post_name, $post->post_title);
    if ($apply) {
        $result = wp_update_post(['ID' => $post_id, 'post_status' => 'draft'], true);
        if (is_wp_error($result)) {
            fwrite(STDERR, "$post_id: " . $result->get_error_message() . "\n");
            exit(1);
        }
        $changed++;
    }
}
fwrite(STDERR, "SUMMARY changed=$changed\n");

