import Link from "next/link";
import ShankLogo from "@/components/ShankLogo";
import { SHOP, hoursForDisplay, telHref } from "@/lib/shop-config";
import { servicesByCategory } from "@/lib/services";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-lg bg-white p-8 shadow-card">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <ShankLogo animate className="w-36 shrink-0 sm:w-44" />
          <div>
            <h1 className="font-display text-5xl font-semibold uppercase tracking-wide text-slate-900 sm:text-6xl">
              {SHOP.name}
            </h1>
            <p className="mt-2 text-lg text-slate-600">{SHOP.tagline}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Welcome to {SHOP.name}.
            </h2>
            <p className="mt-2 text-slate-600">
              Our goal is to keep your car worry free. {SHOP.blurb}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/estimate"
                className="rounded-md bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-700"
              >
                Get an estimate
              </Link>
              <a
                href={telHref()}
                className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Call {SHOP.phone}
              </a>
            </div>
          </div>

          <dl className="rounded-md border border-slate-200 p-4 text-sm">
            <dt className="font-semibold text-slate-900">Shop hours</dt>
            <dd className="mt-2 space-y-1">
              {hoursForDisplay().map(({ day, hours }) => (
                <div key={day} className="flex justify-between gap-4">
                  <span className="text-slate-600">{day}</span>
                  <span className="tabular-nums text-slate-900">{hours}</span>
                </div>
              ))}
            </dd>
          </dl>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl font-semibold uppercase tracking-wide text-slate-900">What we do</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicesByCategory().map(({ category, services }) => (
            <div key={category} className="rounded-lg bg-white p-5 shadow-card">
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
      </section>
    </div>
  );
}
