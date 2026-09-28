import "server-only";
import crypto from "crypto";
import type { AttributionPayload } from "@/lib/attribution";

/**
 * Meta Conversions API (server-side) Purchase event sender.
 *
 * This is the SOURCE OF TRUTH for ad conversions: it is fired ONLY after a
 * successful order insert, using `event_id = order_id` so it deduplicates
 * against the browser Pixel `Purchase` (same eventID). A CAPI failure must
 * never roll back or block the order — all errors are caught and logged.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

const GRAPH_VERSION = "v21.0";
const DEFAULT_PIXEL_ID = "1603225247464427";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

function hashPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  // Meta expects digits only including country code, no '+' or separators.
  const digits = phone.replace(/\D/g, "");
  return digits ? sha256(digits) : undefined;
}

function hashName(name?: string | null): string | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

export interface PurchaseEventUser {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
}

export interface SendPurchaseEventArgs {
  /** Use the order_id so the Pixel + CAPI events dedupe. */
  eventId: string;
  value: number;
  currency?: string;
  contentIds?: string[];
  user: PurchaseEventUser;
  attribution?: Partial<AttributionPayload> | null;
  eventSourceUrl?: string | null;
}

export interface SendPurchaseEventResult {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  eventsReceived?: number;
  fbtraceId?: string;
  error?: string;
}

const log = (...args: unknown[]) => {
  console.log("[meta/capi]", ...args);
};

export async function sendPurchaseEvent(
  args: SendPurchaseEventArgs
): Promise<SendPurchaseEventResult> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? DEFAULT_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!accessToken) {
    log("skipped:no-access-token", { eventId: args.eventId });
    return { ok: false, skipped: true, error: "META_CAPI_ACCESS_TOKEN not set" };
  }

  const attribution = args.attribution ?? {};

  const userData: Record<string, unknown> = {};
  const em = hashEmail(args.user.email);
  const ph = hashPhone(args.user.phone);
  const fn = hashName(args.user.firstName);
  const ln = hashName(args.user.lastName);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (fn) userData.fn = [fn];
  if (ln) userData.ln = [ln];
  if (attribution.fbp) userData.fbp = attribution.fbp;
  if (attribution.fbc) userData.fbc = attribution.fbc;
  if (args.user.clientIpAddress) userData.client_ip_address = args.user.clientIpAddress;
  if (args.user.clientUserAgent) userData.client_user_agent = args.user.clientUserAgent;

  const customData: Record<string, unknown> = {
    currency: args.currency ?? "INR",
    value: Number(args.value) || 0,
  };
  if (args.contentIds && args.contentIds.length > 0) {
    customData.content_ids = args.contentIds;
    customData.content_type = "product";
  }
  if (attribution.utmSource) customData.utm_source = attribution.utmSource;
  if (attribution.utmMedium) customData.utm_medium = attribution.utmMedium;
  if (attribution.utmCampaign) customData.utm_campaign = attribution.utmCampaign;

  const eventSourceUrl =
    args.eventSourceUrl ?? attribution.eventSourceUrl ?? attribution.landingUrl ?? undefined;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: args.eventId,
        action_source: "website",
        ...(eventSourceUrl ? { event_source_url: eventSourceUrl } : {}),
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  const testEventCode = process.env.META_TEST_EVENT_CODE;
  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
    accessToken
  )}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string };
    };

    if (!res.ok) {
      log("error", {
        eventId: args.eventId,
        status: res.status,
        message: json?.error?.message,
        fbtraceId: json?.fbtrace_id,
      });
      return {
        ok: false,
        status: res.status,
        fbtraceId: json?.fbtrace_id,
        error: json?.error?.message ?? `HTTP ${res.status}`,
      };
    }

    log("sent", {
      eventId: args.eventId,
      status: res.status,
      eventsReceived: json?.events_received,
      fbtraceId: json?.fbtrace_id,
    });
    return {
      ok: true,
      status: res.status,
      eventsReceived: json?.events_received,
      fbtraceId: json?.fbtrace_id,
    };
  } catch (error) {
    log("exception", {
      eventId: args.eventId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
