# Meta description remediation toolkit

This toolkit creates evidence-backed WordPress excerpts for article meta
descriptions. It is extractive and deterministic: it does not invent claims,
numbers, products, or filler text. Records that cannot pass every gate are sent
to `manual_review`.

Version 2 accepts extractive text only at an existing sentence boundary. It
never truncates at an arbitrary word, comma, colon, or semicolon and then adds
a period. Candidates ending in an article, conjunction, or preposition are
rejected, as are known generic AI phrases.

## Safety model

- Export is GraphQL read-only.
- Generation and validation are local operations.
- The PHP updater defaults to dry-run.
- Writes require both `--apply` and the manifest's exact `--confirm-run` value.
- Rollback requires `--rollback` and the same confirmation value.
- Excerpt hash and `modified_gmt` checks prevent overwriting changed posts.
- Apply and rollback are limited to 100 posts per invocation.
- Only manifest records with `status: ready` can be processed.

## 1. Export a snapshot

```powershell
$env:WP_API_URL='https://cms.example.com/graphql'
node scripts/meta-remediation-export.mjs `
  --output artifacts/meta-remediation-snapshot.json
```

The snapshot stores the raw excerpt, body, title, slug, database ID, category
slugs, and modification time. Keep it immutable for rollback.

## 2. Generate a manifest

```powershell
node scripts/meta-remediation-generate.mjs `
  --input artifacts/meta-remediation-snapshot.json `
  --output artifacts/meta-remediation-manifest.json
```

Every ready record contains old/candidate/content hashes and hashes of the
source sentences used. A candidate must be 145-160 ASCII characters, end at a
complete word and sentence boundary, contain a title entity, and use only
numbers present in the title or body. Exact and 3-gram Jaccard near-duplicates
at or above 0.85 are rejected.

When no safe extractive sentence fits, the generator may use a deterministic
page-type fallback. These fallbacks describe only document structure, such as
definitions, methodology, limitations, comparison criteria, and cited sources.
They do not claim outcomes or introduce facts. Statistics, glossary,
comparison, alternatives, how-to, and general pages use separate candidate
pools. The batch generator tries alternate structural orderings when a fallback
would violate an exact or near-duplicate gate.

The generator also writes `*.manual-review.json`. That queue is intentional:
it contains pages for which safe extractive generation was not possible and
must never be treated as an execution error or silently filled with boilerplate.

## 3. Validate locally

```powershell
node scripts/meta-remediation-validate.mjs `
  --manifest artifacts/meta-remediation-manifest.json
```

Review every `manual_review` item. Do not change its status without rerunning
all gates. The validator exits nonzero on any hard failure.

## 4. Dry-run and apply on a WordPress host

Copy only the reviewed manifest and `meta-remediation-apply.php` to the host.

```bash
php meta-remediation-apply.php \
  --manifest=/secure/path/manifest.json \
  --wp-root=/var/www/wordpress \
  --batch-size=25 --offset=0

php meta-remediation-apply.php \
  --manifest=/secure/path/manifest.json \
  --wp-root=/var/www/wordpress \
  --apply --confirm-run=meta-YYYYMMDDHHMMSS \
  --batch-size=25 --offset=0
```

Preserve each JSON result. Stop on a conflict or error instead of bypassing the
concurrency checks.

## 5. CMS, GraphQL, and rendered validation

After an approved apply, validate GraphQL values:

```powershell
node scripts/meta-remediation-validate.mjs `
  --manifest artifacts/meta-remediation-manifest.json `
  --graphql https://cms.example.com/graphql
```

After a local Astro build, validate ordinary, Open Graph, and Twitter meta tags:

```powershell
node scripts/meta-remediation-validate.mjs `
  --manifest artifacts/meta-remediation-manifest.json `
  --dist dist
```

## 6. Roll back a verified batch

Rollback succeeds only when the current excerpt still has the candidate hash.
This protects any subsequent editorial change.

```bash
php meta-remediation-apply.php \
  --manifest=/secure/path/manifest.json \
  --wp-root=/var/www/wordpress \
  --rollback --confirm-run=meta-YYYYMMDDHHMMSS \
  --batch-size=25 --offset=0
```
