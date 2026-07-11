<?php
/**
 * Remove only content templates confirmed by the 2026-07-11 full-site audit.
 *
 * Usage: wp eval-file remove-verified-content-templates-2026-07.php [apply]
 */

$apply = in_array('apply', $args ?? [], true);
$query = new WP_Query([
    'post_type' => 'post',
    'post_status' => 'publish',
    'posts_per_page' => -1,
    'fields' => 'ids',
    'orderby' => 'ID',
    'order' => 'ASC',
]);

$stats = ['changed' => 0, 'template_a' => 0, 'template_bc' => 0, 'whether_paragraph' => 0, 'whether_sentence' => 0, 'residual' => 0, 'case' => 0];
$errors = [];

function normalized_text(DOMNode $node): string {
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode($node->textContent, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}

function word_count_html(string $html): int {
    $text = trim(preg_replace('/\s+/u', ' ', wp_strip_all_tags($html)));
    return $text === '' ? 0 : count(preg_split('/\s+/u', $text));
}

function remove_node(DOMNode $node): void {
    if ($node->parentNode) {
        $node->parentNode->removeChild($node);
    }
}

foreach ($query->posts as $post_id) {
    $original = get_post_field('post_content', $post_id);
    if (!is_string($original) || $original === '') {
        continue;
    }

    libxml_use_internal_errors(true);
    $dom = new DOMDocument('1.0', 'UTF-8');
    $loaded = $dom->loadHTML('<?xml encoding="utf-8" ?><div id="remediation-root">' . $original . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    if (!$loaded) {
        $errors[] = "$post_id: invalid HTML";
        continue;
    }

    $xpath = new DOMXPath($dom);
    $local = ['template_a' => 0, 'template_bc' => 0, 'whether_paragraph' => 0, 'whether_sentence' => 0, 'residual' => 0, 'case' => 0];

    foreach (iterator_to_array($xpath->query('//p')) as $p) {
        $text = normalized_text($p);
        if (preg_match('/^Industry research indicates that organizations investing strategically in .+ see 30-50% improvement in operational efficiency and 20-35% reduction in costs\. The key to achieving these results lies in understanding the fundamentals and following proven implementation methodologies\.$/i', $text)) {
            remove_node($p);
            $local['template_a']++;
        } elseif (preg_match('/^Productivity gains are equally impressive, with teams reporting 30-50% time savings on routine tasks\b/i', $text)) {
            remove_node($p);
            $local['template_bc']++;
        } elseif (preg_match('/^Organizations that effectively implement .+ solutions typically see 25-40% improvement in operational efficiency, 20-35% reduction in costs, and 15-25% increase in customer satisfaction\b/i', $text)) {
            remove_node($p);
            $local['template_bc']++;
        } elseif (preg_match('/^Whether you are doing this for the first time or optimizing an existing process\b/i', $text)) {
            remove_node($p);
            $local['whether_paragraph']++;
        } elseif (str_contains($text, 'Whether you are evaluating solutions for the first time or optimizing an existing technology stack')) {
            $new = preg_replace('/\s*Whether you are evaluating solutions for the first time or optimizing an existing technology stack[^.]*throughout 2026 and beyond\./i', '', $text, 1, $count);
            if ($count === 1 && trim($new) !== '') {
                while ($p->firstChild) {
                    $p->removeChild($p->firstChild);
                }
                $p->appendChild($dom->createTextNode(trim($new)));
                $local['whether_sentence']++;
            }
        } elseif (
            preg_match('/^Organizations typically see positive ROI within 6-12 months(?: of implementation)?\. Key returns include cost savings \(20-35%\), productivity improvements \(30-50%\), and customer satisfaction increases \(15-25%\)\./i', $text)
            || preg_match('/^Artificial intelligence and machine learning have moved from experimental to mainstream,.+organizations implementing AI report 30-50% improvement in operational efficiency\.$/i', $text)
            || preg_match('/^Budget for total cost of ownership including implementation, training, and change management \(30-50% on top of subscription\)\.$/i', $text)
            || preg_match('/^Implementation planning should begin before you sign the contract\..+underestimate the time required for full adoption by 30-50%/i', $text)
            || preg_match('/^Implementation challenges remain,.+Organizations that address these challenges see 30-50% improvement in operational efficiency\.$/i', $text)
            || preg_match('/^(?:Productivity: 30-50% higher with modern tools|30-50% efficiency improvement potential)$/i', $text)
            || preg_match('/^At its core, .+ Organizations that effectively implement .+ solutions typically see 25-40% improvement in operational efficiency, 20-35% reduction in costs, and 15-25% increase in customer satisfaction\b/i', $text)
            || preg_match('/^Organizations implementing .+ report measurable improvements across multiple dimensions\. The most significant benefit is cost reduction, with companies typically saving 20-35% on operational expenses\b/i', $text)
        ) {
            remove_node($p);
            $local['residual']++;
        }
    }

    foreach (iterator_to_array($xpath->query('//li')) as $li) {
        $text = normalized_text($li);
        if (
            preg_match('/^.+ delivers 30-50% efficiency improvement$/i', $text)
            || preg_match('/^20-35% cost reduction typical with proper implementation$/i', $text)
            || preg_match('/^(?:20-35% cost reduction through automation|30-50% productivity improvement)$/i', $text)
            || preg_match('/^AI\/ML: 30-50% efficiency improvement$/i', $text)
            || preg_match('/^(?:Productivity: 30-50% higher with modern tools|30-50% efficiency improvement potential)$/i', $text)
        ) {
            remove_node($li);
            $local['residual']++;
        }
    }

    if ($post_id === 2880) {
        foreach (iterator_to_array($xpath->query('//h2')) as $h2) {
            if (normalized_text($h2) !== 'Real-World Example') {
                continue;
            }
            $next = $h2->nextSibling;
            while ($next && $next->nodeType === XML_TEXT_NODE && trim($next->textContent) === '') {
                $next = $next->nextSibling;
            }
            if ($next instanceof DOMElement && strtolower($next->tagName) === 'p' && str_contains(normalized_text($next), 'A professional services firm implements VoIP Phone System')) {
                remove_node($next);
                remove_node($h2);
                $local['case']++;
            }
        }
    }

    $changed = array_sum($local) > 0;
    if (!$changed) {
        continue;
    }

    foreach (iterator_to_array($xpath->query('//ul[not(li)] | //ol[not(li)]')) as $empty_list) {
        remove_node($empty_list);
    }

    $root = $dom->getElementById('remediation-root');
    $updated = '';
    foreach (iterator_to_array($root->childNodes) as $child) {
        $updated .= $dom->saveHTML($child);
    }

    $words = word_count_html($updated);
    $empty_headings = $xpath->query('//h2[not(normalize-space())]')->length;
    if ($words < 800 || $empty_headings > 0) {
        $errors[] = "$post_id: refused (words=$words empty_h2=$empty_headings)";
        continue;
    }

    $stats['changed']++;
    foreach ($local as $key => $count) {
        $stats[$key] += $count;
    }
    echo implode("\t", [$post_id, get_post_field('post_name', $post_id), word_count_html($original), $words, json_encode($local)]) . "\n";

    if ($apply) {
        $result = wp_update_post(['ID' => $post_id, 'post_content' => $updated], true);
        if (is_wp_error($result)) {
            $errors[] = "$post_id: " . $result->get_error_message();
        }
    }
}

fwrite(STDERR, 'SUMMARY ' . json_encode($stats) . "\n");
if ($errors) {
    fwrite(STDERR, "ERRORS\n" . implode("\n", $errors) . "\n");
    exit(1);
}
