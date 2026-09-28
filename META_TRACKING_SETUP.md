# Meta Conversion + Order Tracking — Setup Guide (Dashboard / Config Steps)

The **code** is already done (Pixel + Conversions API with deduplication, attribution
capture, Razorpay recovery webhook, IST admin timezone fix). This file lists the
**non-code steps you must do yourself** in the Meta and Razorpay dashboards, plus the
environment variables to set. Do them in order.

---

## 0. Why this is needed (the actual bug)

Your Ads Manager was counting "conversions" from a **URL-based rule**, not from a real
purchase event. That rule fires on a page visit regardless of whether the order was
saved to the database — which is why **Meta showed a conversion but the order was
missing**. We have replaced that with a real server `Purchase` event that fires **only
after a successful DB insert**. You must now turn off the old URL rule (Step 3) or you
will double-count.

---

## 1. Set environment variables

Add these to your hosting environment (Vercel → Project → Settings → Environment
Variables) and to your local `.env.local`. Then redeploy.

| Variable | Required | What it is |
| --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Recommended | Your Meta Pixel ID. Defaults to the existing hard-coded ID if unset, but set it explicitly. |
| `META_CAPI_ACCESS_TOKEN` | **Required** | Conversions API access token (Step 2). Without it, the server `Purchase` event is skipped (orders still work). |
| `META_TEST_EVENT_CODE` | Only while testing | Test Events code (Step 5). **Remove it before going live**, or events stay in test mode. |
| `RAZORPAY_WEBHOOK_SECRET` | **Required for prepaid recovery** | Secret you set when creating the Razorpay webhook (Step 6). |

> The following already exist in your project and are reused: `RAZORPAY_KEY_ID`,
> `RAZORPAY_KEY_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `UPSTASH_REDIS_REST_URL`,
> `UPSTASH_REDIS_REST_TOKEN`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`.

---

## 2. Generate the Conversions API access token

1. Go to **[Meta Events Manager](https://business.facebook.com/events_manager)**.
2. Select your **Pixel / Dataset** (the one matching `NEXT_PUBLIC_META_PIXEL_ID`).
3. Open the **Settings** tab.
4. Scroll to **Conversions API → Set up manually / Generate access token**.
5. Click **Generate access token**, copy it.
6. Put it in `META_CAPI_ACCESS_TOKEN` (Step 1). Treat it like a password — server-side only.

---

## 3. Turn off the old URL-based "conversion" (the root cause)

1. In **Events Manager**, open the **Custom Conversions** section (left sidebar) **and**
   the **Aggregated Event Measurement** settings.
2. Find any conversion defined by a **URL rule** — most likely a URL that **contains**
   something like `/account/orders`, `/thank-you`, or a checkout path.
3. This is what was firing on navigation. Do **one** of the following:
   - **Recommended:** delete / deactivate that URL custom conversion, and instead
     optimize your campaigns for the real **Purchase** event (now sent by the code).
   - If you must keep it temporarily, at least stop using it as the campaign's
     optimization/conversion event so you don't double-count against `Purchase`.
4. In **Aggregated Event Measurement** (iOS), make sure **`Purchase`** is configured as a
   prioritized event for your domain.

---

## 4. Verify the domain & event setup

1. Events Manager → **Settings** → confirm your **website domain is verified**
   (Brand Safety → Domains). Needed for accurate attribution on iOS.
2. Under **Data sources**, confirm the Pixel is **Active** and receiving `PageView`.

---

## 5. Test before going live (Test Events)

1. Events Manager → your Pixel → **Test Events** tab.
2. Copy the **test event code** shown there (looks like `TESTxxxxx`).
3. Set `META_TEST_EVENT_CODE` to that value (Step 1) and redeploy a **preview/staging**
   deploy.
4. Place a **COD** order and a **prepaid** (Razorpay test mode) order from the site.
5. In the **Test Events** panel you should see, for each order, a `Purchase` event that is
   **received twice but deduplicated** (once `Browser` / Pixel, once `Server` / CAPI) with
   the **same `event_id` = your `order_id`**. Meta merges them into one conversion.
6. Confirm `value`, `currency = INR`, and `content_ids` look right.
7. **Remove `META_TEST_EVENT_CODE`** and redeploy to production once verified.

> Deduplication detail (already handled in code): the browser Pixel and the server CAPI
> both send `event_id = order_id`. Do **not** change that, or you will double-count.

---

## 6. Create the Razorpay webhook (prevents "paid but no order")

This is the safety net: if a customer pays but their browser/app closes before the order
is written (common in the Instagram/Facebook in-app browser), the webhook recovers the
order server-side.

1. Go to **Razorpay Dashboard → Settings → Webhooks → + Add New Webhook**.
2. **Webhook URL:** `https://<your-production-domain>/api/payment/razorpay-webhook`
3. **Secret:** create a strong random string. Use the **same value** for the
   `RAZORPAY_WEBHOOK_SECRET` env var (Step 1).
4. **Active Events:** tick **`payment.captured`** and **`order.paid`**.
5. Save. Razorpay sends a test ping — it should return `200`.
6. Do this in **both** Razorpay **Test mode** and **Live mode** (each has its own
   webhooks and its own secret/keys).

### Test the recovery path
1. In Razorpay **test mode**, start a prepaid checkout and pay.
2. **Kill the browser tab immediately** after payment success (before the order page
   loads).
3. Within a few seconds the webhook should create the order. Confirm it appears in the
   database (or customer account orders), and that the Meta `Purchase` fired (Test Events).
4. Reconciliation check: in Razorpay, **captured payments without a matching order should
   be ~0** after this is live.

> Note: recovery uses the Redis checkout context, which has a **30-minute TTL**. Razorpay
> normally fires `payment.captured` within seconds, so this is fine. If a webhook ever
> arrives after 30 min AND the client never completed, the server logs
> `UNRECOVERABLE payment without order` — search logs for that string to catch leaks.

---

## 7. What the code now does (for your reference)

- **Attribution capture** (`AttributionTracker`): on landing from an ad, stores `fbclid`
  → `_fbc` cookie, persists UTM params, and cleans tracking params from the URL.
- **Server Purchase event** fires **only after a successful order insert**:
  - COD (free shipping / no shipping fee) → `/api/payment/cod`
  - COD with shipping fee → Razorpay `COD_SHIPPING` → `finalizePrepaidOrder`
  - Prepaid → Razorpay `PREPAID` → `finalizePrepaidOrder` (also webhook recovery)
- **Browser Pixel Purchase** fires only after the order API returns `200`, with the same
  `event_id` for deduplication. Value matches CAPI (includes ₹75 COD shipping when charged).
- **AddToCart** (browser Pixel) fires from `addToLocalCart` / `addToDbCart` on every
  successful add (product page, cards, wishlist, cart quantity +).
- **Admin timezone:** the Orders page now displays and filters Today/Yesterday/custom in
  **IST (Asia/Kolkata)**, fixing late-night orders showing on the wrong day. No DB change
  was made — `order_date` stays `timestamp without time zone` (UTC) and is converted to
  IST in code.

---

## 8. Meta Ads Manager — use these events in campaigns

After events show as **Active** in Events Manager (Test Events first), wire them into ads:

### A. Confirm events in Events Manager
1. [Events Manager](https://business.facebook.com/events_manager) → your Pixel.
2. **Overview** / **Test Events**: you should see `PageView`, `AddToCart`, `Purchase`.
3. For `Purchase`, open an event → confirm `value`, `currency = INR`, `content_ids`, and
   that Browser + Server share the same `event_id` (deduped to one conversion).

### B. Aggregated Event Measurement (iOS / domain)
1. Events Manager → **Aggregated Event Measurement** → **Configure web events**.
2. Select your verified domain.
3. Prioritize (top of list is highest):
   1. **Purchase**
   2. **AddToCart** (optional but useful for mid-funnel)
   3. **PageView** (usually automatic)
4. Submit / publish. Without this, iOS attribution for Purchase is unreliable.

### C. Custom conversions (only if needed)
Prefer the standard **Purchase** / **AddToCart** events. Do **not** recreate URL-based
custom conversions for thank-you or `/account/orders` pages (that was the old bug).

### D. Create / edit a campaign
1. Ads Manager → **Create** (or edit an existing campaign).
2. **Buying type:** Auction. **Objective:** **Sales** (Conversions).
3. At ad set level → **Conversion** / **Optimization**:
   - Primary: **Website** → **Purchase** (Pixel / Dataset).
   - For retargeting / TOFU tests you can also optimize for **AddToCart**.
4. **Conversion location:** Website. Dataset = your Pixel ID.
5. Attribution setting: start with **7-day click, 1-day view** (or Meta’s recommended default).
6. Audience, budget, creatives as usual. Publish.

### E. Catalog / dynamic ads (optional)
If you use Advantage+ catalog ads later, map `content_ids` to catalog product IDs
(same as your `product_id` values sent in events).

### F. Reporting
- Ads Manager columns → customize → add **Purchases**, **Purchase ROAS**, **Add to cart**.
- Compare Purchases in Ads Manager vs orders in your admin (IST “Today”). They should
  track closely; small gaps are normal (iOS, blockers, delayed attribution).

---

## 9. Optional: audit columns on `orders`

The code logs CAPI outcomes to the server console (search logs for `[meta/capi]`). It does
**not** write to new DB columns, so nothing breaks if you skip this. If you later want to
persist Meta dispatch status per order for auditing, run this SQL in Supabase and then
extend `sendPurchaseEvent` callers to update it:

```sql
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS meta_event_id text,
  ADD COLUMN IF NOT EXISTS meta_capi_status text;
```

---

## Quick checklist

- [ ] Env vars set (`META_CAPI_ACCESS_TOKEN`, `RAZORPAY_WEBHOOK_SECRET`, pixel id) and redeployed
- [ ] CAPI access token generated (Step 2)
- [ ] Old URL-based custom conversion disabled (Step 3)
- [ ] Domain verified + `Purchase` prioritized (Step 4 / section 8B)
- [ ] Tested with `META_TEST_EVENT_CODE`: AddToCart on product add; one deduped Purchase per order (COD free shipping, COD+shipping, prepaid)
- [ ] Razorpay webhook created in test + live, recovery tested (Step 6)
- [ ] Ads Manager campaign optimization set to **Purchase** (section 8D)
- [ ] `META_TEST_EVENT_CODE` removed for production
