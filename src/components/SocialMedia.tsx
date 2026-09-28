"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaPinterestP,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

type PlatformId =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "facebook"
  | "pinterest"
  | "whatsapp"
  | "x";

type Platform = {
  id: PlatformId;
  name: string;
  handle?: string;
  href: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string; // tailwind color (used for small UI accents)
  glow: string; // css rgba string for background glow
};

function safeCopy(text: string) {
  if (!text) return Promise.resolve();
  if (typeof navigator === "undefined") return Promise.resolve();
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);

  // Fallback (older browsers)
  return new Promise<void>((resolve) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    resolve();
  });
}

function PlatformButton({
  platform,
  active,
  onClick,
}: {
  platform: Platform;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = platform.Icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
        "transition-all duration-200",
        "ring-1 ring-black/5",
        active
          ? "bg-[#360000] text-white shadow-lg shadow-black/10"
          : "bg-white text-[#360000] hover:bg-[#360000]/5",
      ].join(" ")}
      aria-pressed={active}
    >
      <Icon className="h-4 w-4" />
      <span className="whitespace-nowrap">{platform.name}</span>
      {active && (
        <motion.span
          layoutId="activePill"
          className="absolute inset-0 rounded-full ring-1 ring-white/10"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
    </button>
  );
}

export default function SocialMedia() {
  const shouldReduceMotion = useReducedMotion();

  const platforms = useMemo<Platform[]>(
    () => [
      {
        id: "instagram",
        name: "Instagram",
        handle: "@yourbrand",
        href: "https://instagram.com",
        description: "Daily styling, new drops, and customer spotlights.",
        Icon: FaInstagram,
        accent: "text-pink-600",
        glow: "rgba(236, 72, 153, 0.28)",
      },
      {
        id: "youtube",
        name: "YouTube",
        handle: "@yourbrand",
        href: "https://youtube.com",
        description: "Craft stories, behind-the-scenes, and lookbooks.",
        Icon: FaYoutube,
        accent: "text-red-600",
        glow: "rgba(239, 68, 68, 0.22)",
      },
      {
        id: "tiktok",
        name: "TikTok",
        handle: "@yourbrand",
        href: "https://tiktok.com",
        description: "Trends, quick try-ons, and studio moments.",
        Icon: FaTiktok,
        accent: "text-slate-900",
        glow: "rgba(2, 6, 23, 0.20)",
      },
      {
        id: "whatsapp",
        name: "WhatsApp",
        handle: "+91 XXXXX XXXXX",
        href: "https://wa.me/",
        description: "Instant support, order help, and custom requests.",
        Icon: FaWhatsapp,
        accent: "text-emerald-600",
        glow: "rgba(16, 185, 129, 0.22)",
      },
      {
        id: "facebook",
        name: "Facebook",
        handle: "/yourbrand",
        href: "https://facebook.com",
        description: "Community updates, offers, and announcements.",
        Icon: FaFacebookF,
        accent: "text-blue-600",
        glow: "rgba(37, 99, 235, 0.22)",
      },
      {
        id: "pinterest",
        name: "Pinterest",
        handle: "yourbrand",
        href: "https://pinterest.com",
        description: "Moodboards and inspiration you can save for later.",
        Icon: FaPinterestP,
        accent: "text-rose-600",
        glow: "rgba(244, 63, 94, 0.20)",
      },
      {
        id: "x",
        name: "X",
        handle: "@yourbrand",
        href: "https://x.com",
        description: "Drops, news, and quick announcements.",
        Icon: FaXTwitter,
        accent: "text-slate-900",
        glow: "rgba(15, 23, 42, 0.18)",
      },
    ],
    []
  );

  const [activeId, setActiveId] = useState<PlatformId>("instagram");
  const [copiedId, setCopiedId] = useState<PlatformId | null>(null);

  const active = platforms.find((p) => p.id === activeId) ?? platforms[0];
  const ActiveIcon = active.Icon;

  const onCopy = async () => {
    await safeCopy(active.handle ?? active.href);
    setCopiedId(active.id);
    window.setTimeout(() => setCopiedId(null), 1200);
  };

  return (
    <section className="w-full py-14 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#fafafa] overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Animated ambient background */}
        <div className="relative">
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full blur-3xl bg-[#360000]/10" />

          {/* Header */}
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#360000] ring-1 ring-black/5 shadow-sm">
              Social connectivity
              <span className="h-1 w-1 rounded-full bg-[#360000]/60" />
              Stay close
            </p>
            <h2 className="mt-5 text-3xl md:text-5xl text-[#360000] font-josefin-sans">
              Connect with us everywhere
            </h2>
            <p className="mt-4 text-sm md:text-base text-[#360000]/70 max-w-2xl mx-auto">
              Follow, watch, save, or chat — pick a platform and we’ll take you
              there. Tap to switch, copy handles instantly, and open in one
              click.
            </p>
          </div>

          {/* Content */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left: Switcher + quick actions */}
            <div className="lg:col-span-6">
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {platforms.map((p) => (
                  <PlatformButton
                    key={p.id}
                    platform={p}
                    active={p.id === active.id}
                    onClick={() => setActiveId(p.id)}
                  />
                ))}
              </div>

              <div className="mt-6 rounded-3xl bg-white ring-1 ring-black/5 shadow-sm p-5 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <motion.div
                      className={[
                        "h-12 w-12 rounded-2xl grid place-items-center ring-1 ring-black/5",
                        "bg-[#fafafa]",
                      ].join(" ")}
                      animate={shouldReduceMotion ? {} : { rotate: [0, -2, 0] }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { duration: 2.8, repeat: Infinity, ease: "easeInOut" }
                      }
                    >
                      <ActiveIcon className={`h-6 w-6 ${active.accent}`} />
                    </motion.div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#360000]/70">
                        Selected
                      </p>
                      <h3 className="mt-1 text-2xl md:text-3xl font-semibold text-[#360000]">
                        {active.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {active.description}
                      </p>
                      {active.handle && (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#fafafa] px-3 py-1 text-sm font-semibold text-[#360000] ring-1 ring-black/5">
                          <span className="opacity-70">Handle:</span>
                          <span>{active.handle}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end gap-2">
                    <p className="text-xs text-gray-500">Quick actions</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onCopy}
                        className="inline-flex items-center justify-center rounded-full bg-[#360000]/5 px-4 py-2 text-sm font-semibold text-[#360000] ring-1 ring-black/5 hover:bg-[#360000]/10 transition"
                      >
                        {copiedId === active.id ? "Copied" : "Copy"}
                      </button>
                      <a
                        href={active.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full bg-[#360000] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition"
                      >
                        Open ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* Mobile CTAs */}
                <div className="mt-6 flex md:hidden gap-3">
                  <button
                    type="button"
                    onClick={onCopy}
                    className="flex-1 inline-flex items-center justify-center rounded-full bg-[#360000]/5 px-4 py-2 text-sm font-semibold text-[#360000] ring-1 ring-black/5 hover:bg-[#360000]/10 transition"
                  >
                    {copiedId === active.id ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={active.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center rounded-full bg-[#360000] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition"
                  >
                    Open ↗
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Animated “hub” card */}
            <div className="lg:col-span-6">
              <motion.div
                className="relative overflow-hidden rounded-3xl ring-1 ring-black/5 bg-white shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(54,0,0,0.08),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(0,0,0,0.06),transparent_40%)]" />

                <div className="relative p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#360000]/70">
                        Live preview
                      </p>
                      <h3 className="mt-1 text-xl md:text-2xl font-semibold text-[#360000]">
                        {active.name} hub
                      </h3>
                    </div>
                    <motion.div
                      className="h-12 w-12 rounded-2xl grid place-items-center ring-1 ring-black/5 bg-[#fafafa]"
                      animate={
                        shouldReduceMotion ? {} : { y: [0, -6, 0], rotate: [0, 1, 0] }
                      }
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
                      }
                    >
                      <ActiveIcon className={`h-6 w-6 ${active.accent}`} />
                    </motion.div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active.id}
                      className="mt-6"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-[#fafafa] ring-1 ring-black/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            What you’ll find
                          </p>
                          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                            {active.description}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-[#fafafa] ring-1 ring-black/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Best for
                          </p>
                          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                            {active.id === "whatsapp"
                              ? "Quick support, custom requests, order help."
                              : active.id === "youtube"
                              ? "Long-form videos, craftsmanship, lookbooks."
                              : active.id === "pinterest"
                              ? "Saving ideas and building moodboards."
                              : "Discovering new drops and styling inspiration."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <a
                          href={active.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-full bg-[#360000] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/15 transition"
                        >
                          Connect on {active.name} ↗
                        </a>
                        <button
                          type="button"
                          onClick={onCopy}
                          className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#360000] ring-1 ring-black/5 hover:bg-[#360000]/5 transition"
                        >
                          {copiedId === active.id
                            ? "Copied!"
                            : `Copy ${active.handle ? "handle" : "link"}`}
                        </button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              <p className="mt-4 text-xs text-center lg:text-left text-[#360000]/55">
                Tip: Tap a platform to switch. Hover for micro-interactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
