"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Overview", href: "/dashboard" },
  { label: "Bookings", href: "/dashboard/bookings" },
  { label: "Reports", href: "/dashboard/reports" },
  { label: "Projects", href: "/dashboard/projects" },
  { label: "Payments", href: "/dashboard/payments" },
  { label: "Documents", href: "/dashboard/documents" },
  { label: "Messages", href: "/dashboard/messages" },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="-mx-6 flex gap-1 overflow-x-auto border-b border-ink-line px-6 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const active =
          tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
              active
                ? "border-gold text-paper-white"
                : "border-transparent text-ash hover:text-paper-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
