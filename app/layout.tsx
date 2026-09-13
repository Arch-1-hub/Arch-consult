import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://archconsult.com"),
  title: {
    default: "Arch Consult — Build a Brand That Means Business.",
    template: "%s | Arch Consult",
  },
  description:
    "Arch Consult helps businesses turn ideas into strong brands, strategies and scalable businesses — through AI-powered tools and expert consultancy.",
  openGraph: {
    title: "Arch Consult — Build a Brand That Means Business.",
    description:
      "AI business consulting, brand strategy and digital transformation for businesses ready to scale.",
    siteName: "Arch Consult",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email: string } | null = null;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();
    user = supabaseUser?.email ? { email: supabaseUser.email } : null;
  }

  return (
    <html lang="en" className={`${fraunces.variable} ${plexSans.variable}`}>
      <body>
        <Navbar user={user} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
