import Link from "next/link";
import BookingScheduler from "@/components/BookingScheduler";
import HomeTools from "@/components/HomeTools";
import SectionHeader from "@/components/SectionHeader";
import ShankLogo from "@/components/ShankLogo";
import { SERVICES, servicesByCategory } from "@/lib/services";
import { SHOP, directionsHref, hoursForDisplay, telHref } from "@/lib/shop-config";

/** Faint blueprint grid laid over the dark hero. */
const GRID_BG = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), " +
    "linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
} as const;

export default function HomePage() {
  return (
    <div className="space-y-14">
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-chassis text-white shadow-card">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06]" style={GRID_BG} />
        <div aria-hidden className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-navy-500/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-navy-400/20 blur-3xl" />

        <div className="relative flex flex-col items-start gap-8 p-8 sm:p-10 lg:flex-row lg:items-center lg:gap-12">
          <ShankLogo animate className="w-36 shrink-0 sm:w-44" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent">
              {SHOP.address} · {SHOP.cityLine}
            </p>
            <h1 className="mt-2 font-display text-5xl font-semibold uppercase leading-none tracking-wide sm:text-7xl">
              {SHOP.name}
            </h1>
            <p className="mt-3 max-w-xl text-lg text-slate-300">
              {SHOP.tagline} {SHOP.blurb}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#book"
                className="rounded-md bg-white px-6 py-3 text-sm font-bold text-chassis transition-colors hover:bg-accent"
              >
                Book a drop-off
              </a>
              <a
                href="#price"
                className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Price a job
              </a>
              <a
                href={telHref()}
                className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Call {SHOP.phone}
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-200">
              {["Instant flat-rate quotes", "VIN decode built in", "Online drop-off booking"].map(
                (chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5"
                  >
                    {chip}
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- Price it, live */}
      <section id="price" className="scroll-mt-24">
        <SectionHeader
          kicker="Instant pricing"
          title="Price your job right now"
          blurb="Decode your VIN or pick year, make, and model — flat-rate work prices itself on the spot, sized to your vehicle."
        />
        <div className="mt-6">
          <HomeTools />
        </div>
      </section>

      {/* ------------------------------------------------------- Booking */}
      <section id="book" className="scroll-mt-24">
        <SectionHeader
          kicker="Scheduling"
          title="Book a drop-off"
          blurb="Live openings from the shop schedule — long jobs hold the time they need, and a taken slot never shows."
        />
        <div className="card mt-6 p-5 sm:p-8">
          <BookingScheduler services={SERVICES} />
        </div>
      </section>

      {/* ------------------------------------------------- Service menu */}
      <section>
        <SectionHeader
          kicker="Services"
          title="What we do"
          blurb="Maintenance at posted flat rates; repair work quoted after we look it over — with a number before any work starts."
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicesByCategory().map(({ category, services }) => (
            <div
              key={category}
              className="card p-5 transition-transform hover:-translate-y-0.5"
            >
              <h3 className="text-sm font-bold uppercase tracking-wide text-accent-dark">
                {category}
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {services.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Link
          href="/services"
          className="mt-6 inline-block rounded-md bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
        >
          Full menu &amp; pricing
        </Link>
      </section>

      {/* ------------------------------------------------------- Visit us */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-accent-dark">Hours</h3>
          <dl className="mt-3 space-y-1.5 text-sm">
            {hoursForDisplay().map(({ day, hours }) => (
              <div key={day} className="flex justify-between gap-4">
                <dt className="text-slate-600">{day}</dt>
                <dd className="tabular-nums font-medium text-slate-900">{hours}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-accent-dark">Find us</h3>
          <address className="mt-3 text-sm not-italic leading-relaxed text-slate-700">
            <strong className="text-slate-900">{SHOP.name}</strong>
            <br />
            {SHOP.address}
            <br />
            {SHOP.cityLine}
          </address>
          <a
            href={directionsHref()}
            className="mt-3 inline-block text-sm font-semibold text-navy-700 underline"
          >
            Get directions
          </a>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-chassis p-5 text-white shadow-card">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-accent">Talk to the shop</h3>
            <p className="mt-3 text-sm text-slate-300">
              Quickest answers are on the phone — or send what the vehicle is
              doing and we&apos;ll call you back.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={telHref()}
              className="rounded-md bg-white px-5 py-2.5 text-sm font-bold text-chassis transition-colors hover:bg-accent"
            >
              {SHOP.phone}
            </a>
            <Link
              href="/contact"
              className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

