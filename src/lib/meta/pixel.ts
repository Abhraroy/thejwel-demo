/**
 * Client-side Meta Pixel helpers.
 *
 * The Pixel is bootstrapped in `MetaPixel.tsx`. Helpers here fire standard
 * events via `fbq('track', ...)`.
 *
 * Purchase IMPORTANT: always pass `eventId = order_id` (the same id used by the
 * server Conversions API) so Meta deduplicates the two events into one
 * conversion. Only call AFTER the order API has returned success.
 */

type Fbq = (
  action: string,
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

function safeTrack(
  event: string,
  params?: Record<string, unknown>,
  eventId?: string
): void {
  const fbq = getFbq();
  if (!fbq) return;
  try {
    if (eventId) {
      fbq("track", event, params ?? {}, { eventID: eventId });
    } else {
      fbq("track", event, params ?? {});
    }
  } catch {
    // Never let analytics throw into checkout / cart flows.
  }
}

export interface TrackPurchaseArgs {
  eventId: string;
  value: number;
  currency?: string;
  contentIds?: string[];
  numItems?: number;
}

export function trackPurchase({
  eventId,
  value,
  currency = "INR",
  contentIds,
  numItems,
}: TrackPurchaseArgs): void {
  const params: Record<string, unknown> = {
    value: Number(value) || 0,
    currency,
  };
  if (contentIds && contentIds.length > 0) {
    params.content_ids = contentIds;
    params.content_type = "product";
  }
  if (typeof numItems === "number" && numItems > 0) {
    params.num_items = numItems;
  }
  safeTrack("Purchase", params, eventId);
}

export interface TrackAddToCartArgs {
  contentIds: string[];
  value?: number;
  currency?: string;
  numItems?: number;
  /** Optional stable id for future CAPI dedupe; not required for Pixel-only. */
  eventId?: string;
}

export function trackAddToCart({
  contentIds,
  value,
  currency = "INR",
  numItems = 1,
  eventId,
}: TrackAddToCartArgs): void {
  if (!contentIds.length) return;
  const params: Record<string, unknown> = {
    content_ids: contentIds,
    content_type: "product",
    num_items: numItems,
    currency,
  };
  if (typeof value === "number" && Number.isFinite(value)) {
    params.value = value;
  }
  safeTrack("AddToCart", params, eventId);
}
