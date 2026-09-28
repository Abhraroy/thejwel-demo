/**
 * Single source of truth for shipping charges.
 *
 * Values are env-driven (NEXT_PUBLIC_ so both client components and server
 * routes can read them) with safe defaults:
 *   - NEXT_PUBLIC_SHIPPING_FEE (default 49)
 *   - NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD (default 499)
 *   - NEXT_PUBLIC_SHIPPING_ENABLED (default true; "false" disables charges)
 *
 * NEXT_PUBLIC_ vars are baked at build time, so changing them requires a rebuild.
 */
export const SHIPPING_FEE = Number(process.env.NEXT_PUBLIC_SHIPPING_FEE) || 49;

export const FREE_SHIPPING_THRESHOLD =
  Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD) || 499;

export const SHIPPING_ENABLED =
  (process.env.NEXT_PUBLIC_SHIPPING_ENABLED ?? "true") !== "false";

/**
 * Resolve the shipping cost for a given order subtotal.
 * Returns 0 when shipping is globally disabled or the subtotal qualifies for
 * free shipping.
 */
export function getShippingCost(subtotal: number): number {
  if (!SHIPPING_ENABLED) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
