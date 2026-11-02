// Synthetic, credential-free WPGraphQL data. No captured CMS content or network setup.
export const articles = [1, 2, 3].map((n) => ({
  id: `fixture-post-${n}`,
  slug: `failsafe-example-${n}`,
  title: `Failsafe example ${n}`,
  excerpt: `<p>Fixture summary ${n}.</p>`,
  content: `<h2>Fixture section ${n}</h2><p>fixture-complete-body-${n}</p>`,
  date: '2020-01-01T00:00:00',
  modified: '2020-01-01T00:00:00',
  categories: { nodes: [{ name: 'CRM', slug: 'crm' }] },
}));

const categories = [
  { id: 'fixture-crm', name: 'CRM', slug: 'crm', description: '', count: 2 },
  { id: 'fixture-analytics', name: 'Analytics', slug: 'analytics', description: '', count: 0 },
];

const page = (nodes, hasNextPage = false, endCursor = null) => ({ nodes, pageInfo: { hasNextPage, endCursor } });
const json = (data) => ({ status: 200, type: 'application/json', body: JSON.stringify({ data }) });

function articlePage(after) {
  if (after === undefined || after === null) return page([articles[0]], true, 'cursor-one');
  if (after === 'cursor-one') return page([articles[1]]);
  throw new Error(`[fixture] unexpected cursor ${after}`);
}

function healthy(operation, variables) {
  switch (operation) {
    case 'AllPostSlugs': return { posts: articlePage(variables.after) };
    case 'AllCategories': return { categories: { nodes: categories } };
    case 'CategoryPageData': {
      const cat = categories.find((c) => c.slug === variables.slug);
      if (!cat) throw new Error('[fixture] unexpected category');
      return { category: { ...cat, posts: cat.count ? articlePage(variables.after) : page([]) } };
    }
    case 'ArticlePageData': {
      const article = articles.find((a) => a.slug === variables.slug);
      if (!article) throw new Error('[fixture] unexpected article');
      // FAQ, takeaways, source fields and overview are deliberately absent.
      return { post: article };
    }
    case 'HomePageData': return { categories: { nodes: categories }, posts: { nodes: articles.slice(0, 2) } };
    case 'SiteConfig': return { siteConfig: null };
    case 'PostsBySlugs': return { posts: { nodes: articles.filter((a) => variables.slugs?.includes(a.slug)) } };
    case 'RssFeedData': return { posts: page(articles.slice(0, 2)) };
    default: throw new Error(`[fixture] unexpected operation ${operation}`);
  }
}

const list = (name, error, alter, when = () => true) => ({ name, operation: 'AllPostSlugs', error, alter, when });
const category = (name, error, alter, when = (v) => v.slug === 'crm') => ({ name, operation: 'CategoryPageData', error, alter, when });
const article = (name, error, alter) => ({ name, operation: 'ArticlePageData', error, alter, when: (v) => v.slug === articles[0].slug });

export const scenarios = [
  { name: 'normal-articles-and-empty-category', success: true },
  { name: 'optional-site-config-error', success: true, operation: 'SiteConfig', response: { status: 200, type: 'application/json', body: JSON.stringify({ errors: [{ message: 'fixture optional configuration unavailable' }] }) } },
  { name: 'http-500', operation: 'AllPostSlugs', error: 'WP GraphQL 500', response: { status: 500, type: 'application/json', body: '{}' } },
  { name: 'http-403', operation: 'AllPostSlugs', error: 'WP GraphQL request failed: 403', response: { status: 403, type: 'application/json', body: '{}' } },
  { name: 'html-endpoint', endpoint: '/cms-root', error: '[wp-api] non-GraphQL response', html: true },
  { name: 'redirect-to-html', endpoint: '/cms-root-redirect', error: '[wp-api] non-GraphQL response', redirect: true },
  { name: 'invalid-json', operation: 'AllPostSlugs', error: '[wp-api] invalid GraphQL JSON', response: { status: 200, type: 'application/json', body: '{not json' } },
  { name: 'missing-data-envelope', operation: 'AllPostSlugs', error: '[wp-api] invalid GraphQL data', response: { status: 200, type: 'application/json', body: '{}' } },
  { name: 'list-graphql-errors', operation: 'AllPostSlugs', error: 'GraphQL Error: fixture list error', response: { status: 200, type: 'application/json', body: JSON.stringify({ data: { posts: page([articles[0]]) }, errors: [{ message: 'fixture list error' }] }) } },
  list('list-empty', 'article list empty', (d) => { d.posts = page([]); }),
  list('list-nodes-not-array', '[wp-api] article list: nodes must be an array', (d) => { d.posts.nodes = {}; }),
  list('list-pageinfo-missing', '[wp-api] article list: pageInfo must be an object', (d) => { delete d.posts.pageInfo; }),
  list('list-hasnext-missing', '[wp-api] article list: hasNextPage must be boolean', (d) => { delete d.posts.pageInfo.hasNextPage; }),
  list('list-hasnext-nonboolean', '[wp-api] article list: hasNextPage must be boolean', (d) => { d.posts.pageInfo.hasNextPage = 0; }),
  list('list-cursor-missing', '[wp-api] article list: endCursor must be a non-blank string', (d) => { delete d.posts.pageInfo.endCursor; }),
  list('list-cursor-blank', '[wp-api] article list: endCursor must be a non-blank string', (d) => { d.posts.pageInfo.endCursor = '  '; }),
  list('list-cursor-repeated', '[wp-api] article list: endCursor did not advance', (d) => { d.posts = page([articles[1]], true, 'cursor-one'); }, (v) => v.after === 'cursor-one'),
  list('list-cursor-cycle', '[wp-api] article list: endCursor did not advance', (d, v) => { d.posts = v.after === 'cursor-two' ? page([articles[2]], true, 'cursor-one') : page([articles[1]], true, 'cursor-two'); }, (v) => Boolean(v.after)),
  list('pagination-truncated', '[wp-api] article list: connection must be an object', (d) => { d.posts = null; }, (v) => v.after === 'cursor-one'),
  list('list-second-pageinfo-missing', '[wp-api] article list: pageInfo must be an object', (d) => { delete d.posts.pageInfo; }, (v) => v.after === 'cursor-one'),
  category('category-nodes-not-array', '[wp-api] category crm: nodes must be an array', (d) => { d.category.posts.nodes = null; }),
  category('category-pageinfo-missing', '[wp-api] category crm: pageInfo must be an object', (d) => { delete d.category.posts.pageInfo; }),
  category('category-hasnext-missing', '[wp-api] category crm: hasNextPage must be boolean', (d) => { delete d.category.posts.pageInfo.hasNextPage; }),
  category('category-hasnext-nonboolean', '[wp-api] category crm: hasNextPage must be boolean', (d) => { d.category.posts.pageInfo.hasNextPage = 'false'; }),
  category('category-posts-missing', '[wp-api] category crm: connection must be an object', (d) => { delete d.category.posts; }),
  category('category-cursor-invalid', '[wp-api] category crm: endCursor must be a non-blank string', (d) => { d.category.posts.pageInfo.endCursor = 7; }),
  category('category-cursor-repeated', '[wp-api] category crm: endCursor did not advance', (d) => { d.category.posts = page([articles[1]], true, 'cursor-one'); }, (v) => v.slug === 'crm' && v.after === 'cursor-one'),
  category('empty-category-metadata-missing', '[wp-api] category analytics: pageInfo must be an object', (d) => { delete d.category.posts.pageInfo; }, (v) => v.slug === 'analytics'),
  article('post-null', '[wp-api] article not found: failsafe-example-1', (d) => { d.post = null; }),
  article('content-missing', '[wp-api] article body must be a non-blank string: failsafe-example-1', (d) => { delete d.post.content; }),
  article('content-whitespace', '[wp-api] article body must be a non-blank string: failsafe-example-1', (d) => { d.post.content = ' \n\t\r '; }),
  article('content-nonstring', '[wp-api] article body must be a non-blank string: failsafe-example-1', (d) => { d.post.content = 42; }),
  { name: 'article-error', operation: 'ArticlePageData', error: 'GraphQL Error: fixture article error', response: { status: 200, type: 'application/json', body: JSON.stringify({ errors: [{ message: 'fixture article error' }] }) } },
];

export function responseFor(scenario, operation, variables, pathname) {
  const html = { status: 200, type: 'text/html', body: '<!doctype html><h1>Not a GraphQL endpoint</h1>', injected: true };
  if (scenario.html || pathname === '/not-graphql') return html;
  if (scenario.redirect) return { status: 302, type: 'text/html', body: '', location: '/not-graphql', injected: true };
  const target = scenario.operation === operation && (!scenario.when || scenario.when(variables));
  if (target && scenario.response) return { ...scenario.response, injected: true };
  // A cursor cycle intentionally visits a third synthetic page before returning to cursor-one.
  const baselineVariables = target && scenario.name === 'list-cursor-cycle' && variables.after === 'cursor-two'
    ? { ...variables, after: 'cursor-one' } : variables;
  const data = structuredClone(healthy(operation, baselineVariables));
  if (target && scenario.alter) scenario.alter(data, variables);
  return { ...json(data), injected: target && Boolean(scenario.alter) };
}
