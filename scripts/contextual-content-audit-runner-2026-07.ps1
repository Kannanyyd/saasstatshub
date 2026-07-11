param(
    [string]$Server = 'root@43.134.46.238',
    [string]$KeyPath = 'D:\Agent\WEB\Kiro.pem',
    [string]$WpRoot = '/www/wwwroot/saasstatshub'
)

$ErrorActionPreference = 'Stop'
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$generator = Join-Path $scriptDir 'contextual-content-audit-generator-2026-07.php'
$jsonl = Join-Path $scriptDir 'contextual-content-audit-records-2026-07.jsonl'
$report = Join-Path $scriptDir 'contextual-content-audit-report-2026-07.md'
$remote = '/tmp/contextual-content-audit-generator-2026-07.php'

if (-not (Test-Path -LiteralPath $generator)) {
    throw "Generator not found: $generator"
}

& scp -q -i $KeyPath -- $generator "${Server}:$remote"
if ($LASTEXITCODE -ne 0) { throw 'scp failed' }

$lint = & ssh -i $KeyPath -- $Server "php -l '$remote'"
if ($LASTEXITCODE -ne 0) { throw "remote PHP lint failed: $lint" }

$lines = & ssh -i $KeyPath -- $Server "cd '$WpRoot' && wp --allow-root eval-file '$remote'"
if ($LASTEXITCODE -ne 0) { throw 'remote read-only audit failed' }
$lines | Set-Content -LiteralPath $jsonl -Encoding utf8

$objects = @($lines | ForEach-Object { $_ | ConvertFrom-Json })
$summaryRow = $objects | Where-Object { $_.__summary } | Select-Object -Last 1
$records = @($objects | Where-Object { -not $_.__summary })
if (-not $summaryRow) { throw 'summary record missing' }
$summary = $summaryRow.__summary

$keys = @($records.claim_key)
if (($keys | Sort-Object -Unique).Count -ne $keys.Count) {
    throw 'duplicate claim keys detected'
}
if ([int]$summary.record_count -ne $records.Count -or [int]$summary.unique_claim_keys -ne $records.Count) {
    throw "summary mismatch: records=$($records.Count), summary=$($summary.record_count), unique=$($summary.unique_claim_keys)"
}

$allowedRecommendations = @('KEEP', 'QUALIFY', 'REMOVE', 'REWRITE', 'RESEARCH')
$invalid = @($records | Where-Object {
    -not $_.claim_key -or -not $_.post_id -or -not $_.slug -or -not $_.title -or
    -not $_.kind -or -not $_.snippet -or -not $_.recommendation -or
    $allowedRecommendations -notcontains $_.recommendation -or
    $null -eq $_.acf_url_count -or $null -eq $_.body_url_count
})
if ($invalid.Count -ne 0) {
    throw "$($invalid.Count) records failed required-field or recommendation validation"
}

$expected = @{
    key_data_title_posts = 41
    post_971_records = 1
}
foreach ($entry in $expected.GetEnumerator()) {
    if ([int]$summary.($entry.Key) -ne $entry.Value) {
        throw "count mismatch for $($entry.Key): expected $($entry.Value), got $($summary.($entry.Key))"
    }
}
if ([int]$summary.contextual_range_posts -le 0 -or [int]$summary.contextual_whether_posts -le 0) {
    throw 'contextual queues are unexpectedly empty'
}

$byKind = $records | Group-Object kind | Sort-Object Name
$byRecommendation = $records | Group-Object recommendation | Sort-Object Name
$atomic = @($records | Where-Object { $_.atomic_group })
$contextual = @($records | Where-Object { -not $_.atomic_group })

$md = [System.Collections.Generic.List[string]]::new()
$md.Add('# Contextual Content Audit - 2026-07')
$md.Add('')
$md.Add('Read-only audit. No WordPress post, taxonomy, option, file, Git, or deployment state was modified.')
$md.Add('')
$md.Add('## Validation')
$md.Add('')
$md.Add("- Published posts scanned: $($summary.published_posts)")
$md.Add("- Output records: $($summary.record_count)")
$md.Add("- Unique claim keys: $($summary.unique_claim_keys)")
$md.Add("- Duplicate claim keys: $($summary.duplicate_claim_keys)")
$md.Add("- Contextual range posts: $($summary.contextual_range_posts)")
$md.Add("- Contextual Whether posts: $($summary.contextual_whether_posts)")
$md.Add("- Key Data title posts: $($summary.key_data_title_posts)")
$md.Add("- Post 971 manual-review records: $($summary.post_971_records)")
$md.Add('')
$md.Add('## Atomic Removal Families')
$md.Add('')
$md.Add("- Range template A posts: $($summary.atomic_template_a_posts)")
$md.Add("- Range template B/C posts: $($summary.atomic_template_bc_posts)")
$md.Add("- Fixed Whether paragraph posts: $($summary.atomic_whether_paragraph_posts)")
$md.Add("- Fixed Whether sentence posts: $($summary.atomic_whether_sentence_posts)")
$md.Add("- Residual ROI/outcome template posts: $($summary.atomic_residual_roi_posts)")
$md.Add("- Residual AI template posts: $($summary.atomic_residual_ai_posts)")
$md.Add("- Residual TCO/implementation template posts: $($summary.atomic_residual_tco_posts)")
$md.Add("- Residual small efficiency template posts: $($summary.atomic_residual_small_posts)")
$md.Add('')
$md.Add('Atomic records identify exact repeated blocks only. Related paragraphs and bullets sharing an atomic group must be removed in one article transaction.')
$md.Add('')
$md.Add('## Record Counts')
$md.Add('')
$md.Add('| Kind | Records |')
$md.Add('|---|---:|')
foreach ($group in $byKind) { $md.Add("| $($group.Name) | $($group.Count) |") }
$md.Add('')
$md.Add('| Recommendation | Records |')
$md.Add('|---|---:|')
foreach ($group in $byRecommendation) { $md.Add("| $($group.Name) | $($group.Count) |") }
$md.Add('')
$md.Add('## Contextual Review Queue')
$md.Add('')
$md.Add('| Claim key | ID | Slug | Kind | Heading | URLs (ACF/body) | Action | Snippet |')
$md.Add('|---|---:|---|---|---|---:|---|---|')
foreach ($record in $contextual) {
    $heading = ([string]$record.heading).Replace('|', '\|')
    $snippet = ([string]$record.snippet).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $md.Add("| $($record.claim_key) | $($record.post_id) | $($record.slug) | $($record.kind) | $heading | $($record.acf_url_count)/$($record.body_url_count) | $($record.recommendation) | $snippet |")
}
$md.Add('')
$md.Add('## Atomic Removal Queue')
$md.Add('')
$md.Add('| Claim key | ID | Slug | Group | Heading | Action | Snippet |')
$md.Add('|---|---:|---|---|---|---|---|')
foreach ($record in $atomic) {
    $heading = ([string]$record.heading).Replace('|', '\|')
    $snippet = ([string]$record.snippet).Replace('|', '\|').Replace("`r", ' ').Replace("`n", ' ')
    $md.Add("| $($record.claim_key) | $($record.post_id) | $($record.slug) | $($record.atomic_group) | $heading | $($record.recommendation) | $snippet |")
}

$md | Set-Content -LiteralPath $report -Encoding utf8

[pscustomobject]@{
    Report = $report
    Records = $jsonl
    RecordCount = $records.Count
    DuplicateKeys = $summary.duplicate_claim_keys
    KeyDataTitles = $summary.key_data_title_posts
    Post971 = $summary.post_971_records
}
