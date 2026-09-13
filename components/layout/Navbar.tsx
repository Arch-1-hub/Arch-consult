"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { primaryNav } from "@/lib/constants";
import { signOutAction } from "@/lib/actions/auth";

export default function Navbar({ user }: { user: { email: string } | null }) {
  const [open, setOpen] = useState(false);

  // Close the mobile menu on route change / escape, keep body scrollable state honest
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-line bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80 print:hidden">
      <div className="container-arch flex h-16 items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-8 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ash transition-colors duration-200 ease-arch hover:text-paper-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                href="/account"
                className="text-sm text-paper-white transition-colors hover:text-gold"
              >
                Account
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm text-ash transition-colors hover:text-gold"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-paper-white transition-colors hover:text-gold"
            >
              Log in
            </Link>
          )}
          <Link
            href="/book-consultation"
            className="bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-colors duration-200 ease-arch hover:bg-gold-light"
          >
            Book a Consultation
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center p-2 text-paper-white lg:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ink-line bg-ink lg:hidden">
          <nav className="container-arch flex flex-col gap-1 py-4">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base text-paper-white border-b border-ink-line last:border-none"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="border border-ink-line px-5 py-3 text-center text-sm text-paper-white"
                  >
                    Account
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full py-3 text-center text-sm text-ash"
                    >
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="border border-ink-line px-5 py-3 text-center text-sm text-paper-white"
                >
                  Log in
                </Link>
              )}
              <Link
                href="/book-consultation"
                onClick={() => setOpen(false)}
                className="bg-gold px-5 py-3 text-center text-sm font-medium text-ink"
              >
                Book a Consultation
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
