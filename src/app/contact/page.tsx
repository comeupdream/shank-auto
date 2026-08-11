import { SHOP, directionsHref, hoursForDisplay, telHref } from "@/lib/shop-config";

export const metadata = { title: "Contact — Shank Auto Repair" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Contact</h1>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-slate-900">Phone</dt>
            <dd>
              <a href={telHref()} className="text-sky-700 underline">
                {SHOP.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Email</dt>
            <dd>
              <a href={`mailto:${SHOP.email}`} className="text-sky-700 underline">
                {SHOP.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Shop</dt>
            <dd className="not-italic">
              {SHOP.address}
              <br />
              {SHOP.cityLine}
              <br />
              <a href={directionsHref()} className="text-sky-700 underline">
                Get directions
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Hours</dt>
            <dd className="mt-1 space-y-1">
              {hoursForDisplay().map(({ day, hours }) => (
                <div key={day} className="flex justify-between gap-4">
                  <span className="text-slate-600">{day}</span>
                  <span className="tabular-nums">{hours}</span>
                </div>
              ))}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
