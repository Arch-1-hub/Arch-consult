import Link from "next/link";
import Logo from "./Logo";
import { site, primaryNav } from "@/lib/constants";

const legal = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const company = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Insights", href: "/blog" },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink-line bg-ink">
      <div className="container-arch grid gap-12 py-16 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ash">
            Business branding, strategy and digital transformation
            consultancy — built for founders who intend to be taken
            seriously.
          </p>
          <a
            href={`mailto:${site.email}`}
            className="mt-5 inline-block text-sm text-paper-white hover:text-gold"
          >
            {site.email}
          </a>
        </div>

        <FooterColumn title="Explore" links={primaryNav.slice(0, 4)} />
        <FooterColumn title="Company" links={company} />
        <FooterColumn title="Legal" links={legal} />
      </div>

      <div className="rule" />

      <div className="container-arch flex flex-col gap-3 py-6 text-xs text-ash sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Arch Consult. All rights reserved.</p>
        <p>Lagos · Remote worldwide</p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm text-paper-white">{title}</h3>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-ash transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
