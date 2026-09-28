## Run the website locally (step-by-step)

### 1) Prerequisites

- **Node.js**: install Node 20+ (recommended)
- **pnpm**: this repo uses `pnpm` (see `package.json` → `packageManager`)

### 2) Install dependencies

```bash
pnpm install
```

### 3) Create environment variables

Create a file named `.env.local` in the project root.

Minimum required to boot pages that hit the database:

```bash
# Supabase (required for most pages + sitemap dynamic URLs)
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="..."
```

Recommended for correct canonical URLs / OpenGraph URLs / robots+sitemap host:

```bash
# Public site base URL (used for canonical URLs + OG/Twitter + robots/sitemap host)
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
# or
SITE_URL="http://localhost:3000"
```

Optional (only needed for the related features):

```bash
# Meta Pixel (optional; defaults to a hardcoded id if not set)
NEXT_PUBLIC_META_PIXEL_ID="..."

# Razorpay (required for payment APIs / checkout)
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="..."

# Upstash Redis (optional; used where Redis is used)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
```

### 4) Run the dev server

```bash
pnpm dev
```

Open `http://localhost:3000`.

### 5) Production build (optional)

```bash
pnpm build
pnpm start
```

## SEO-related data locations (all places)

### Global SEO (applies site-wide)

- **Root metadata (title/description/canonical/OG/Twitter/robots/icons + Google verification)**: `src/app/(main)/layout.tsx` (exports `metadata`)
- **Base URL + helpers for canonical/OG/Twitter/robots**: `src/lib/seo/metadata.ts` (`getBaseUrl`, `toAbsoluteUrl`, `buildPageMetadata`)
- **Structured data (JSON-LD renderer component)**: `src/components/seo/JsonLd.tsx`
- **Structured data injected globally (Organization + WebSite schema)**: `src/app/(main)/layout.tsx` (uses `JsonLd`)

### Per-route SEO (metadata / canonical / noindex)

- **Home page metadata**: `src/app/(main)/page.tsx` (exports `metadata` via `buildPageMetadata`)
- **Product page metadata + Product/Breadcrumb JSON-LD**: `src/app/(main)/product/[product_id]/page.tsx` (`generateMetadata`, `JsonLd`)
- **Category page metadata + ItemList JSON-LD**: `src/app/(main)/category/[categoryslug]/page.tsx` (`generateMetadata`, `JsonLd`)
- **Style page metadata + ItemList JSON-LD**: `src/app/(main)/style/[style]/page.tsx` (`generateMetadata`, `JsonLd`)
- **Occasion page metadata + ItemList JSON-LD**: `src/app/(main)/occasion/[occasion]/page.tsx` (`generateMetadata`, `JsonLd`)
- **Tags page metadata + ItemList JSON-LD**: `src/app/(main)/Tags/[tags]/page.tsx` (`generateMetadata`, `JsonLd`)
- **Search pages set to noindex**: `src/app/(main)/search/[product_arg]/layout.tsx` (exports `metadata.robots.index = false`)
- **Account area noindex**: `src/app/(main)/account/layout.tsx` (exports `metadata` with `noIndex: true`)
- **Wishlist area noindex**: `src/app/(main)/wishlist/layout.tsx` (exports `metadata` with `noIndex: true`)

### Crawling / indexing endpoints

- **`robots.txt` rules + sitemap link**: `src/app/robots.ts`
- **`sitemap.xml` generation (static + DB-driven dynamic URLs)**: `src/app/sitemap.ts`

### Social sharing assets

- **Default OpenGraph image**: `src/app/opengraph-image.tsx` (served as `/opengraph-image`)

### Analytics / pixels (SEO-adjacent)

- **Google Analytics**: `src/components/analytics/GoogleAnalytics.tsx` (included in `src/app/(main)/layout.tsx`)
- **Meta Pixel**: `src/components/analytics/MetaPixel.tsx` (included in `src/app/(main)/layout.tsx`)
ghjomafa
