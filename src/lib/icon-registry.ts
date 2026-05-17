/**
 * Hand-curated registry of Lucide icons used by this site.
 *
 * Adding an icon here is a deliberate act — keeps tree-shaking honest.
 * Every icon used by `Icon.astro` MUST be imported here and exposed
 * through ICON_REGISTRY.
 *
 * Lucide v1.x ships each icon as an array of child tuples:
 *   `[ ['path', { d: '...' }], ['circle', { cx: '...', cy: '...', r: '...' }] ]`
 *
 * The outer SVG wrapper (viewBox, fill, stroke, stroke-width, stroke-linecap,
 * stroke-linejoin) is added by `Icon.astro` — only the children live here.
 */

import {
  // Categories (Req 4.1) — slug → icon mapping in design §3.6
  Users,
  Megaphone,
  ShoppingCart,
  ClipboardList,
  UserCog,
  BarChart3,
  Shield,
  MessageSquare,

  // UI controls (Req 4.4)
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,

  // Hot Stat replacements (Req 4.11) — replace s1–s8 emoji
  TrendingUp,
  Building2,
  Rocket,
  Cloud,
  Smartphone,
  Lock,
  Bot,

  // Misc
  Mail,
  // Article-internal section markers
  List,
  Target,
} from 'lucide';

/**
 * A Lucide icon body: an array of `[svgChildTag, attrs]` tuples.
 * `Icon.astro` renders these as inline SVG children.
 */
export type IconBody = ReadonlyArray<readonly [string, Readonly<Record<string, string | number>>]>;

export const ICON_REGISTRY: Readonly<Record<string, IconBody>> = {
  // Categories
  users: Users as unknown as IconBody,
  megaphone: Megaphone as unknown as IconBody,
  'shopping-cart': ShoppingCart as unknown as IconBody,
  'clipboard-list': ClipboardList as unknown as IconBody,
  'user-cog': UserCog as unknown as IconBody,
  'bar-chart-3': BarChart3 as unknown as IconBody,
  shield: Shield as unknown as IconBody,
  'message-square': MessageSquare as unknown as IconBody,

  // UI controls
  search: Search as unknown as IconBody,
  menu: Menu as unknown as IconBody,
  x: X as unknown as IconBody,
  'chevron-down': ChevronDown as unknown as IconBody,
  'chevron-right': ChevronRight as unknown as IconBody,
  'external-link': ExternalLink as unknown as IconBody,

  // Hot Stat replacements
  'trending-up': TrendingUp as unknown as IconBody,
  'building-2': Building2 as unknown as IconBody,
  rocket: Rocket as unknown as IconBody,
  cloud: Cloud as unknown as IconBody,
  smartphone: Smartphone as unknown as IconBody,
  lock: Lock as unknown as IconBody,
  bot: Bot as unknown as IconBody,

  // Misc
  mail: Mail as unknown as IconBody,

  // Article-internal section markers (TOC, Key Takeaways)
  list: List as unknown as IconBody,
  target: Target as unknown as IconBody,
};

export type RegisteredIconName = keyof typeof ICON_REGISTRY;

/**
 * Build-time icon resolution.
 *
 * Throws synchronously when `name` is not registered, which causes the
 * Astro SSG render to fail with a clear error pointing at the offending
 * `<Icon name="...">` usage. This is required by Req 4.14: any unknown
 * `iconName` on `CategoryMeta` or `HotStat` MUST fail the build.
 */
export function resolveIcon(name: string): IconBody {
  const body = (ICON_REGISTRY as Record<string, IconBody | undefined>)[name];
  if (!body) {
    const known = Object.keys(ICON_REGISTRY).sort().join(', ');
    throw new Error(
      `[icon-registry] Unknown icon name: "${name}". ` +
        `Either add it to ICON_REGISTRY in src/lib/icon-registry.ts, ` +
        `or fix the source field. Known names: ${known}`,
    );
  }
  return body;
}
