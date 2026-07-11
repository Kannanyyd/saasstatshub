<?php
/** Read-only audit for evidence-dependent pages without any clickable source. */

$ids = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids']);
$count = 0;
foreach ($ids as $post_id) {
    $post = get_post($post_id);
    $evidence_dependent = preg_match('/\b(?:statistics?|market size|annual report|state of|benchmarks?|survey|research report|data and trends)\b/i', $post->post_title);
    if (!$evidence_dependent) continue;

    $body_has_url = preg_match('/<a\b[^>]*href=["\']https?:\/\//i', $post->post_content);
    $source_has_url = false;
    $sources = function_exists('get_field') ? get_field('sources', $post_id) : [];
    if (is_array($sources)) {
        foreach ($sources as $source) {
            if (!empty($source['url']) && preg_match('/^https?:\/\//i', $source['url'])) {
                $source_has_url = true;
                break;
            }
        }
    }
    if ($body_has_url || $source_has_url) continue;

    $count++;
    echo implode("\t", [$post_id, $post->post_name, $post->post_title]) . "\n";
}
fwrite(STDERR, "SUMMARY unsourced_evidence_pages=$count\n");

