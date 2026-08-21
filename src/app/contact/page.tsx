import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import { SHOP, directionsHref, hoursForDisplay, telHref } from "@/lib/shop-config";

export const metadata = { title: "Contact — Shank Auto Repair" };

export default function ContactPage() {
  return (
    <div className="space-y-10">
      <SectionHeader
        as="h1"
        kicker="Talk to us"
        title="Contact"
        blurb="Quickest answers are on the phone — email works too, and the schedule is always open online."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent-dark">Call</h2>
          <p className="mt-2 text-sm text-slate-600">
            During shop hours below. Tell us what the vehicle is doing — we can
            usually tell you what happens next on the spot.
          </p>
          <a
            href={telHref()}
            className="mt-4 inline-block rounded-md bg-navy-600 px-5 py-3 text-center text-lg font-bold tabular-nums text-white transition-colors hover:bg-navy-700"
          >
            {SHOP.phone}
          </a>
        </div>

        <div className="card flex flex-col p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent-dark">Email</h2>
          <p className="mt-2 text-sm text-slate-600">
            Good for photos, paperwork, and anything that isn&apos;t urgent —
            we&apos;ll get back to you.
          </p>
          <a
            href={`mailto:${SHOP.email}`}
            className="mt-4 inline-block break-all rounded-md border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-navy-700 transition-colors hover:border-navy-400 hover:bg-navy-50"
          >
            {SHOP.email}
          </a>
        </div>

        <div className="card flex flex-col p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent-dark">Visit</h2>
          <address className="mt-2 text-sm not-italic leading-relaxed text-slate-700">
            <strong className="text-slate-900">{SHOP.name}</strong>
            <br />
            {SHOP.address}
            <br />
            {SHOP.cityLine}
          </address>
          <a
            href={directionsHref()}
            className="mt-4 inline-block rounded-md border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-navy-700 transition-colors hover:border-navy-400 hover:bg-navy-50"
          >
            Get directions
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent-dark">Hours</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {hoursForDisplay().map(({ day, hours }) => (
              <div key={day} className="flex justify-between gap-4">
                <dt className="text-slate-600">{day}</dt>
                <dd className="tabular-nums font-medium text-slate-900">{hours}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card flex flex-col justify-between gap-6 !bg-chassis p-6 text-white sm:p-8 lg:col-span-2">
          <div>
            <h2 className="font-display text-3xl font-semibold uppercase tracking-wide">
              Skip the phone tag
            </h2>
            <p className="mt-1 max-w-md text-slate-300">
              The schedule is live on the site — pick an open drop-off time, or
              price the job first and decide from there.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/book"
              className="rounded-md bg-white px-6 py-3 text-sm font-bold text-chassis transition-colors hover:bg-accent"
            >
              Book a drop-off
            </Link>
            <Link
              href="/estimate"
              className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Get an estimate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
