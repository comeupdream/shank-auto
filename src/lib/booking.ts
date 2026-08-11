/**
 * Booking creation — validation + server-side conflict check.
 *
 * Ported from Revive Detail's `src/lib/booking.ts`. Differences, all forced by
 * the change of business:
 *  - services come from the static menu (`services.ts`), not a DB table;
 *  - estimate-only services book at $0 with the price settled after
 *    inspection, because repair work can't be priced from a form;
 *  - no add-ons, no service address (customers come to the shop);
 *  - the vehicle carries VIN + class from the picker;
 *  - email notifications are not wired yet (Revive's `email.ts` is the
 *    template) — bookings just persist.
 */

import { hasConflict, isWithinHours } from "./availability.ts";
import {
  type Appointment,
  createAppointment,
  getBusyBlocks,
} from "./appointment-store.ts";
import { priceFor, serviceById } from "./services.ts";
import { SHOP, shopTodayISO } from "./shop-config.ts";
import { addDaysISO, isValidDateISO, isValidTime } from "./time.ts";
import { classifyVehicle, isVehicleClass, type VehicleClass } from "./vehicle-catalog.ts";
import { isValidVinFormat, normalizeVin } from "./vin.ts";

export type CreateBookingInput = {
  serviceId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  /** "2019 Toyota Tacoma TRD" — free label shown on the schedule. */
  vehicle?: string;
  vehicleVin?: string;
  /** Explicit vehicle class from the form; falls back to classifying `vehicle`. */
  vehicleType?: string;
  notes?: string;
  source?: "online" | "admin" | "import";
  /** Admin/import bookings may bypass lead-time / horizon / fixed-slot limits. */
  bypassWindowChecks?: boolean;
};

export type CreateBookingResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; error: string; code: number };

/**
 * Validate + create an appointment with a server-side conflict check.
 * Shared by the public booking form and the admin import.
 */
export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const name = input.customerName?.trim();
  if (!name) return { ok: false, error: "A name is required.", code: 400 };

  if (!isValidDateISO(input.date))
    return { ok: false, error: "Invalid date.", code: 400 };
  if (!isValidTime(input.startTime))
    return { ok: false, error: "Invalid time.", code: 400 };

  const service = serviceById(input.serviceId);
  if (!service)
    return { ok: false, error: "That service is unavailable.", code: 400 };

  // Date-window + fixed-slot checks (skipped for admin walk-ins/imports).
  if (!input.bypassWindowChecks) {
    const today = shopTodayISO();
    if (input.date < today)
      return { ok: false, error: "That date is in the past.", code: 400 };
    const horizon = addDaysISO(today, SHOP.bookingHorizonDays);
    if (input.date > horizon)
      return {
        ok: false,
        error: `Bookings are open up to ${SHOP.bookingHorizonDays} days out.`,
        code: 400,
      };
    if (!(SHOP.slotTimes as readonly string[]).includes(input.startTime))
      return { ok: false, error: "Please pick one of the offered time slots.", code: 400 };
  }

  const vehicle = input.vehicle?.trim() ?? "";
  const cls: VehicleClass = isVehicleClass(input.vehicleType)
    ? input.vehicleType
    : classifyVehicle(vehicle);

  const vinRaw = input.vehicleVin?.trim() ?? "";
  const vin = vinRaw && isValidVinFormat(vinRaw) ? normalizeVin(vinRaw) : "";

  if (!isWithinHours(input.date, input.startTime, service.minutes))
    return { ok: false, error: "We're closed at that time.", code: 409 };

  const busy = await getBusyBlocks(input.date);
  if (hasConflict(input.startTime, service.minutes, busy))
    return {
      ok: false,
      error: "Sorry — that time was just taken. Please pick another.",
      code: 409,
    };

  const appointment = await createAppointment({
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.minutes,
    priceCents: priceFor(service, cls) ?? 0,
    date: input.date,
    startTime: input.startTime,
    customerName: name,
    customerEmail: input.customerEmail?.trim() ?? "",
    customerPhone: input.customerPhone?.trim() ?? "",
    vehicle,
    vehicleVin: vin,
    vehicleClass: cls,
    notes: input.notes?.trim() ?? "",
    status: "CONFIRMED",
    source: input.source ?? "online",
  });

  // TODO: confirmation emails — port Revive Detail's email.ts + templates.

  return { ok: true, appointment };
}
