import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SHOP, directionsHref, telHref } from "@/lib/shop-config";

export const metadata: Metadata = {
  title: `${SHOP.name} — Harrisonburg, VA`,
  description: SHOP.tagline,
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
        <header className="bg-chassis text-white">
          <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-3 text-sm hover:bg-accent hover:text-chassis"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={telHref()}
              className="ml-auto px-4 py-3 text-sm font-semibold text-accent"
            >
              {SHOP.phone}
            </a>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

        <footer className="mt-8 border-t border-slate-300 bg-white">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
            <div>
              <a href={`mailto:${SHOP.email}`} className="text-sky-700 underline">
                {SHOP.email}
              </a>
            </div>
            <p className="text-center text-slate-600">{SHOP.blurb}</p>
            <address className="not-italic sm:text-right">
              <strong className="block text-slate-900">{SHOP.name}</strong>
              {SHOP.address}
              <br />
              {SHOP.cityLine}
              <br />
              <a href={directionsHref()} className="text-sky-700 underline">
                Directions
              </a>
            </address>
          </div>
        </footer>
      </body>
    </html>
  );
}
