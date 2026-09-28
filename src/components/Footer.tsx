"use client";

import Link from "next/link";
import OptimizedImage from "@/components/OptimizedImage";
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from "@/components/icons/SocialIcons";

interface FooterProps {
  className?: string;
}

interface FooterLink {
  label: string;
  href: string;
}

interface SocialIcon {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const MailIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

const PhoneIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102c-.125-.501-.575-.852-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  </svg>
);

const LocationIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
    />
  </svg>
);

export default function Footer({ className = "" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  // Footer links data
  const quickLinks: FooterLink[] = [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Return Policy", href: "/returns" },
    { label: "Shipping Info", href: "/shipping" },
  ];

  const customerService: FooterLink[] = [
    { label: "Track Order", href: "https://www.rapidshyp.com/shipment-tracking" },
    { label: "Returns & Exchanges", href: "/returns" },
  ];

  const socialLinks: SocialIcon[] = [
    {
      name: "Facebook",
      href: "https://facebook.com",
      icon: <FacebookIcon />,
    },
    {
      name: "Instagram",
      href: "https://instagram.com",
      icon: <InstagramIcon />,
    },
    {
      name: "Twitter",
      href: "https://twitter.com",
      icon: <TwitterIcon />,
    },
    {
      name: "YouTube",
      href: "https://youtube.com",
      icon: <YoutubeIcon />,
    },
  ];

  return (
    <footer
      className={`bg-theme-cream border-t border-theme-sage/20 ${className}`}
    >
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand & Social */}
          <div className="space-y-5 flex flex-col items-center justify-center footer-logo-section">
            <Link href="/" className="inline-block">
              <OptimizedImage
                src="/logo/cropped-logo.svg"
                alt="THE JWEL | Beyond the Jewellery"
                width={100}
                height={100}
              />
              <span className="text-2xl md:text-3xl text-[#360000] font-josefin-sans tracking-tight">
                THE JWEL
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md">
              BEYOND THE JEWELLERY
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-theme-black transition-colors duration-200 p-2 hover:bg-theme-gray/10 rounded-full shadow-sm"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-6  ">
            <div className="flex flex-col items-start justify-start ">
              <h3 className="text-gray-900 font-semibold text-base mb-4 uppercase tracking-wide">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-theme-black hover:text-[#0A0239] transition-colors duration-200 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-gray-900 font-semibold text-base mb-4 uppercase tracking-wide">
                Customer Service
              </h3>
              <ul className="space-y-3">
                {customerService.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-theme-black hover:text-[#0A0239] transition-colors duration-200 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-gray-900 font-semibold text-base mb-2 uppercase tracking-wide">
              Contact Us
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <PhoneIcon className="w-5 h-5 text-theme-black flex-shrink-0 mt-0.5" />
                <a
                  href="tel:+"
                  className="text-sm text-theme-black hover:text-[#0A0239] transition-colors duration-200"
                >
                  +91 XXXXX XXXXX
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MailIcon className="w-5 h-5 text-theme-black flex-shrink-0 mt-0.5" />
                <a
                  href="mailto:support@example.com"
                  className="text-sm text-theme-black hover:text-[#0A0239] transition-colors duration-200 break-all"
                >
                  support@example.com
                </a>
              </div>
              <div className="flex items-start gap-3">
                <LocationIcon className="w-5 h-5 text-theme-black flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  123, Lorem Ipsum Street,
                  <br />
                  City Name, State, India 000000
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-theme-sage/15 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600 text-center md:text-left">
              © {currentYear} JWEL. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-sm text-theme-black hover:text-[#0A0239] transition-colors duration-200"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-theme-black hover:text-[#0A0239] transition-colors duration-200"
              >
                Terms
              </Link>
              <Link
                href="/cookies"
                className="text-sm text-black hover:text-blue-950 transition-colors duration-200"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
