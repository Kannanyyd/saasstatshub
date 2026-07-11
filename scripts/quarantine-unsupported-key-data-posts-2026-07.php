<?php
/** Move the 41 unsupported Key Data / Forecast posts out of the public index. */

$apply = in_array('apply', $args ?? [], true);
$ids = [160, 214, 486, 488, 489, 490, 491, 492, 493, 494, 495, 496, 498, 499, 500, 501, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543];
$changed = 0;

foreach ($ids as $post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'post') {
        fwrite(STDERR, "Missing post $post_id\n");
        exit(1);
    }
    if (!preg_match('/(?:Key Data Points|2027 \(Forecast\))/i', $post->post_title)) {
        fwrite(STDERR, "Title fingerprint failed for $post_id: {$post->post_title}\n");
        exit(1);
    }
    if (!in_array($post->post_status, ['publish', 'draft'], true)) {
        fwrite(STDERR, "Unexpected status for $post_id: {$post->post_status}\n");
        exit(1);
    }
    printf("%s\t%d\t%s\t%s\n", $apply ? 'quarantine' : 'would-quarantine', $post_id, $post->post_name, $post->post_title);
    if ($apply && $post->post_status === 'publish') {
        $result = wp_update_post(['ID' => $post_id, 'post_status' => 'draft'], true);
        if (is_wp_error($result)) {
            fwrite(STDERR, $result->get_error_message() . "\n");
            exit(1);
        }
        $changed++;
    }
}

fwrite(STDERR, "SUMMARY count=" . count($ids) . " changed=$changed\n");

