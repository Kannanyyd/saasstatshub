<?php
/**
 * Guarded evidence rewrite for post 592.
 *
 * Dry run: wp --allow-root eval-file seo-salary-evidence-update-2026-08.php
 * Apply:   wp --allow-root eval-file seo-salary-evidence-update-2026-08.php apply
 */

if (!defined('ABSPATH')) {
    fwrite(STDERR, "Load WordPress before running this file.\n");
    exit(1);
}

if (!function_exists('get_field') || !function_exists('update_field')) {
    fwrite(STDERR, "ACF is required for this update.\n");
    exit(1);
}

$post_id = 592;
$slug = 'saas-sales-rep-salary';
$marker = 'There is no official government wage series specifically for SaaS sales representatives.';
$old_marker = 'A comprehensive guide to SaaS sales representative compensation in 2026';

$content = <<<'HTML'
<p>There is no official government wage series specifically for SaaS sales representatives. The most useful answer therefore combines role-level compensation data with broader federal wage context, while keeping their scopes separate. This guide uses RepVue's reported sales-role medians, the U.S. Bureau of Labor Statistics Occupational Employment and Wage Statistics survey, and Salesforce's definition of on-target earnings. It does not treat OTE as guaranteed pay.</p>

<h2>SaaS Sales Pay at a Glance</h2>
<p>Sales compensation is usually discussed as base salary plus variable compensation. Salesforce defines on-target earnings, or OTE, as the projected annual compensation when a seller meets the requirements and target metrics for the role. OTE combines guaranteed base salary with non-guaranteed commission. Actual earnings can be lower or higher, depending on the compensation plan and performance.</p>
<table class="comparison-table"><thead><tr><th>Reference role or occupation</th><th>Base or annual mean wage</th><th>OTE</th><th>Scope</th></tr></thead><tbody>
<tr><td>Sales development representative</td><td>$60,000 median base</td><td>$85,000 median OTE</td><td>RepVue role comparison; reported platform data</td></tr>
<tr><td>Account executive</td><td>$100,000 median base</td><td>$190,000 median OTE</td><td>RepVue role comparison; reported platform data</td></tr>
<tr><td>Mid-market account executive</td><td>$90,000 median base</td><td>$175,000 median OTE</td><td>RepVue role page, updated November 16, 2025</td></tr>
<tr><td>Sales representatives, services</td><td>$87,040 annual mean wage</td><td>Not reported</td><td>BLS May 2025 estimate; broad occupation, not SaaS-specific</td></tr>
<tr><td>Technical and scientific wholesale/manufacturing sales representatives</td><td>$119,730 annual mean wage</td><td>Not reported</td><td>BLS May 2025 estimate; broad occupation, not SaaS-specific</td></tr>
</tbody></table>
<p>The rows are not interchangeable. RepVue reports role-level base and OTE figures drawn from its platform. BLS reports employer-survey wage estimates for Standard Occupational Classification groups. The BLS groups include many industries and are presented only as a broad labor-market cross-check.</p>

<h2>What the Role Data Shows</h2>
<p>RepVue's role comparison lists a median base of $60,000 and median OTE of $85,000 for sales development representatives. For account executives, the same comparison lists a $100,000 median base and $190,000 median OTE. Its dedicated mid-market account executive page lists a $90,000 median base and $175,000 median OTE, with the page dated November 16, 2025.</p>
<p>These figures illustrate how compensation changes with role scope. An SDR typically works on prospecting, qualification, and pipeline creation. An account executive generally carries responsibility for progressing and closing opportunities. A mid-market designation describes a customer segment, but each employer defines that segment differently. Company size, territory, product complexity, and quota design can change the economics of otherwise similar job titles.</p>
<p>RepVue also publishes quota-attainment information, but it should not be confused with salary. Its mid-market account executive page reported 40.5% current quota attainment when the page was updated. That platform metric is a useful warning against treating OTE as expected cash compensation for every seller. It reflects RepVue's underlying ratings and methodology rather than a census of all SaaS salespeople.</p>

<h2>How to Read Base Salary, Variable Pay, and OTE</h2>
<p><strong>Base salary</strong> is the guaranteed portion of the compensation package, subject to the employment agreement. <strong>Variable compensation</strong> is tied to defined results, such as qualified opportunities, bookings, revenue, or another performance measure. <strong>OTE</strong> is base salary plus the variable amount available at target performance.</p>
<p>An offer with a larger OTE is not automatically the better offer. A candidate should compare the base salary, quota, territory, ramp rules, payout timing, crediting rules, caps, clawbacks, and the percentage of comparable team members who reached target. The written plan matters more than a headline OTE because two plans with the same OTE can create very different probabilities of earning it.</p>
<p>Ask whether quota and territory are already assigned, how new hires are paid during ramp, what happens when accounts move, and which events trigger commission credit. Also ask for attainment information for the same role and segment, not only the entire sales organization. These questions do not guarantee future earnings, but they make the offer easier to evaluate.</p>

<h2>Why Two Similar Titles Can Pay Differently</h2>
<p>Job titles are not standardized across SaaS companies. One account executive may handle short, inbound transactions, while another manages a smaller number of complex opportunities with several stakeholders. The second role may carry a different quota, sales cycle, support model, and variable-pay design even when both listings use the same title. Compensation comparisons are more useful when the customer segment, average contract scope, territory, and responsibilities are similar.</p>
<p>Location and company stage can also affect an offer, but this review found no sufficiently consistent public source for a universal city premium, remote-work discount, or startup equity percentage. Candidates should request the employer's actual location policy and equity documents instead of applying a generic adjustment. When equity is offered, evaluate the number and type of awards, vesting terms, exercise rules, dilution, and the absence of guaranteed liquidity separately from cash compensation.</p>

<h2>Federal Wage Data as a Cross-Check</h2>
<p>The BLS May 2025 Occupational Employment and Wage Statistics release reported an annual mean wage of $87,040 for the broad category “sales representatives, services.” It reported $119,730 for sales representatives of technical and scientific products in wholesale and manufacturing. Neither category maps neatly to SaaS sales, and neither reports OTE.</p>
<p>BLS explains that OEWS is an employer survey covering wage and salary workers in nonfarm establishments. Its wage definition includes commissions and production bonuses, while excluding items such as overtime, severance pay, and nonproduction bonuses. The May 2025 estimates combine six semiannual panels collected over three years. That methodology makes BLS useful for broad occupational context, but not for estimating a specific SaaS company's compensation plan.</p>
<p>For that reason, this page does not calculate a “national SaaS sales salary” by averaging BLS and RepVue figures. They measure different populations and compensation concepts. Readers should use role data to form a shortlist and then validate the exact employer, location, segment, and plan.</p>

<h2>How to Evaluate a SaaS Sales Offer</h2>
<ol>
<li><strong>Separate guaranteed and variable pay.</strong> Record the base salary, target incentive, and stated OTE as different values.</li>
<li><strong>Identify the performance unit.</strong> Confirm whether payout depends on meetings, accepted opportunities, bookings, revenue, collections, or another measure.</li>
<li><strong>Review quota and territory together.</strong> A quota is meaningful only with information about account ownership, market segment, sales cycle, and available pipeline.</li>
<li><strong>Read the commission plan.</strong> Check ramp treatment, thresholds, accelerators, caps, clawbacks, split credit, and payment timing in the actual document.</li>
<li><strong>Compare like with like.</strong> Benchmark SDR against SDR and mid-market AE against mid-market AE. Do not compare a broad “sales rep” label with a specialized enterprise role.</li>
<li><strong>Ask for attainment context.</strong> Request the share of comparable reps who reached target and the time period used. Treat verbal figures as context until documented.</li>
</ol>

<h2>Methodology and Limitations</h2>
<p>This page was reviewed on August 8, 2026. RepVue figures are reported platform medians and may change as ratings are added or revised. The RepVue role-comparison figures were visible on its salary pages, while the mid-market account executive page supplied a dated role-specific reference. RepVue is not a government survey, and its users may not represent every employer or geography.</p>
<p>BLS figures are May 2025 employer-survey estimates published in May 2026. They cover broad occupations rather than SaaS-specific jobs. Salesforce is used only to define OTE and explain why it is not guaranteed. This article deliberately excludes unsupported claims about equity percentages, city premiums, international pay ratios, remote-work discounts, sales-cycle length, and universal commission splits.</p>

<h2>Frequently Asked Questions</h2>
<h3>How much does a SaaS sales representative make?</h3>
<p>There is no single official SaaS sales salary. In RepVue's role comparison, the median base and OTE were $60,000 and $85,000 for SDRs, and $100,000 and $190,000 for account executives. Those platform medians are directional benchmarks, not guaranteed offers.</p>
<h3>Is OTE the same as salary?</h3>
<p>No. Base salary is the guaranteed component, while OTE combines base salary with non-guaranteed variable compensation at target performance. Actual earnings depend on the compensation plan and results.</p>
<h3>Which number should candidates compare?</h3>
<p>Compare base salary, target variable pay, quota, territory, ramp terms, crediting rules, and attainment for the same role and segment. A higher OTE is less informative when the underlying quota or payout rules are unclear.</p>

<h2>Related Research</h2>
<p>Continue with our <a href="/crm/saas-sales-statistics-2026/">SaaS sales statistics</a>, <a href="/crm/sales-automation-statistics-2026/">sales automation statistics</a>, and <a href="/crm/crm-software-statistics-2026/">CRM software statistics</a>.</p>
HTML;

$quick_overview = [
    ['stat_label' => 'SDR median base', 'stat_value' => '$60,000 (RepVue)'],
    ['stat_label' => 'SDR median OTE', 'stat_value' => '$85,000 (RepVue)'],
    ['stat_label' => 'Account executive median base', 'stat_value' => '$100,000 (RepVue)'],
    ['stat_label' => 'Account executive median OTE', 'stat_value' => '$190,000 (RepVue)'],
    ['stat_label' => 'Mid-market AE median OTE', 'stat_value' => '$175,000 (RepVue)'],
    ['stat_label' => 'BLS services-sales annual mean', 'stat_value' => '$87,040 (broad occupation)'],
];

$key_takeaways = [
    ['takeaway_text' => 'No official government wage series isolates SaaS sales representatives.'],
    ['takeaway_text' => 'OTE combines guaranteed base salary with non-guaranteed variable compensation at target performance.'],
    ['takeaway_text' => 'RepVue role medians are directional platform benchmarks rather than guaranteed offers.'],
    ['takeaway_text' => 'BLS wage estimates provide broad occupational context but are not SaaS-specific.'],
    ['takeaway_text' => 'Candidates should compare quota, territory, ramp, payout rules, and attainment alongside headline OTE.'],
];

$sources = [
    ['name' => 'RepVue', 'title' => 'Sales Role Salary Comparison', 'date' => 'Accessed August 8, 2026', 'url' => 'https://www.repvue.com/salaries/sled-account-executive/'],
    ['name' => 'RepVue', 'title' => 'Mid Market Account Executive Salary', 'date' => 'Updated November 16, 2025', 'url' => 'https://www.repvue.com/salaries/mid-market-account-executive/'],
    ['name' => 'Salesforce', 'title' => 'What Are On-Target Earnings (OTE) in Sales?', 'date' => 'October 3, 2024', 'url' => 'https://www.salesforce.com/blog/sales/what-is-ote-sales/'],
    ['name' => 'U.S. Bureau of Labor Statistics', 'title' => 'Occupational Employment and Wages - May 2025', 'date' => 'May 15, 2026', 'url' => 'https://www.bls.gov/news.release/ocwage.htm'],
];

$post = get_post($post_id);
$failures = [];
if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
    $failures[] = 'Post 592 is missing or not published.';
} elseif ($post->post_name !== $slug) {
    $failures[] = 'Post 592 slug mismatch.';
} elseif (strpos($post->post_content, $old_marker) === false && strpos($post->post_content, $marker) === false) {
    $failures[] = 'Post 592 content guard mismatch.';
}

if ($failures) {
    foreach ($failures as $failure) {
        fwrite(STDERR, $failure . "\n");
    }
    exit(1);
}

$apply = in_array('apply', $args ?? [], true);
if (!$apply) {
    echo "READY 592 {$slug}\nDry run passed.\n";
    exit(0);
}

$result = wp_update_post(wp_slash(['ID' => $post_id, 'post_content' => $content]), true);
if (is_wp_error($result)) {
    throw new RuntimeException($result->get_error_message());
}

foreach (['quick_overview_items' => $quick_overview, 'key_takeaways' => $key_takeaways, 'sources' => $sources] as $field => $value) {
    update_field($field, $value, $post_id);
    $stored = get_field($field, $post_id, false);
    if (!is_array($stored) || count($stored) !== count($value)) {
        throw new RuntimeException("Failed to update {$field}.");
    }
}

echo "UPDATED 592 {$slug}\n";
