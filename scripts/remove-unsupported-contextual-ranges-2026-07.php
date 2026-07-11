<?php
/** Remove residual unsupported 30-50% / 20-35% claims conservatively. */

$apply = in_array('apply', $args ?? [], true);
$key_data_ids = [160, 214, 486, 488, 489, 490, 491, 492, 493, 494, 495, 496, 498, 499, 500, 501, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543];
$ids = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids', 'orderby' => 'ID', 'order' => 'ASC']);
$changed = 0;
$removed = 0;
$errors = [];

function range_text(DOMNode $node): string {
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode($node->textContent, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}
function range_words(string $html): int {
    $text = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags($html)));
    return $text === '' ? 0 : count(preg_split('/\s+/u', $text));
}
function range_remove(DOMNode $node): void {
    if ($node->parentNode) $node->parentNode->removeChild($node);
}

foreach ($ids as $post_id) {
    if (in_array($post_id, $key_data_ids, true)) continue;
    $original = get_post_field('post_content', $post_id);
    if (!preg_match('/30-50%|20-35%/i', $original)) continue;

    libxml_use_internal_errors(true);
    $dom = new DOMDocument('1.0', 'UTF-8');
    if (!$dom->loadHTML('<?xml encoding="utf-8" ?><div id="range-root">' . $original . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD)) {
        $errors[] = "$post_id: invalid HTML";
        continue;
    }
    libxml_clear_errors();
    $xpath = new DOMXPath($dom);
    $targets = [];
    foreach (iterator_to_array($xpath->query('//p | //li | //tr')) as $node) {
        if (preg_match('/30-50%|20-35%/i', range_text($node))) $targets[] = $node;
    }
    if (!$targets) continue;

    foreach ($targets as $node) range_remove($node);
    foreach (iterator_to_array($xpath->query('//ul[not(li)] | //ol[not(li)] | //table[not(.//tr)]')) as $empty) range_remove($empty);

    $root = $dom->getElementById('range-root');
    $updated = '';
    foreach (iterator_to_array($root->childNodes) as $child) $updated .= $dom->saveHTML($child);
    $words = range_words($updated);
    if ($words < 800 || preg_match('/30-50%|20-35%/i', $updated)) {
        $errors[] = "$post_id: refused (words=$words residual=" . (preg_match('/30-50%|20-35%/i', $updated) ? 'yes' : 'no') . ')';
        continue;
    }

    $changed++;
    $removed += count($targets);
    echo implode("\t", [$post_id, get_post_field('post_name', $post_id), range_words($original), $words, count($targets)]) . "\n";
    if ($apply) {
        $result = wp_update_post(['ID' => $post_id, 'post_content' => $updated], true);
        if (is_wp_error($result)) $errors[] = "$post_id: " . $result->get_error_message();
    }
}

fwrite(STDERR, "SUMMARY changed=$changed removed=$removed errors=" . count($errors) . "\n");
if ($errors) {
    fwrite(STDERR, implode("\n", $errors) . "\n");
    exit(1);
}

