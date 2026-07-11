<?php
/**
 * Dry-run-first WordPress excerpt updater and rollback tool.
 *
 * Usage from a WordPress host:
 * php meta-remediation-apply.php --manifest=/path/manifest.json --wp-root=/path/to/wp
 * php meta-remediation-apply.php --manifest=/path/manifest.json --wp-root=/path/to/wp --apply --confirm-run=RUN_ID --batch-size=25 --offset=0
 * php meta-remediation-apply.php --manifest=/path/manifest.json --wp-root=/path/to/wp --rollback --confirm-run=RUN_ID --batch-size=25 --offset=0
 */

$options = getopt('', ['manifest:', 'wp-root:', 'apply', 'rollback', 'confirm-run:', 'batch-size::', 'offset::']);
$manifestPath = $options['manifest'] ?? '';
$wpRoot = rtrim($options['wp-root'] ?? '', '/\\');
$isApply = array_key_exists('apply', $options);
$isRollback = array_key_exists('rollback', $options);
$batchSize = max(1, min(100, (int)($options['batch-size'] ?? 25)));
$offset = max(0, (int)($options['offset'] ?? 0));

if (!$manifestPath || !$wpRoot || !is_file($manifestPath) || !is_file($wpRoot . '/wp-load.php')) {
    fwrite(STDERR, "Valid --manifest and --wp-root are required.\n");
    exit(2);
}
if ($isApply && $isRollback) {
    fwrite(STDERR, "Choose either --apply or --rollback.\n");
    exit(2);
}

$manifest = json_decode(file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
$runId = (string)($manifest['runId'] ?? '');
if (($isApply || $isRollback) && (($options['confirm-run'] ?? '') !== $runId)) {
    fwrite(STDERR, "Writing requires --confirm-run={$runId}.\n");
    exit(2);
}

require_once $wpRoot . '/wp-load.php';
$ready = array_values(array_filter($manifest['records'] ?? [], static fn($record) => ($record['status'] ?? '') === 'ready'));
$batch = array_slice($ready, $offset, $batchSize);
$results = [];
$failed = false;

foreach ($batch as $record) {
    $postId = (int)$record['databaseId'];
    $post = get_post($postId);
    if (!$post || $post->post_status !== 'publish') {
        $results[] = ['databaseId' => $postId, 'status' => 'skipped', 'reason' => 'missing_or_not_published'];
        $failed = true;
        continue;
    }

    $currentExcerpt = (string)$post->post_excerpt;
    $currentHash = hash('sha256', $currentExcerpt);
    $currentModifiedGmt = (string)$post->post_modified_gmt;
    $expectedHash = $isRollback ? (string)$record['candidateHash'] : (string)$record['oldExcerptHash'];
    $expectedModified = (string)($record['modifiedGmt'] ?? '');

    if (!hash_equals($expectedHash, $currentHash)) {
        $results[] = ['databaseId' => $postId, 'status' => 'conflict', 'reason' => 'excerpt_hash_drift'];
        $failed = true;
        continue;
    }
    $expectedModifiedSql = $expectedModified === '' ? '' : gmdate('Y-m-d H:i:s', strtotime($expectedModified));
    if (!$isRollback && $expectedModifiedSql !== '' && $currentModifiedGmt !== $expectedModifiedSql) {
        $results[] = ['databaseId' => $postId, 'status' => 'conflict', 'reason' => 'modified_gmt_drift'];
        $failed = true;
        continue;
    }

    $target = $isRollback ? (string)$record['oldExcerptRaw'] : (string)$record['candidate'];
    $mode = $isRollback ? 'rollback' : ($isApply ? 'apply' : 'dry_run');
    if ($isApply || $isRollback) {
        $result = wp_update_post(['ID' => $postId, 'post_excerpt' => $target], true);
        if (is_wp_error($result)) {
            $results[] = ['databaseId' => $postId, 'status' => 'error', 'reason' => $result->get_error_message()];
            $failed = true;
            continue;
        }
        clean_post_cache($postId);
        $writtenPost = get_post($postId);
        if (!$writtenPost || !hash_equals(hash('sha256', $target), hash('sha256', (string)$writtenPost->post_excerpt))) {
            $results[] = ['databaseId' => $postId, 'status' => 'error', 'reason' => 'post_write_verification_failed'];
            $failed = true;
            continue;
        }
    }
    $results[] = ['databaseId' => $postId, 'slug' => $record['slug'], 'status' => $mode, 'fromHash' => $currentHash, 'toHash' => hash('sha256', $target)];
}

echo json_encode(['runId' => $runId, 'mode' => $isRollback ? 'rollback' : ($isApply ? 'apply' : 'dry_run'), 'offset' => $offset, 'batchSize' => $batchSize, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
exit($failed ? 1 : 0);
