# Contributing to SaaSStatsHub

Thank you for helping improve SaaSStatsHub. This project welcomes focused, reviewable contributions that improve the public frontend, documentation, tests, accessibility, or data-publishing workflow.

## Before you start

- Search existing issues before opening a new one.
- Open an issue before starting a large feature, schema change, or redesign.
- Keep pull requests limited to one clear problem.
- Do not include private CMS data, credentials, paid datasets, or third-party content without redistribution rights.

## Development setup

```bash
git clone https://github.com/Kannanyyd/saasstatshub.git
cd saasstatshub
npm ci
npm run dev
```

Node.js 22.12 or later is required.

The development server can use local mock data when WordPress is unavailable. To test against your own CMS, set `WP_API_URL` in an uncommitted `.env` file.

## Making a change

1. Create a branch from the current `main` branch.
2. Reproduce the problem or define the expected behavior.
3. Make the smallest change that addresses it.
4. Add or update tests when behavior changes.
5. Run the relevant checks locally.
6. Open a pull request using the repository template.

## Required checks

```bash
npm run test:phase1
npm run build
```

The production build queries a CMS when configured and may take longer than the unit tests. A pull request should not be merged while required CI checks are failing.

## Content and source changes

Changes affecting statistics, research summaries, example data, or source-handling code require extra care:

- Link to the original source page, not a search result or generic homepage.
- Distinguish actual results from forecasts and estimates.
- Preserve the source year, geography, sample, and market definition.
- Do not introduce unsupported percentages, revenue figures, user counts, or anonymous case studies.
- Explain content corrections in the pull request description.

The production editorial library is not licensed as part of this source repository. Do not copy production articles into issues or pull requests.

## Code style

- Follow the existing Astro and TypeScript patterns.
- Prefer focused components and direct implementations.
- Avoid unrelated formatting or refactoring.
- Use ASCII in source files unless a file already requires another character set.
- Never commit secrets or generated `dist/` output.

## Pull request review

A maintainer will review correctness, scope, tests, accessibility, security, and licensing. Review requests may ask for a smaller change or stronger verification. Approval is not guaranteed, and maintainers may close inactive or out-of-scope proposals.

By submitting a contribution, you agree that your contribution is licensed under AGPL-3.0-only and that you have the right to provide it under that license.
