import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import { CORE_CHARGES, CORE_POLICY } from "@/lib/core-charges";
import { CLASS_LABOR_MULTIPLIER, formatPrice, servicesByCategory } from "@/lib/services";
import { VEHICLE_CLASS_LABELS, VEHICLE_CLASSES } from "@/lib/vehicle-catalog";

export const metadata = { title: "Services — Shank Auto Repair" };

export default function ServicesPage() {
  return (
    <div className="space-y-10">
      <SectionHeader
        as="h1"
        kicker="The menu"
        title="Services"
        blurb="Flat-rate maintenance is priced below. Repairs are quoted after we look the vehicle over — we call you with a number before any work starts."
      />

      {servicesByCategory().map(({ category, services }) => (
        <section key={category}>
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-accent-dark">
            {category}
          </h2>
          <ul className="card mt-3 divide-y divide-slate-100 overflow-hidden">
            {services.map((s) => (
              <li key={s.id} className="flex flex-wrap items-baseline gap-2 p-4 transition-colors hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-600">{s.description}</p>
                </div>
                <div className="text-right text-sm">
                  {s.estimateOnly ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                      Estimate
                    </span>
                  ) : (
                    <span className="font-display text-xl font-semibold tabular-nums text-slate-900">
                      {formatPrice(s.priceCents)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900">Core charge program</h2>
        <p className="mt-1 text-sm text-slate-600">{CORE_POLICY}</p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-1 font-semibold">Part</th>
              <th className="pb-1 text-right font-semibold">Typical deposit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CORE_CHARGES.map((c) => (
              <tr key={c.id}>
                <td className="py-1.5 text-slate-700">{c.part}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-900">
                  {formatPrice(c.depositCents)}
                  <span className="ml-1 text-xs text-slate-500">(refundable)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900">A note on pricing</h2>
        <p className="mt-1 text-sm text-slate-600">
          Listed prices are for a car. Larger vehicles take longer on the lift,
          so labor scales with the vehicle:
        </p>
        <ul className="mt-2 text-sm text-slate-700">
          {VEHICLE_CLASSES.map((c) => (
            <li key={c}>
              {VEHICLE_CLASS_LABELS[c]} — ×{CLASS_LABOR_MULTIPLIER[c].toFixed(2)}
            </li>
          ))}
        </ul>
        <Link
          href="/estimate"
          className="mt-4 inline-block rounded-md bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-700"
        >
          Get a price for your vehicle
        </Link>
      </section>
    </div>
  );
}
