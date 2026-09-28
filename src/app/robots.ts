import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/product/", "/category/", "/style/", "/occasion/", "/Tags/"],
        disallow: [
          "/account",
          "/wishlist",
          "/redirect",
          "/api",
          "/_next",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
