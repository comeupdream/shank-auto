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
import {
  CLASS_LABOR_MULTIPLIER,
  type Service,
  formatPrice,
  priceFor,
} from "@/lib/services";
import { VEHICLE_CLASS_LABELS } from "@/lib/vehicle-catalog";

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

  const service = services.find((s) => s.id === serviceId);
  const price = service ? priceFor(service, vehicle.vehicleClass) : null;

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
        <legend className="text-lg font-bold text-slate-900">1. Your vehicle</legend>
        <div className="mt-4">
          <VehiclePicker value={vehicle} onChange={setVehicle} />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-slate-900">2. What you need</legend>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm ${
                serviceId === s.id
                  ? "border-sky-500 bg-sky-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="service"
                value={s.id}
                checked={serviceId === s.id}
                onChange={() => setServiceId(s.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-slate-900">{s.name}</span>
                <span className="block text-xs text-slate-600">{s.description}</span>
              </span>
            </label>
          ))}
        </div>

        {service && (
          <p className="mt-3 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-slate-900">3. How to reach you</legend>
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
        className="rounded-md bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
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
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />
    </label>
  );
}
