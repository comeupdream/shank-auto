import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource-variable/inter";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./globals.css";
import ShankLogo from "@/components/ShankLogo";
import { SHOP, directionsHref, telHref } from "@/lib/shop-config";

export const metadata: Metadata = {
  // Absolute base for og:image and friends. Defaults to the Render static
  // site named in render.yaml; set NEXT_PUBLIC_SITE_URL when the domain
  // changes (build-time, so it must be present when `next build` runs).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://shank-auto.onrender.com"),
  title: `${SHOP.name} — Harrisonburg, VA`,
  description: SHOP.tagline,
  openGraph: {
    title: `${SHOP.name} — Harrisonburg, VA`,
    description: `${SHOP.tagline} Instant quotes, VIN decoding, and online drop-off scheduling.`,
    siteName: SHOP.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/book", label: "Schedule Drop-off" },
  { href: "/estimate", label: "Get an Estimate" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-chassis/95 text-white backdrop-blur">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4">
            <Link href="/" aria-label="Shank Auto Repair home" className="mr-2 py-1.5">
              <ShankLogo className="w-9" />
            </Link>
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={telHref()}
              className="ml-auto px-4 py-3 text-sm font-bold text-accent"
            >
              {SHOP.phone}
            </a>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

        <footer className="mt-8 border-t border-white/10 bg-chassis text-slate-300">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
            <div>
              <ShankLogo className="w-12" />
              <a
                href={`mailto:${SHOP.email}`}
                className="mt-3 block text-accent underline"
              >
                {SHOP.email}
              </a>
            </div>
            <p className="text-center text-slate-400">{SHOP.blurb}</p>
            <address className="not-italic sm:text-right">
              <strong className="block text-white">{SHOP.name}</strong>
              {SHOP.address}
              <br />
              {SHOP.cityLine}
              <br />
              <a href={directionsHref()} className="text-accent underline">
                Directions
              </a>
            </address>
          </div>
        </footer>
      </body>
    </html>
  );
}
