"use client";

/**
 * Drop-off scheduling: service → date → open slot → vehicle + contact.
 *
 * The slot list comes from /api/availability, which runs the same conflict
 * math the create call re-validates server-side — so a stale slot degrades to
 * a clear "just taken" message, never a double booking. Structure follows
 * Revive Detail's BookingForm, trimmed to a repair-shop flow.
 *
 * On a static-demo build there is no server: the same engine runs in the
 * browser against a demo book kept in this device's localStorage
 * (demo-store.ts). Demo bookings really consume their slots — long jobs
 * swallow the following ones, a just-taken time is refused on re-check —
 * and every confirmation is clearly labeled a demo.
 */

import { useEffect, useState } from "react";
import VehiclePicker, { EMPTY_VEHICLE, type Vehicle } from "./VehiclePicker";
import { computeAvailableSlots } from "@/lib/availability";
import {
  addDemoAppointment,
  clearDemoAppointments,
  demoAppointments,
  demoBusyBlocks,
  type DemoAppointment,
} from "@/lib/demo-store";
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
  const [confirmed, setConfirmed] = useState<
    { date: string; time: string; ref?: string } | null
  >(null);

  // The device-local demo book (static demo only). Loaded after mount —
  // localStorage doesn't exist during prerender.
  const [demoBook, setDemoBook] = useState<DemoAppointment[]>([]);
  useEffect(() => {
    if (STATIC_DEMO) setDemoBook(demoAppointments());
  }, []);

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
      // No server to ask — run the availability engine right here against
      // the device-local demo book, so demo bookings block their slots just
      // like real ones do on the Node deployment.
      const svc = services.find((s) => s.id === serviceId);
      setSlots(svc ? computeAvailableSlots(date, svc.minutes, demoBusyBlocks(date)) : []);
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
  }, [serviceId, date, services, demoBook]);

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
      // Same double-booking rule the server enforces: re-check the slot
      // against the demo book at submit time.
      const svc = services.find((s) => s.id === serviceId);
      if (!svc) return setError("Pick a service.");
      const open = computeAvailableSlots(date, svc.minutes, demoBusyBlocks(date));
      if (!open.includes(time)) {
        setTime("");
        setDemoBook(demoAppointments());
        return setError(
          "That time was just taken on this device's demo schedule — pick another.",
        );
      }
      const saved = addDemoAppointment({
        serviceId,
        serviceName: svc.name,
        date,
        startTime: time,
        durationMinutes: svc.minutes,
        customerName: name,
        vehicle: vehicleLabel,
        priceCents: price,
      });
      setDemoBook(demoAppointments());
      setConfirmed({ date, time, ref: saved.ref });
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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-700 px-5 py-3 text-white">
            <h2 className="text-lg font-bold">Drop-off reserved</h2>
            {confirmed.ref && (
              <span className="rounded-md bg-white/10 px-2.5 py-1 font-mono text-sm tracking-widest">
                {confirmed.ref}
              </span>
            )}
          </div>
          <dl className="grid gap-x-8 gap-y-3 px-5 py-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">{service.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">When</dt>
              <dd className="mt-0.5 font-semibold text-slate-900">
                {confirmed.date} · {formatTime12(confirmed.time)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vehicle</dt>
              <dd className="mt-0.5 text-slate-900">{vehicleLabel || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</dt>
              <dd className="mt-0.5 text-slate-900">
                {price !== null ? formatPrice(price) : "Quoted after inspection"}
              </dd>
            </div>
          </dl>
          <p className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
            <strong>Demo booking</strong> — saved only in this browser, so you can
            watch its slot vanish from the picker. Nothing reached the shop. To
            really book, call{" "}
            <a href={telHref()} className="font-semibold underline">
              {SHOP.phone}
            </a>
            .
          </p>
          <div className="px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setConfirmed(null);
                setDate("");
                setTime("");
              }}
              className="rounded-md bg-navy-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-700"
            >
              Book another time
            </button>
          </div>
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
        <legend className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="step-chip">1</span>Service
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
                checked={serviceId === s.id}
                onChange={() => setServiceId(s.id)}
                className="mt-1 accent-navy-600"
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
        <legend className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="step-chip">2</span>Date & time
        </legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-900">Date</span>
            <input
              type="date"
              value={date}
              min={dateRange?.min}
              max={dateRange?.max}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-shadow focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/25"
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
                    className={`rounded-md border px-3 py-1.5 text-sm font-medium tabular-nums transition-colors ${
                      time === t
                        ? "border-navy-600 bg-navy-600 text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:border-navy-400 hover:bg-navy-50"
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
        <legend className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="step-chip">3</span>Your vehicle
        </legend>
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
        <legend className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="step-chip">4</span>Contact
        </legend>
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm transition-shadow focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/25"
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
        className="rounded-md bg-navy-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-700 disabled:opacity-50"
      >
        {submitting ? "Booking…" : "Book it"}
      </button>

      {STATIC_DEMO && demoBook.length > 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Demo schedule on this device</h3>
            <button
              type="button"
              onClick={() => {
                clearDemoAppointments();
                setDemoBook([]);
              }}
              className="text-xs font-semibold text-navy-700 underline"
            >
              Clear it
            </button>
          </div>
          <ul className="mt-2 space-y-1 text-slate-600">
            {demoBook.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-x-4">
                <span>
                  {a.date} · {formatTime12(a.startTime)} — {a.serviceName}
                </span>
                <span className="font-mono text-xs tracking-wider text-slate-400">{a.ref}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
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
