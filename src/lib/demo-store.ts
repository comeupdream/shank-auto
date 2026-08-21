/**
 * Browser-local appointment book for the static demo.
 *
 * The static build has no server, so this stands in for the JSON store
 * behind /api/appointments: bookings live in the visitor's localStorage and
 * feed the same Revive Detail availability engine (availability.ts) the Node
 * deployment runs — so a demo booking really consumes its slots, long jobs
 * swallow the following slot(s), and a taken time is refused on re-check.
 *
 * Storage is best-effort: private windows or blocked storage degrade to an
 * in-memory book that lasts for the visit. Nothing here ever leaves the
 * visitor's browser, and the UI labels all of it as a demo.
 */

import { type BusyBlock } from "./availability.ts";

export type DemoAppointment = {
  id: string;
  /** Short confirmation reference shown to the visitor, e.g. "SH-7K2F". */
  ref: string;
  serviceId: string;
  serviceName: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  durationMinutes: number;
  customerName: string;
  vehicle: string;
  priceCents: number | null;
};

const KEY = "shank-demo-book";

/** Fallback when localStorage is unavailable (private mode, blocked). */
let memory: DemoAppointment[] = [];

function read(): DemoAppointment[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return memory;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoAppointment[]) : memory;
  } catch {
    return memory;
  }
}

function write(book: DemoAppointment[]): void {
  memory = book;
  try {
    localStorage.setItem(KEY, JSON.stringify(book));
  } catch {
    // Storage blocked — the memory copy still serves this visit.
  }
}

export function demoAppointments(): DemoAppointment[] {
  return [...read()].sort((a, b) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
  );
}

export function demoBusyBlocks(date: string): BusyBlock[] {
  return read()
    .filter((a) => a.date === date)
    .map((a) => ({ startTime: a.startTime, durationMinutes: a.durationMinutes }));
}

export function addDemoAppointment(
  appt: Omit<DemoAppointment, "id" | "ref">,
): DemoAppointment {
  const saved: DemoAppointment = { ...appt, id: demoId(), ref: demoRef() };
  write([...read(), saved]);
  return saved;
}

export function clearDemoAppointments(): void {
  write([]);
}

function demoId(): string {
  return `demo-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e8).toString(36)}`;
}

/** Short "SH-XXXX" reference for demo confirmations and demo estimates. */
export function demoRef(): string {
  // No lookalike characters — this gets read over the phone in the pitch.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 4; i++) {
    tail += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `SH-${tail}`;
}
