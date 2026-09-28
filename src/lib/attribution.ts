/**
 * Client-side ad attribution capture for Meta (Facebook/Instagram) ads.
 *
 * On the first landing from an ad, Meta appends `?fbclid=...` to the URL. The
 * Meta Pixel turns that into the `_fbc` cookie and maintains a `_fbp` browser
 * id cookie. We:
 *   1. capture `fbclid` -> build a `_fbc` cookie as a fallback (in case the
 *      Pixel is blocked / delayed in an in-app browser),
 *   2. persist UTM params to a first-party cookie so they survive navigation,
 *   3. clean tracking params out of the visible URL AFTER persisting.
 *
 * `getAttribution()` reads everything back so it can be attached to checkout
 * requests and forwarded to the server Conversions API.
 */

export interface AttributionPayload {
  fbp: string | null;
  fbc: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingUrl: string | null;
  eventSourceUrl: string | null;
}

const FBC_COOKIE = "_fbc";
const FBP_COOKIE = "_fbp";
const UTM_COOKIE = "tj_utm";
const LANDING_COOKIE = "tj_landing_url";

const TRACKING_PARAMS = [
  "fbclid",
  "gclid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // 90 days

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_SECONDS) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

/**
 * Run once on landing. Captures fbclid/UTM, persists them, then strips the
 * tracking params from the visible URL without a full navigation.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    const fbclid = params.get("fbclid");
    if (fbclid && !readCookie(FBC_COOKIE)) {
      // Meta's documented _fbc format: fb.<subdomainIndex>.<timestampMs>.<fbclid>
      writeCookie(FBC_COOKIE, `fb.1.${Date.now()}.${fbclid}`);
    }

    const utm = {
      source: params.get("utm_source"),
      medium: params.get("utm_medium"),
      campaign: params.get("utm_campaign"),
      content: params.get("utm_content"),
      term: params.get("utm_term"),
    };
    const hasUtm = Object.values(utm).some(Boolean);
    if (hasUtm) {
      writeCookie(UTM_COOKIE, JSON.stringify(utm));
    }

    if (!readCookie(LANDING_COOKIE)) {
      writeCookie(LANDING_COOKIE, window.location.href);
    }

    // Clean only known tracking params; preserve any functional query params.
    let mutated = false;
    for (const key of TRACKING_PARAMS) {
      if (params.has(key)) {
        params.delete(key);
        mutated = true;
      }
    }
    if (mutated) {
      const cleaned = url.pathname + (params.toString() ? `?${params.toString()}` : "") + url.hash;
      window.history.replaceState(window.history.state, "", cleaned);
    }
  } catch {
    // Attribution is best-effort; never break the page.
  }
}

/** Read persisted attribution to attach to checkout/API requests. */
export function getAttribution(): AttributionPayload {
  let utm: Record<string, string | null> = {};
  try {
    const raw = readCookie(UTM_COOKIE);
    if (raw) utm = JSON.parse(raw);
  } catch {
    utm = {};
  }

  return {
    fbp: readCookie(FBP_COOKIE),
    fbc: readCookie(FBC_COOKIE),
    utmSource: utm.source ?? null,
    utmMedium: utm.medium ?? null,
    utmCampaign: utm.campaign ?? null,
    utmContent: utm.content ?? null,
    utmTerm: utm.term ?? null,
    landingUrl: readCookie(LANDING_COOKIE),
    eventSourceUrl: typeof window !== "undefined" ? window.location.href : null,
  };
}
