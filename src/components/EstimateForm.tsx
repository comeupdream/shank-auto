"use client";

/**
 * Estimate request: identify the vehicle, say what's wrong, leave contact
 * details.
 *
 * Deliberately not a booking form. A detail shop can sell a slot from a web
 * form because the job is known up front; a repair shop mostly can't, so this
 * collects enough for the shop to call back with a real number. Flat-rate
 * maintenance items still show a live price, since those we *can* quote.
 */

import { useState } from "react";
import VehiclePicker, { EMPTY_VEHICLE, type Vehicle } from "./VehiclePicker";
import { coreChargesForService } from "@/lib/core-charges";
import { demoRef } from "@/lib/demo-store";
import {
  CLASS_LABOR_MULTIPLIER,
  type Service,
  formatPrice,
  priceFor,
} from "@/lib/services";
import { SHOP, telHref } from "@/lib/shop-config";
import { STATIC_DEMO } from "@/lib/static-demo";
import { VEHICLE_CLASS_LABELS } from "@/lib/vehicle-catalog";
import { fitmentSummary, matchFitment } from "@/lib/xat-fitment";

type Props = { services: Service[] };

export default function EstimateForm({ services }: Props) {
  const [vehicle, setVehicle] = useState<Vehicle>(EMPTY_VEHICLE);
  const [serviceId, setServiceId] = useState("");
  const [concern, setConcern] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  /** Reference shown on the mocked demo estimate. */
  const [quoteRef, setQuoteRef] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const price = service ? priceFor(service, vehicle.vehicleClass) : null;
  const coreParts = service ? coreChargesForService(service.id) : [];

  const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please enter your name.");
    if (!phone.trim() && !email.trim()) {
      return setError("Please leave a phone number or an email so we can reach you.");
    }
    if (!serviceId) return setError("Please choose what you need.");

    if (STATIC_DEMO) {
      // Static preview — no server to send this to, so render the estimate
      // the shop would write up, right here.
      setQuoteRef(demoRef());
      setSent(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle,
          vehicleLabel,
          serviceId,
          serviceName: service?.name ?? "",
          quotedCents: price,
          concern,
          name,
          phone,
          email,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    if (STATIC_DEMO) {
      const fitment =
        vehicle.year && vehicle.make && vehicle.model
          ? matchFitment(Number(vehicle.year), vehicle.make, vehicle.model)
          : null;
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-700 px-5 py-3 text-white">
            <h2 className="text-lg font-bold">Estimate — {service?.name}</h2>
            {quoteRef && (
              <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-sm tracking-widest">
                {quoteRef}
              </span>
            )}
          </div>

          <div className="px-5 py-4 text-sm">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</dt>
                <dd className="mt-0.5 font-semibold text-slate-900">
                  {vehicleLabel || "Not identified — we'll confirm at the counter"}
                </dd>
                {fitment && (
                  <dd className="mt-1 text-xs text-navy-700">
                    {fitment.model} — {fitmentSummary(fitment)}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prepared for</dt>
                <dd className="mt-0.5 text-slate-900">{name}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              {price !== null ? (
                <>
                  <div className="font-display text-4xl font-semibold text-slate-900">
                    {formatPrice(price)}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Flat rate for a{" "}
                    {VEHICLE_CLASS_LABELS[vehicle.vehicleClass].toLowerCase()}
                    {CLASS_LABOR_MULTIPLIER[vehicle.vehicleClass] !== 1 &&
                      " — includes the larger-vehicle labor rate"}
                    .
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-slate-900">Priced after inspection.</p>
                  <p className="mt-1 text-xs text-slate-500">
                    We look the vehicle over first and call you with a number
                    before any work starts.
                  </p>
                </>
              )}
              {coreParts.length > 0 && (
                <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
                  This job can involve core-charged parts (
                  {coreParts.map((c) => c.part.toLowerCase()).join(", ")}) —
                  leave the old part with us and the refundable deposit is waived.
                </p>
              )}
            </div>

            {concern.trim() && (
              <p className="mt-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">You told us:</span>{" "}
                &ldquo;{concern.trim()}&rdquo;
              </p>
            )}
          </div>

          <p className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            <strong>Demo estimate</strong> — written up in your browser; nothing
            reached the shop. For the real thing, call{" "}
            <a href={telHref()} className="font-semibold underline">
              {SHOP.phone}
            </a>
            .
          </p>

          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setQuoteRef(null);
                setServiceId("");
                setConcern("");
              }}
              className="rounded-md bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
            >
              Price another job
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-6">
        <h2 className="text-lg font-bold text-green-900">Request received</h2>
        <p className="mt-2 text-sm text-green-800">
          Thanks, {name.split(" ")[0]}. We&apos;ll be in touch about the{" "}
          {vehicleLabel || "vehicle"} shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset>
        <legend className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="step-chip">1</span>Your vehicle
        </legend>
        <div className="mt-4">
          <VehiclePicker value={vehicle} onChange={setVehicle} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="step-chip">2</span>What you need
        </legend>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors ${
                serviceId === s.id
                  ? "border-navy-500 bg-navy-50 ring-1 ring-navy-500"
                  : "border-slate-200 bg-white hover:border-navy-300"
              }`}
            >
              <input
                type="radio"
                name="service"
                value={s.id}
                checked={serviceId === s.id}
                onChange={() => setServiceId(s.id)}
                className="mt-1 accent-navy-600"
              />
              <span>
                <span className="block font-semibold text-slate-900">{s.name}</span>
                <span className="block text-xs text-slate-600">{s.description}</span>
              </span>
            </label>
          ))}
        </div>

        {service && (
          <div className="mt-3 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
            <p>
              {price === null ? (
                <>
                  <strong>Priced after inspection.</strong> We&apos;ll look it over and
                  call you with a number before any work starts.
                </>
              ) : (
                <>
                  <strong>{formatPrice(price)}</strong> for a{" "}
                  {VEHICLE_CLASS_LABELS[vehicle.vehicleClass].toLowerCase()}
                  {CLASS_LABOR_MULTIPLIER[vehicle.vehicleClass] !== 1 && (
                    <> (includes the larger-vehicle labor rate)</>
                  )}
                  .
                </>
              )}
            </p>
            {coreParts.length > 0 && (
              <p className="mt-2 text-xs text-slate-600">
                This job can involve core-charged parts (
                {coreParts.map((c) => c.part.toLowerCase()).join(", ")}). Leave the
                old part with us and the refundable core deposit is waived —{" "}
                <a href="/services" className="underline">
                  core charge program
                </a>
                .
              </p>
            )}
          </div>
        )}

        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold text-slate-900">
            What&apos;s it doing?{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            rows={3}
            placeholder="Noises, warning lights, when it happens…"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-shadow focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/25"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="step-chip">3</span>How to reach you
        </legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input label="Name" value={name} onChange={setName} required />
          <Input label="Phone" value={phone} onChange={setPhone} type="tel" />
          <Input label="Email" value={email} onChange={setEmail} type="email" />
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-navy-600 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Request estimate"}
      </button>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-900">
        {label}
        {!required && <span className="ml-1 font-normal text-slate-500">(optional)</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-shadow focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/25"
      />
    </label>
  );
}
