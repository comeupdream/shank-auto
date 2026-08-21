"use client";

/**
 * The front-page tool: identify the vehicle (VIN or year/make/model — the
 * whole stack runs in the browser) and pick a job, and the price updates
 * live. Flat-rate work shows a number; repair work says so honestly and
 * points at the estimate form. The "Book it" path hands off to the
 * scheduler section further down the page.
 */

import Link from "next/link";
import { useState } from "react";
import VehiclePicker, { EMPTY_VEHICLE, type Vehicle } from "./VehiclePicker";
import {
  CLASS_LABOR_MULTIPLIER,
  SERVICES,
  formatPrice,
  priceFor,
} from "@/lib/services";
import { VEHICLE_CLASS_LABELS } from "@/lib/vehicle-catalog";

export default function HomeTools() {
  const [vehicle, setVehicle] = useState<Vehicle>(EMPTY_VEHICLE);
  const [serviceId, setServiceId] = useState("oil-change");

  const service = SERVICES.find((s) => s.id === serviceId);
  const price = service ? priceFor(service, vehicle.vehicleClass) : null;
  const vehicleLabel = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr),minmax(0,5fr)]">
      <div className="rounded-xl bg-white p-5 shadow-card sm:p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-accent-dark">
          1 · Your vehicle
        </h3>
        <div className="mt-3">
          <VehiclePicker value={vehicle} onChange={setVehicle} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-xl bg-white p-5 shadow-card sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-accent-dark">
            2 · The job
          </h3>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            {SERVICES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {service && (
            <p className="mt-2 text-xs text-slate-500">{service.description}</p>
          )}
        </div>

        <div className="flex flex-1 flex-col rounded-xl bg-chassis p-5 text-white shadow-card sm:p-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-accent">
            Your price
          </h3>
          {price !== null ? (
            <>
              <div className="mt-2 font-display text-6xl font-semibold tracking-wide">
                {formatPrice(price)}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Flat rate for a{" "}
                {VEHICLE_CLASS_LABELS[vehicle.vehicleClass].toLowerCase()}
                {CLASS_LABOR_MULTIPLIER[vehicle.vehicleClass] !== 1 &&
                  " (larger-vehicle labor rate included)"}
                {vehicleLabel && <> — the {vehicleLabel}</>}.
              </p>
            </>
          ) : (
            <>
              <div className="mt-2 font-display text-4xl font-semibold tracking-wide">
                Priced after a look
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Repair work is quoted once we&apos;ve seen the vehicle — we call
                with a number before any work starts.
              </p>
            </>
          )}
          <div className="mt-auto flex flex-wrap gap-3 pt-5">
            <a
              href="#book"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-bold text-chassis transition-colors hover:bg-accent"
            >
              Book this drop-off
            </a>
            <Link
              href="/estimate"
              className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Full estimate →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
