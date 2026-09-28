import type { Metadata } from "next";

const DEFAULT_SITE_URL = "https://thejwel.in";
const SITE_NAME = "THE JWEL";

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export function getBaseUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    DEFAULT_SITE_URL;

  return trimTrailingSlash(raw);
}

export function toAbsoluteUrl(pathname = "/") {
  if (
    pathname.startsWith("http://") ||
    pathname.startsWith("https://")
  ) {
    return pathname;
  }

  const baseUrl = getBaseUrl();
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${baseUrl}${path}`;
}

type BuildMetadataInput = {
  title: string;
  description: string;
  pathname?: string;
  imagePath?: string;
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  pathname = "/",
  imagePath = "/faviconFolder/android-chrome-512x512.png",
  noIndex = false,
}: BuildMetadataInput): Metadata {
  const canonical = toAbsoluteUrl(pathname);
  const image = toAbsoluteUrl(imagePath);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export { SITE_NAME };
