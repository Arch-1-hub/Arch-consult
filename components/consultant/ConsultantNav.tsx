"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/consultant", label: "Overview" },
  { href: "/consultant/bookings", label: "Bookings" },
  { href: "/consultant/documents", label: "Documents" },
  { href: "/consultant/messages", label: "Messages" },
  { href: "/consultant/projects", label: "Projects" },
];

export default function ConsultantNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Consultant sections"
      className="mt-6 flex gap-2 overflow-x-auto border-b border-ink-line pb-3"
    >
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm transition-colors ${
              active
                ? "bg-gold text-ink"
                : "text-ash hover:bg-ink-soft hover:text-paper-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
