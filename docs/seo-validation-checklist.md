# SEO Validation Checklist

## Pre-release checks
- Verify metadata on core pages: `/`, `/product/[id]`, `/category/[slug]`, `/style/[slug]`, `/occasion/[slug]`, `/Tags/[tag]`.
- Validate canonical tags and ensure they resolve with `200` responses.
- Validate `robots.txt` and confirm sensitive routes are blocked (`/account`, `/wishlist`, `/redirect`, `/api`).
- Validate `sitemap.xml` generation and URL correctness.
- Run Rich Results Test on:
  - product pages (`Product`, `BreadcrumbList`)
  - listing pages (`ItemList`)
  - home (`Organization`, `WebSite`)

## Performance and quality checks
- Run Lighthouse on home + key template pages and record:
  - SEO score
  - LCP
  - CLS
  - INP/TBT proxy
- Check image loading behavior in production mode (`next build` + `next start`).

## Post-release monitoring
- Google Search Console:
  - Index coverage (valid, excluded, error)
  - Crawl stats
  - URL inspection for 3-5 representative pages
  - Rich result enhancement reports
- Google Analytics/Search Console:
  - impressions
  - average position
  - organic CTR
  - landing-page sessions by page template

## 30-day success metrics
- More valid indexed URLs for product/listing pages.
- Fewer excluded URLs due to duplicate/no-canonical signals.
- Improved organic CTR on product/category pages.
- Stable or improved Core Web Vitals on SEO landing templates
