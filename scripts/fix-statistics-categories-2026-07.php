<?php
/**
 * Correct two statistics posts whose WordPress categories drifted during import.
 *
 * Usage: wp eval-file scripts/fix-statistics-categories-2026-07.php [apply]
 */

$apply = in_array('apply', $args ?? [], true);
$changes = [
    489 => ['expected_category' => 5, 'expected_primary' => 5, 'new_category' => 17],
    496 => ['expected_category' => 3, 'expected_primary' => 3, 'new_category' => 5],
];

foreach ($changes as $post_id => $change) {
    $categories = wp_get_post_categories($post_id);
    $primary = (int) get_post_meta($post_id, 'primary_category', true);

    if ($categories !== [$change['expected_category']] || $primary !== $change['expected_primary']) {
        fwrite(STDERR, sprintf(
            "Post %d drifted: categories=%s primary=%d\n",
            $post_id,
            json_encode($categories),
            $primary
        ));
        exit(1);
    }

    printf(
        "%s post %d: category %d -> %d; primary %d -> %d\n",
        $apply ? 'Applying' : 'Would apply',
        $post_id,
        $change['expected_category'],
        $change['new_category'],
        $change['expected_primary'],
        $change['new_category']
    );

    if (!$apply) {
        continue;
    }

    $result = wp_set_post_categories($post_id, [$change['new_category']], false);
    if (is_wp_error($result)) {
        fwrite(STDERR, $result->get_error_message() . "\n");
        exit(1);
    }

    if (function_exists('update_field')) {
        update_field('primary_category', $change['new_category'], $post_id);
    } else {
        update_post_meta($post_id, 'primary_category', $change['new_category']);
    }
}
