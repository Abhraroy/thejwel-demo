import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Cookie Policy",
  description: "Understand how THE JWEL uses cookies to improve browsing and shopping experiences.",
  pathname: "/cookies",
});

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-theme-cream py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
        <p className="text-gray-700 leading-7">
          We use cookies for session continuity, performance analytics, and user experience improvements.
          You can manage cookie preferences in your browser settings.
        </p>
      </div>
    </main>
  );
}
