"use client";

/**
 * Drop-off scheduling: service → date → open slot → vehicle + contact.
 *
 * The slot list comes from /api/availability, which runs the same conflict
 * math the create call re-validates server-side — so a stale slot degrades to
 * a clear "just taken" message, never a double booking. Structure follows
 * Revive Detail's BookingForm, trimmed to a repair-shop flow.
 *
 * On a static-demo build there is no server: the same slot math runs in the
 * browser against an empty book, and submitting shows a demo notice instead
 * of recording anything.
 */

import { useEffect, useState } from "react";
import VehiclePicker, { EMPTY_VEHICLE, type Vehicle } from "./VehiclePicker";
import { computeAvailableSlots } from "@/lib/availability";
import { formatPrice, priceFor, type Service } from "@/lib/services";
import { SHOP, shopTodayISO, telHref } from "@/lib/shop-config";
import { STATIC_DEMO } from "@/lib/static-demo";
import { addDaysISO, formatTime12 } from "@/lib/time";

type Props = {
  services: Service[];
};

export default function BookingScheduler({ services }: Props) {
  // "Today" is computed after mount so the prerendered HTML doesn't bake in
  // the build day — the page itself stays fully static.
  const [dateRange, setDateRange] = useState<{ min: string; max: string } | null>(null);
  useEffect(() => {
    const today = shopTodayISO();
    setDateRange({ min: today, max: addDaysISO(today, SHOP.bookingHorizonDays) });
  }, []);

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [vehicle, setVehicle] = useState<Vehicle>(EMPTY_VEHICLE);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ date: string; time: string } | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const price = service ? priceFor(service, vehicle.vehicleClass) : null;
  const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(" ");

  // Service + date → open slots.
  useEffect(() => {
    setTime("");
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }
    if (STATIC_DEMO) {
      // No server to ask — run the availability math right here, against an
      // empty schedule. Real deployments ask the API so existing bookings
      // block their slots.
      const svc = services.find((s) => s.id === serviceId);
      setSlots(svc ? computeAvailableSlots(date, svc.minutes, []) : []);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetch(`/api/availability?date=${date}&serviceId=${encodeURIComponent(serviceId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setSlots(d.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, date, services]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!serviceId) return setError("Pick a service.");
    if (!date || !time) return setError("Pick a date and time.");
    if (!name.trim()) return setError("Please enter your name.");
    if (!phone.trim() && !email.trim()) {
      return setError("Please leave a phone number or an email.");
    }

    if (STATIC_DEMO) {
      setConfirmed({ date, time });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          date,
          startTime: time,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          vehicle: vehicleLabel,
          vehicleVin: vehicle.vin,
          vehicleType: vehicle.vehicleClass,
          notes,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Something went wrong.");
      setConfirmed({ date, time });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      // The slot may have been taken — refresh the list.
      setTime("");
      const d = await fetch(
        `/api/availability?date=${date}&serviceId=${encodeURIComponent(serviceId)}`,
      )
        .then((r) => r.json())
        .catch(() => null);
      if (d?.slots) setSlots(d.slots);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed && service) {
    if (STATIC_DEMO) {
      return (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-900">Demo only — nothing was booked</h2>
          <p className="mt-2 text-sm text-amber-800">
            This is a static preview, so your {service.name.toLowerCase()} on{" "}
            {confirmed.date} at {formatTime12(confirmed.time)} was not put on the
            schedule. To actually book, call{" "}
            <a href={telHref()} className="font-semibold underline">
              {SHOP.phone}
            </a>
            .
          </p>
        </div>
      );
    }
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-6">
        <h2 className="text-lg font-bold text-green-900">You&apos;re booked</h2>
        <p className="mt-2 text-sm text-green-800">
          {service.name} on {confirmed.date} at {formatTime12(confirmed.time)}.
          {vehicleLabel && <> We&apos;ll see the {vehicleLabel} then.</>}
        </p>
        <p className="mt-2 text-sm text-green-800">
          Need to change it? Call us at the number above.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset>
        <legend className="text-lg font-bold text-slate-900">1. Service</legend>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer gap-3 rounded-md border p-3 text-sm ${
                serviceId === s.id
                  ? "border-navy-500 bg-navy-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="service"
                checked={serviceId === s.id}
                onChange={() => setServiceId(s.id)}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-slate-900">{s.name}</span>
                <span className="block text-xs text-slate-600">
                  {s.estimateOnly ? "Priced after inspection" : formatPrice(s.priceCents)}
                  {" · "}~{Math.round(s.minutes / 60 * 10) / 10}h
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-slate-900">2. Date & time</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-900">Date</span>
            <input
              type="date"
              value={date}
              min={dateRange?.min}
              max={dateRange?.max}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-semibold text-slate-900">
              Drop-off time
            </span>
            {!serviceId || !date ? (
              <p className="text-sm text-slate-500">Pick a service and date first.</p>
            ) : slotsLoading ? (
              <p className="text-sm text-slate-500">Checking the schedule…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-slate-500">
                No openings that day — try another date.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      time === t
                        ? "border-navy-600 bg-navy-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-navy-400"
                    }`}
                  >
                    {formatTime12(t)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-slate-900">3. Your vehicle</legend>
        <div className="mt-4">
          <VehiclePicker value={vehicle} onChange={setVehicle} />
        </div>
        {service && (
          <p className="mt-3 rounded-md bg-slate-100 p-3 text-sm text-slate-700">
            {price === null ? (
              <>
                <strong>Priced after inspection.</strong> We&apos;ll call with a number
                before any work starts.
              </>
            ) : (
              <>
                <strong>{formatPrice(price)}</strong> for this vehicle.
              </>
            )}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-slate-900">4. Contact</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input label="Name" value={name} onChange={setName} required />
          <Input label="Phone" value={phone} onChange={setPhone} type="tel" />
          <Input label="Email" value={email} onChange={setEmail} type="email" />
        </div>
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-semibold text-slate-900">
            Anything we should know?{" "}
            <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </label>
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
        {submitting ? "Booking…" : "Book it"}
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
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
      />
    </label>
  );
}
