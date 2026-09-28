import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Authentication Error",
  description: "Authentication error page",
  pathname: "/error",
  noIndex: true,
});

export default function AuthErrorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
