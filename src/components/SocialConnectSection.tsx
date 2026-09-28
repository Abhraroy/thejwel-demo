import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";

const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com",
    Icon: FaFacebookF,
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    Icon: FaInstagram,
  },
  {
    name: "Twitter",
    href: "https://twitter.com",
    Icon: FaXTwitter,
  },
  {
    name: "Whatsapp",
    href: "https://wa.me/",
    Icon: FaWhatsapp,
  }
];

export default function SocialConnectSection() {
  return (
    <section
      id="social-connect"
      aria-labelledby="social-connect-heading"
      className="hidden lg:block bg-theme-cream/80 border-y border-theme-sage/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-3 text-center md:text-left">
            <h2
              id="social-connect-heading"
              className="text-2xl md:text-3xl font-josefin-sans tracking-tight text-theme-black"
            >
              Connect with THE JWEL
            </h2>
            <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto md:mx-0 leading-relaxed">
              Follow us on social media for new jewellery collections, styling inspiration,
              behind-the-scenes stories, and exclusive offers crafted for modern elegance.
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-4">
            {socialLinks.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit THE JWEL on ${name}`}
                title={`Visit THE JWEL on ${name}`}
                className="group flex flex-col items-center justify-center px-4 py-3 rounded-full border border-theme-sage/40 bg-white/80 text-theme-black shadow-sm hover:bg-theme-cream hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-sage/60"
              >
                <Icon className="w-6 h-6 md:w-7 md:h-7" />
                <span className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-700 group-hover:text-[#0A0239]">
                  {name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

