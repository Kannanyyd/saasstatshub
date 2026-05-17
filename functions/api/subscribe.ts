/**
 * POST /api/subscribe — Cloudflare Pages Function (edge runtime)
 *
 * Body: { email: string, source?: string, hp?: string }
 *
 * Adds the email to a MailerLite group. Required env vars (configured
 * in Cloudflare Pages Settings → Variables and Secrets):
 *   - MAILERLITE_API_KEY  (Secret)
 *   - MAILERLITE_GROUP_ID (Plaintext)
 *
 * Returns:
 *   200 { ok: true, status: 'subscribed' | 'already_subscribed' }
 *   400 { ok: false, error: string }
 *   429 { ok: false, error: string }
 *   500 { ok: false, error: string }
 *
 * Honeypot: clients send `hp` as a hidden field. If non-empty the
 * caller is treated as a bot and we silently return success without
 * forwarding to MailerLite.
 *
 * Why a Pages Function (not an Astro endpoint)?
 *   - Keeps the existing pure-static deploy model (no _worker.js)
 *   - CF Pages auto-detects `functions/api/subscribe.ts` and routes
 *     POST /api/subscribe to it on the edge.
 */

interface Env {
  MAILERLITE_API_KEY?: string;
  MAILERLITE_GROUP_ID?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid request body' });
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const source = typeof payload?.source === 'string' ? payload.source.slice(0, 64) : 'unknown';
  const honeypot = typeof payload?.hp === 'string' ? payload.hp.trim() : '';

  // Bot trap — silently succeed
  if (honeypot.length > 0) {
    return json(200, { ok: true, status: 'subscribed' });
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json(400, { ok: false, error: 'Please enter a valid email address.' });
  }

  const apiKey = env.MAILERLITE_API_KEY;
  const groupId = env.MAILERLITE_GROUP_ID;

  if (!apiKey || !groupId) {
    console.error('[subscribe] Missing MAILERLITE_API_KEY or MAILERLITE_GROUP_ID');
    return json(500, { ok: false, error: 'Newsletter is temporarily unavailable. Please try again later.' });
  }

  try {
    // MailerLite v2 API: upsert subscriber + add to group in one call.
    // https://developers.mailerlite.com/docs/subscribers.html#create-update-subscriber
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        groups: [groupId],
        fields: {
          // `signup_source` only persists if a custom field with that
          // exact name exists in MailerLite. Safe to include either way.
          signup_source: source,
        },
      }),
    });

    if (res.status === 429) {
      return json(429, { ok: false, error: 'Too many requests. Please wait a moment and try again.' });
    }

    const data = (await res.json().catch(() => ({}))) as any;

    if (!res.ok) {
      if (res.status === 422 || res.status === 400) {
        const msg =
          data?.message ||
          data?.errors?.email?.[0] ||
          'This email could not be subscribed. Try a different one.';
        return json(400, { ok: false, error: msg });
      }
      console.error('[subscribe] MailerLite error', { status: res.status, body: data, source });
      return json(500, { ok: false, error: 'Subscription failed. Please try again later.' });
    }

    // 201 = new, 200 = upsert of existing
    const isExisting = res.status === 200;
    return json(200, {
      ok: true,
      status: isExisting ? 'already_subscribed' : 'subscribed',
    });
  } catch (err) {
    console.error('[subscribe] Network error', err, { source });
    return json(500, { ok: false, error: 'Network error. Please try again.' });
  }
};

// Same-origin form, no real CORS need, but answer OPTIONS preflight politely.
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': 'https://saasstatshub.com',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '86400',
    },
  });
};

// Anything else (GET/PUT/DELETE) — 405
export const onRequest: PagesFunction = async ({ request }) => {
  if (request.method === 'POST' || request.method === 'OPTIONS') {
    // These are handled by the more-specific handlers above; this fallback
    // only runs for unsupported methods.
  }
  return json(405, { ok: false, error: 'Method not allowed' });
};
