/**
 * Appointment storage.
 *
 * Revive Detail keeps appointments in Postgres via Prisma. This scaffold keeps
 * the same record shape and the same scheduling logic on top, but stores them
 * in a JSON file so the site runs with zero infrastructure — no DATABASE_URL,
 * no migration step. The whole module is the seam: swap these functions for
 * Prisma calls (auto-revival's `src/lib/prisma.ts` + schema is the template)
 * and nothing above this layer changes.
 *
 * The JSON file lives in DATA_DIR (default ./data). On hosts with an
 * ephemeral filesystem this does NOT survive redeploys — fine for local dev
 * and evaluation, not for production. See README "Not built yet".
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { AppointmentStatus } from "./appointment-status.ts";
import { BLOCKING_STATUSES } from "./appointment-status.ts";
import type { BusyBlock } from "./availability.ts";
import type { VehicleClass } from "./vehicle-catalog.ts";

export type Appointment = {
  id: string;
  serviceId: string;
  serviceName: string; // snapshot at booking time
  durationMinutes: number; // snapshot so availability math is stable
  priceCents: number; // 0 = to be estimated
  date: string; // "YYYY-MM-DD" shop-local
  startTime: string; // "HH:MM" 24h
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicle: string; // "2019 Toyota Tacoma TRD"
  vehicleVin: string;
  vehicleClass: VehicleClass;
  notes: string;
  status: AppointmentStatus;
  source: "online" | "admin" | "import";
  createdAt: string; // ISO timestamp
  updatedAt: string;
};

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "appointments.json");

// Serialize writers within this process; the JSON file has no cross-process
// locking (a real deployment swaps this module for a database anyway).
let writeChain: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Appointment[]> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Appointment[]) : [];
  } catch {
    return []; // missing or unreadable file = empty book
  }
}

async function writeAll(appointments: Appointment[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  // Write-then-rename so a crash mid-write can't corrupt the book.
  const tmp = `${FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(appointments, null, 2), "utf8");
  await rename(tmp, FILE);
}

/** Run `fn` with exclusive access to the store (within this process). */
function withStore<T>(fn: (all: Appointment[]) => Promise<[Appointment[], T]>): Promise<T> {
  const run = writeChain.then(async () => {
    const all = await readAll();
    const [next, result] = await fn(all);
    await writeAll(next);
    return result;
  });
  // Keep the chain alive even when a caller's fn throws.
  writeChain = run.catch(() => {});
  return run;
}

export type NewAppointment = Omit<Appointment, "id" | "createdAt" | "updatedAt">;

export async function createAppointment(input: NewAppointment): Promise<Appointment> {
  const now = new Date().toISOString();
  const appt: Appointment = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
  return withStore(async (all) => [[...all, appt], appt]);
}

/** Insert many at once (used by the sheet import — one file write, not N). */
export async function createAppointments(
  inputs: NewAppointment[],
): Promise<Appointment[]> {
  const now = new Date().toISOString();
  const created = inputs.map<Appointment>((input) => ({
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  }));
  return withStore(async (all) => [[...all, ...created], created]);
}

export async function listAppointments(filter?: {
  date?: string;
  from?: string;
  to?: string;
}): Promise<Appointment[]> {
  let all = await readAll();
  if (filter?.date) all = all.filter((a) => a.date === filter.date);
  if (filter?.from) all = all.filter((a) => a.date >= filter.from!);
  if (filter?.to) all = all.filter((a) => a.date <= filter.to!);
  return all.sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
  );
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment | null> {
  return withStore(async (all) => {
    const i = all.findIndex((a) => a.id === id);
    if (i === -1) return [all, null];
    const updated = { ...all[i], status, updatedAt: new Date().toISOString() };
    const next = [...all];
    next[i] = updated;
    return [next, updated];
  });
}

/** Existing appointments that occupy the calendar on a given date. */
export async function getBusyBlocks(dateISO: string): Promise<BusyBlock[]> {
  const day = await listAppointments({ date: dateISO });
  return day
    .filter((a) => (BLOCKING_STATUSES as string[]).includes(a.status))
    .map((a) => ({ startTime: a.startTime, durationMinutes: a.durationMinutes }));
}
