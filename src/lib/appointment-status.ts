/**
 * Allowed appointment statuses. Ported from Revive Detail; validated in app
 * code since the store has no enum type.
 */
export const APPOINTMENT_STATUSES = [
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuses that occupy a slot on the calendar (block double-booking). */
export const BLOCKING_STATUSES: AppointmentStatus[] = ["CONFIRMED", "COMPLETED"];

export function isAppointmentStatus(v: unknown): v is AppointmentStatus {
  return typeof v === "string" && (APPOINTMENT_STATUSES as readonly string[]).includes(v);
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};
