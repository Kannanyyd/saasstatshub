<?php
/**
 * Read-only contextual content risk audit for published WordPress posts.
 *
 * Usage: wp eval-file contextual-content-audit-generator-2026-07.php
 * Output: one JSON object per line, followed by a __summary record.
 */

$query = new WP_Query([
    'post_type' => 'post',
    'post_status' => 'publish',
    'posts_per_page' => -1,
    'fields' => 'ids',
    'orderby' => 'ID',
    'order' => 'ASC',
]);

$records = [];
$counts = [
    'published_posts' => count($query->posts),
    'contextual_range_posts' => 0,
    'contextual_whether_posts' => 0,
    'post_971_records' => 0,
    'key_data_title_posts' => 0,
    'atomic_template_a_posts' => 0,
    'atomic_template_bc_posts' => 0,
    'atomic_whether_paragraph_posts' => 0,
    'atomic_whether_sentence_posts' => 0,
    'atomic_residual_roi_posts' => 0,
    'atomic_residual_ai_posts' => 0,
    'atomic_residual_tco_posts' => 0,
    'atomic_residual_small_posts' => 0,
];

function audit_text(DOMNode $node): string {
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode($node->textContent, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}

function audit_excerpt(string $text, int $limit = 360): string {
    $text = trim(preg_replace('/\s+/u', ' ', $text));
    if (mb_strlen($text) <= $limit) {
        return $text;
    }
    return rtrim(mb_substr($text, 0, $limit - 3)) . '...';
}

function audit_heading(DOMNode $node): string {
    for ($current = $node->previousSibling; $current; $current = $current->previousSibling) {
        if ($current instanceof DOMElement && preg_match('/^h[2-4]$/i', $current->tagName)) {
            return audit_text($current);
        }
    }
    return '';
}

function audit_source_state(int $post_id, string $content): array {
    $acf_urls = [];
    if (function_exists('get_field')) {
        $rows = get_field('sources', $post_id);
        if (is_array($rows)) {
            foreach ($rows as $row) {
                $url = trim((string) ($row['url'] ?? ''));
                if ($url !== '') {
                    $acf_urls[$url] = true;
                }
            }
        }
    }
    preg_match_all('/<a\b[^>]*href=["\'](https?:\/\/[^"\']+)/i', $content, $matches);
    $body_urls = array_fill_keys(array_map('html_entity_decode', $matches[1] ?? []), true);
    return [
        'acf_url_count' => count($acf_urls),
        'body_url_count' => count($body_urls),
        'has_any_url' => count($acf_urls) + count($body_urls) > 0,
    ];
}

function audit_add(array &$records, array $base, string $kind, string $key_suffix, DOMNode $node = null, array $extra = []): void {
    $text = $node ? audit_text($node) : ($extra['snippet'] ?? '');
    $record = array_merge($base, [
        'claim_key' => $base['post_id'] . ':' . $kind . ':' . $key_suffix,
        'kind' => $kind,
        'heading' => $node ? audit_heading($node) : '',
        'snippet' => audit_excerpt($text),
    ], $extra);
    if (isset($records[$record['claim_key']])) {
        fwrite(STDERR, "Duplicate claim key: {$record['claim_key']}\n");
        exit(1);
    }
    $records[$record['claim_key']] = $record;
}

foreach ($query->posts as $post_id) {
    $content = (string) get_post_field('post_content', $post_id);
    $title = (string) get_the_title($post_id);
    $slug = (string) get_post_field('post_name', $post_id);
    $source = audit_source_state($post_id, $content);
    $base = array_merge([
        'post_id' => (int) $post_id,
        'slug' => $slug,
        'title' => html_entity_decode($title, ENT_QUOTES | ENT_HTML5, 'UTF-8'),
    ], $source);

    libxml_use_internal_errors(true);
    $dom = new DOMDocument('1.0', 'UTF-8');
    $loaded = $dom->loadHTML('<?xml encoding="utf-8" ?><div id="audit-root">' . $content . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    if (!$loaded) {
        fwrite(STDERR, "Invalid HTML for post {$post_id}\n");
        exit(1);
    }
    $xpath = new DOMXPath($dom);
    $range_contextual = false;
    $whether_contextual = false;
    $atomic_a = false;
    $atomic_bc = false;
    $atomic_wp = false;
    $atomic_ws = false;
    $atomic_roi = false;
    $atomic_ai = false;
    $atomic_tco = false;
    $atomic_small = false;

    foreach (iterator_to_array($xpath->query('//p | //li | //td | //th')) as $index => $node) {
        $text = audit_text($node);
        if ($text === '') {
            continue;
        }

        if (preg_match('/^Industry research indicates that organizations investing strategically in .+ see 30-50% improvement in operational efficiency and 20-35% reduction in costs\. The key to achieving these results lies in understanding the fundamentals and following proven implementation methodologies\.$/i', $text)) {
            $atomic_a = true;
            audit_add($records, $base, 'atomic_range_template_a', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Verified repeated unsupported paragraph; remove with its two companion bullets as one atomic operation.',
                'atomic_group' => 'range-template-a',
            ]);
            continue;
        }
        if (preg_match('/^.+ delivers 30-50% efficiency improvement$/i', $text) || preg_match('/^20-35% cost reduction typical with proper implementation$/i', $text)) {
            audit_add($records, $base, 'atomic_range_template_a_bullet', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Companion bullet for verified repeated unsupported paragraph.',
                'atomic_group' => 'range-template-a',
            ]);
            continue;
        }
        if (preg_match('/^Productivity gains are equally impressive, with teams reporting 30-50% time savings on routine tasks\b/i', $text)) {
            $atomic_bc = true;
            audit_add($records, $base, 'atomic_range_template_b', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Verified repeated unsupported productivity paragraph; remove with template C in the same transaction.',
                'atomic_group' => 'range-template-bc',
            ]);
            continue;
        }
        if (preg_match('/^Organizations that effectively implement .+ solutions typically see 25-40% improvement in operational efficiency, 20-35% reduction in costs, and 15-25% increase in customer satisfaction\b/i', $text)) {
            $atomic_bc = true;
            audit_add($records, $base, 'atomic_range_template_c', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Verified repeated unsupported outcome paragraph; remove with template B in the same transaction.',
                'atomic_group' => 'range-template-bc',
            ]);
            continue;
        }

        if (preg_match('/^Organizations typically see positive ROI within 6-12 months(?: of implementation)?\. Key returns include cost savings \(20-35%\), productivity improvements \(30-50%\), and customer satisfaction increases \(15-25%\)\./i', $text)) {
            $atomic_roi = true;
            audit_add($records, $base, 'atomic_residual_roi', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Repeated unsupported ROI, payback, cost, productivity and satisfaction claim.',
                'atomic_group' => 'residual-roi',
            ]);
            continue;
        }
        if (preg_match('/^(?:20-35% cost reduction through automation|30-50% productivity improvement)$/i', $text)) {
            $atomic_roi = true;
            audit_add($records, $base, 'atomic_residual_roi_bullet', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Companion bullet for the repeated unsupported ROI block.',
                'atomic_group' => 'residual-roi',
            ]);
            continue;
        }
        if (preg_match('/^Artificial intelligence and machine learning have moved from experimental to mainstream,.+organizations implementing AI report 30-50% improvement in operational efficiency\.$/i', $text)) {
            $atomic_ai = true;
            audit_add($records, $base, 'atomic_residual_ai', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Repeated unsupported AI efficiency claim.',
                'atomic_group' => 'residual-ai',
            ]);
            continue;
        }
        if (preg_match('/^AI\/ML: 30-50% efficiency improvement$/i', $text)) {
            $atomic_ai = true;
            audit_add($records, $base, 'atomic_residual_ai_bullet', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Companion bullet for the repeated unsupported AI efficiency block.',
                'atomic_group' => 'residual-ai',
            ]);
            continue;
        }
        if (preg_match('/^Budget for total cost of ownership including implementation, training, and change management \(30-50% on top of subscription\)\.$/i', $text)
            || preg_match('/^Implementation planning should begin before you sign the contract\..+underestimate the time required for full adoption by 30-50%/i', $text)) {
            $atomic_tco = true;
            audit_add($records, $base, 'atomic_residual_tco', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Repeated unsupported TCO or implementation-delay range; remove both claims in the article transaction.',
                'atomic_group' => 'residual-tco',
            ]);
            continue;
        }
        if (preg_match('/^Implementation challenges remain,.+Organizations that address these challenges see 30-50% improvement in operational efficiency\.$/i', $text)
            || preg_match('/^(?:Productivity: 30-50% higher with modern tools|30-50% efficiency improvement potential)$/i', $text)) {
            $atomic_small = true;
            audit_add($records, $base, 'atomic_residual_small', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Repeated unsupported efficiency block and companion bullet.',
                'atomic_group' => 'residual-small',
            ]);
            continue;
        }
        if (preg_match('/^At its core, .+ Organizations that effectively implement .+ solutions typically see 25-40% improvement in operational efficiency, 20-35% reduction in costs, and 15-25% increase in customer satisfaction\b/i', $text)
            || preg_match('/^Organizations implementing .+ report measurable improvements across multiple dimensions\. The most significant benefit is cost reduction, with companies typically saving 20-35% on operational expenses\b/i', $text)) {
            $atomic_roi = true;
            audit_add($records, $base, 'atomic_residual_outcome', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Topic-interpolated unsupported outcome template.',
                'atomic_group' => 'residual-outcome',
            ]);
            continue;
        }

        if (preg_match('/30-50%|20-35%/i', $text)) {
            $range_contextual = true;
            $recommendation = $source['has_any_url'] ? 'RESEARCH' : 'REWRITE';
            audit_add($records, $base, 'contextual_range', (string) $index, $node, [
                'recommendation' => $recommendation,
                'reason' => $source['has_any_url']
                    ? 'A page-level link exists, but direct claim support is unproven; verify exact scope, date and denominator.'
                    : 'No clickable source exists on the page; remove the number or rewrite as a defensible qualitative statement.',
                'atomic_group' => '',
            ]);
        }

        if (preg_match('/^Whether you are doing this for the first time or optimizing an existing process\b/i', $text)) {
            $atomic_wp = true;
            audit_add($records, $base, 'atomic_whether_paragraph', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Verified repeated standalone filler paragraph.',
                'atomic_group' => 'whether-paragraph',
            ]);
            continue;
        }
        if (str_contains($text, 'Whether you are evaluating solutions for the first time or optimizing an existing technology stack')) {
            $atomic_ws = true;
            audit_add($records, $base, 'atomic_whether_sentence', (string) $index, $node, [
                'recommendation' => 'REMOVE',
                'reason' => 'Remove only the verified repeated closing sentence and preserve the informative paragraph prefix.',
                'atomic_group' => 'whether-sentence',
            ]);
            continue;
        }
        if (stripos($text, 'Whether you are') !== false) {
            $whether_contextual = true;
            $filler = preg_match('/(this guide|this article|provides? (?:the )?(?:insights|information)|ultimate reference|comprehensive guide)/i', $text);
            audit_add($records, $base, 'contextual_whether', (string) $index, $node, [
                'recommendation' => $filler ? 'REWRITE' : 'KEEP',
                'reason' => $filler
                    ? 'The phrase mainly promises generic guidance; replace it with a topic-specific scope statement.'
                    : 'The phrase appears to distinguish audiences or decision contexts; retain unless adjacent copy duplicates it.',
                'atomic_group' => '',
            ]);
        }
    }

    if ($range_contextual) {
        $counts['contextual_range_posts']++;
    }
    if ($whether_contextual) {
        $counts['contextual_whether_posts']++;
    }
    if ($atomic_a) {
        $counts['atomic_template_a_posts']++;
    }
    if ($atomic_bc) {
        $counts['atomic_template_bc_posts']++;
    }
    if ($atomic_wp) {
        $counts['atomic_whether_paragraph_posts']++;
    }
    if ($atomic_ws) {
        $counts['atomic_whether_sentence_posts']++;
    }
    if ($atomic_roi) {
        $counts['atomic_residual_roi_posts']++;
    }
    if ($atomic_ai) {
        $counts['atomic_residual_ai_posts']++;
    }
    if ($atomic_tco) {
        $counts['atomic_residual_tco_posts']++;
    }
    if ($atomic_small) {
        $counts['atomic_residual_small_posts']++;
    }

    if (preg_match('/\b(?:50|55|60)\+\s+Key Data Points\b/i', $title)) {
        $counts['key_data_title_posts']++;
        audit_add($records, $base, 'key_data_title', 'title', null, [
            'snippet' => $title,
            'recommendation' => 'REWRITE',
            'reason' => 'Replace the unsupported count promise with a topic-specific title after the article claim audit.',
            'atomic_group' => '',
        ]);
    }

    if ((int) $post_id === 971) {
        $counts['post_971_records']++;
        audit_add($records, $base, 'post_971_manual_review', 'article', null, [
            'snippet' => audit_excerpt(wp_strip_all_tags($content)),
            'recommendation' => 'RESEARCH',
            'reason' => 'Industry adoption-rate statements require direct source verification; this is not an anonymous fabricated case.',
            'atomic_group' => '',
        ]);
    }
}

foreach ($records as $record) {
    echo wp_json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
}

$counts['record_count'] = count($records);
$counts['unique_claim_keys'] = count(array_unique(array_keys($records)));
$counts['duplicate_claim_keys'] = $counts['record_count'] - $counts['unique_claim_keys'];
echo wp_json_encode(['__summary' => $counts], JSON_UNESCAPED_SLASHES) . "\n";

if ($counts['duplicate_claim_keys'] !== 0) {
    exit(1);
}
