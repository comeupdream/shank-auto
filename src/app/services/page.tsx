import Link from "next/link";
import { CLASS_LABOR_MULTIPLIER, formatPrice, servicesByCategory } from "@/lib/services";
import { VEHICLE_CLASS_LABELS, VEHICLE_CLASSES } from "@/lib/vehicle-catalog";

export const metadata = { title: "Services — Shank Auto Repair" };

export default function ServicesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Services</h1>
        <p className="mt-2 text-slate-600">
          Flat-rate maintenance is priced below. Repairs are quoted after we look
          the vehicle over — we call you with a number before any work starts.
        </p>
      </div>

      {servicesByCategory().map(({ category, services }) => (
        <section key={category}>
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent-dark">
            {category}
          </h2>
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg bg-white shadow-sm">
            {services.map((s) => (
              <li key={s.id} className="flex flex-wrap gap-2 p-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-600">{s.description}</p>
                </div>
                <div className="text-right text-sm">
                  {s.estimateOnly ? (
                    <span className="text-slate-500">Estimate</span>
                  ) : (
                    <span className="font-semibold text-slate-900">
                      {formatPrice(s.priceCents)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-lg bg-white p-5 shadow-sm">
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
          className="mt-4 inline-block rounded-md bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          Get a price for your vehicle
        </Link>
      </section>
    </div>
  );
}
