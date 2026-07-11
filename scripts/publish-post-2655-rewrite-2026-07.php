<?php
/** Publish the reviewed Post 2655 rewrite from its immutable Markdown artifact. */

$apply = in_array('apply', $args ?? [], true);
$artifact = __DIR__ . '/post-2655-rewrite.md';
$markdown = is_file($artifact) ? file_get_contents($artifact) : '';
preg_match('/meta_description:\s*(.+)/', $markdown, $meta_match);
preg_match('/```html\s*(.*?)\s*```/s', $markdown, $html_match);
$excerpt = trim($meta_match[1] ?? '');
$content = trim($html_match[1] ?? '');
$post = get_post(2655);

if (!$post || $post->post_name !== 'what-is-insurtech' || $content === '' || strlen($excerpt) < 145 || strlen($excerpt) > 160) {
    fwrite(STDERR, "Identity or artifact validation failed.\n");
    exit(1);
}
if (!str_contains($post->post_content, 'A insurtech implements Insurtech') && !$apply) {
    fwrite(STDERR, "Old-content fingerprint is absent.\n");
    exit(1);
}

preg_match_all('/<li><a href="([^"]+)">([^<]+)<\/a><\/li>/', $content, $source_matches, PREG_SET_ORDER);
$sources = [];
foreach ($source_matches as $match) {
    $host = parse_url($match[1], PHP_URL_HOST) ?: 'Source';
    $sources[] = ['name' => $host, 'title' => $match[2], 'date' => '2026', 'url' => $match[1]];
}
if (count($sources) < 3 || count($sources) > 6) {
    fwrite(STDERR, "Source extraction failed.\n");
    exit(1);
}

printf("%s Post 2655: %d bytes, %d meta chars, %d sources\n", $apply ? 'Publishing' : 'Would publish', strlen($content), strlen($excerpt), count($sources));
if (!$apply) exit(0);

$result = wp_update_post(['ID' => 2655, 'post_content' => $content, 'post_excerpt' => $excerpt], true);
if (is_wp_error($result)) {
    fwrite(STDERR, $result->get_error_message() . "\n");
    exit(1);
}
if (function_exists('update_field')) update_field('sources', $sources, 2655);

