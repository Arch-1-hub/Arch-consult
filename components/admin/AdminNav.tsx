"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Admin sections"
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
