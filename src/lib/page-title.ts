const DEFAULT_SITE_NAME = 'SaaSStatsHub';
const MAX_SEARCH_TITLE_LENGTH = 65;

function truncateAtWordBoundary(value: string, maxLength: number) {
  const available = maxLength - 3;
  const candidate = value.slice(0, available + 1);
  const boundary = candidate.lastIndexOf(' ');
  const end = boundary >= Math.floor(available * 0.6) ? boundary : available;
  return `${value.slice(0, end).trimEnd()}...`;
}

export function createPageTitle(title: string, siteName = DEFAULT_SITE_NAME) {
  if (title === 'Home') {
    return `${siteName} - SaaS Research, Statistics and Guides`;
  }

  const brandedTitle = `${title} | ${siteName}`;
  if (brandedTitle.length <= MAX_SEARCH_TITLE_LENGTH) return brandedTitle;
  if (title.length <= MAX_SEARCH_TITLE_LENGTH) return title;

  const descriptivePrefix = title.split(':', 1)[0].trim();
  if (descriptivePrefix !== title) {
    const brandedPrefix = `${descriptivePrefix} | ${siteName}`;
    if (brandedPrefix.length <= MAX_SEARCH_TITLE_LENGTH) return brandedPrefix;
    if (descriptivePrefix.length <= MAX_SEARCH_TITLE_LENGTH) return descriptivePrefix;
  }

  return truncateAtWordBoundary(title, MAX_SEARCH_TITLE_LENGTH);
}
