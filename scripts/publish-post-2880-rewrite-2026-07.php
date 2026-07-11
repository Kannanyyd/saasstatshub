<?php
/** Publish the reviewed Post 2880 rewrite from its immutable Markdown artifact. */

$apply = in_array('apply', $args ?? [], true);
$artifact = __DIR__ . '/post-2880-rewrite.md';
if (!is_file($artifact)) {
    fwrite(STDERR, "Missing rewrite artifact.\n");
    exit(1);
}

$markdown = file_get_contents($artifact);
preg_match('/meta_description:\s*(.+)/', $markdown, $meta_match);
preg_match('/```html\s*(.*?)\s*```/s', $markdown, $html_match);
$excerpt = trim($meta_match[1] ?? '');
$content = trim($html_match[1] ?? '');

$post = get_post(2880);
if (!$post || $post->post_name !== 'what-is-voip-phone-system') {
    fwrite(STDERR, "Post identity check failed.\n");
    exit(1);
}
if (!str_contains($post->post_content, 'A professional services firm implements VoIP Phone System') && !$apply) {
    fwrite(STDERR, "Old-content fingerprint is absent.\n");
    exit(1);
}
if ($content === '' || strlen($excerpt) < 145 || strlen($excerpt) > 160) {
    fwrite(STDERR, "Artifact validation failed.\n");
    exit(1);
}

$sources = [
    ['name' => 'Federal Communications Commission', 'title' => 'Fixed Voice Subscription Definitions', 'date' => '2026', 'url' => 'https://help.bdc.fcc.gov/hc/en-us/articles/5296999815579-Fixed-Voice-Subscription-Definitions'],
    ['name' => 'Internet Engineering Task Force', 'title' => 'RFC 3261: SIP - Session Initiation Protocol', 'date' => '2002', 'url' => 'https://datatracker.ietf.org/doc/html/rfc3261'],
    ['name' => 'National Institute of Standards and Technology', 'title' => 'SP 800-58: Security Considerations for Voice Over IP Systems', 'date' => '2005', 'url' => 'https://csrc.nist.gov/pubs/sp/800/58/final'],
    ['name' => 'Federal Communications Commission', 'title' => "Implementing Kari's Law and RAY BAUM'S Act", 'date' => '2019', 'url' => 'https://docs.fcc.gov/public/attachments/FCC-19-76A1.pdf'],
];

printf("%s Post 2880: %d content bytes, %d meta chars, %d sources\n", $apply ? 'Publishing' : 'Would publish', strlen($content), strlen($excerpt), count($sources));
if (!$apply) {
    exit(0);
}

$result = wp_update_post(['ID' => 2880, 'post_content' => $content, 'post_excerpt' => $excerpt], true);
if (is_wp_error($result)) {
    fwrite(STDERR, $result->get_error_message() . "\n");
    exit(1);
}
if (function_exists('update_field')) {
    update_field('sources', $sources, 2880);
}

