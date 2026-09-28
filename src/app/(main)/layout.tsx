import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Sacramento,
  Satisfy,
  Sevillana,
  Playfair_Display,
  Josefin_Sans,
  Adamina,
  Open_Sans,
} from "next/font/google";
import "./globals.css";
import ParentNavbar from "@/components/NavbarUI/ParentNavbar";
import HomePageMarquee from "@/components/HomePageMarquee";
import CartBootstrapper from "@/components/CartBootstrapper";
import SocialConnectSection from "@/components/SocialConnectSection";
import Footer from "@/components/Footer";
import PaymentGatewayWrapper from "@/components/Payment/PaymentGatewayWrapper";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { getBaseUrl, toAbsoluteUrl } from "@/lib/seo/metadata";
import JsonLd from "@/components/seo/JsonLd";
import MetaPixel from "@/components/analytics/MetaPixel";
import AttributionTracker from "@/components/analytics/AttributionTracker";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import RoutePerfTracker from "@/components/analytics/RoutePerfTracker";
import ScrollToTopOnNavigate from "@/components/ScrollToTopOnNavigate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sacramento = Sacramento({
  variable: "--font-sacramento",
  subsets: ["latin"],
  weight: ["400"],
});

const satisfy = Satisfy({
  variable: "--font-satisfy",
  subsets: ["latin"],
  weight: ["400"],
});
const sevillana = Sevillana({
  variable: "--font-sevillana",
  subsets: ["latin"],
  weight: ["400"],
});
const adamina = Adamina({
  variable: "--font-adamina",
  subsets: ["latin"],
  weight: ["400"],
});
const playfair_display = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400"],
});

const josefin_sans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
  weight: ["700", "100", "200", "300", "400", "500", "600"],
});

const open_sans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: "The Jwel: Every Single Detail Shines Brightly",
    template: "%s | The JWEL",
  },
  description: "Welcome to The Jwel:Every Single Detail Shines Brightly – a world of prestige, beauty, and elegance designed exclusively for the discerning few.Shop premium American Diamond and traditional Temple Jewellery at TheJWEL, Kolkata. Explore elegant bangles, rings, necklaces & more – crafted for modern and timeless beauty.",
  verification: {
    google: "oib3Fjzpke7bd7r6asp8sAMS_wujZU-F2FqVA0Ap6yI",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "The Jwel: Every Single Detail Shines Brightly",
    description:
      "Welcome to The Jwel:Every Single Detail Shines Brightly – a world of prestige, beauty, and elegance designed exclusively for the discerning few.Shop premium American Diamond and traditional Temple Jewellery at TheJWEL, Kolkata. Explore elegant bangles, rings, necklaces & more – crafted for modern and timeless beauty.",
    url: toAbsoluteUrl("/"),
    siteName: "THE JWEL",
    type: "website",
    images: [
      {
        url: toAbsoluteUrl("/faviconFolder/android-chrome-512x512.png"),
        width: 1200,
        height: 630,
        alt: "THE JWEL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Jwel: Every Single Detail Shines Brightly",
    description:
      "Welcome to The Jwel:Every Single Detail Shines Brightly – a world of prestige, beauty, and elegance designed exclusively for the discerning few.Shop premium American Diamond and traditional Temple Jewellery at TheJWEL, Kolkata. Explore elegant bangles, rings, necklaces & more – crafted for modern and timeless beauty.",
    images: [toAbsoluteUrl("/faviconFolder/android-chrome-512x512.png")],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: "/faviconFolder/favicon.ico",
      },
      {
        url: "/faviconFolder/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/faviconFolder/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/faviconFolder/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/faviconFolder/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },

    ],
    apple: [
      {
        url: "/faviconFolder/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${sacramento.variable} ${satisfy.variable} ${sevillana.variable} ${playfair_display.variable} ${josefin_sans.variable} ${adamina.variable} ${open_sans.variable} antialiased`}
      >
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "THE JWEL",
            url: getBaseUrl(),
            logo: toAbsoluteUrl("/logo/cropped-logo.svg"),
            email: "support@example.com",
            telephone: "+91-XXXXXXXXXX",
            sameAs: [
              "https://facebook.com",
              "https://instagram.com",
              "https://twitter.com",
              "https://youtube.com",
            ],
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "THE JWEL",
            url: getBaseUrl(),
            potentialAction: {
              "@type": "SearchAction",
              target: `${getBaseUrl()}/search/{search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <GoogleAnalytics />
        <MetaPixel />
        <AttributionTracker />
        <RoutePerfTracker />
        <HomePageMarquee />
        <ParentNavbar />
        <CartBootstrapper />
        {children}
        <SocialConnectSection />
        <Footer />
        <PaymentGatewayWrapper />
        <ToastContainer
          position="bottom-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          theme="dark"
        />
        <SpeedInsights />
        <ScrollToTopOnNavigate />
      </body>
    </html>
  );
}
