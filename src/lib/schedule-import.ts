/**
 * Excel/CSV schedule import.
 *
 * The shop keeps its schedule in a spreadsheet; this turns an uploaded .xlsx
 * (or .csv) into appointments. Header names are matched loosely — "Customer",
 * "customer name", "Client" all land on the same field — and dates/times
 * accept the formats Excel actually produces: real date cells, serial
 * numbers, "8/14/2026", "2026-08-14", "8:00", "8:00 AM", or an Excel time
 * fraction.
 *
 * Expected columns (order doesn't matter, extras are ignored):
 *   Date* | Time* | Customer* | Phone | Email | Vehicle | VIN | Service |
 *   Duration | Notes | Status
 *
 * Only Date, Time, and Customer are required per row. A missing/unknown
 * Service lands on the "other" catch-all with the sheet's text preserved in
 * the notes. Rows are validated individually: bad rows are reported with
 * their row number and reason, good rows import. Imported rows bypass the
 * online-booking window rules (the sheet is the shop's own book — it may
 * contain today, tomorrow, or history) but still get flagged when they
 * overlap an existing appointment.
 */

import * as XLSX from "xlsx";
import { hasConflict, type BusyBlock } from "./availability.ts";
import {
  createAppointments,
  listAppointments,
  type NewAppointment,
} from "./appointment-store.ts";
import { isAppointmentStatus, type AppointmentStatus } from "./appointment-status.ts";
import { priceFor, SERVICES, serviceById, type Service } from "./services.ts";
import { isValidDateISO, isValidTime, timeToMinutes } from "./time.ts";
import { classifyVehicle } from "./vehicle-catalog.ts";
import { isValidVinFormat, normalizeVin } from "./vin.ts";

export type ImportRowResult = {
  /** 1-based row number in the sheet (header = row 1). */
  row: number;
  status: "imported" | "skipped";
  /** Why the row was skipped, or a non-fatal warning on an imported row. */
  message?: string;
  summary?: string;
};

export type ImportReport = {
  imported: number;
  skipped: number;
  results: ImportRowResult[];
};

// ---------------------------------------------------------------------------
// Header + cell coercion
// ---------------------------------------------------------------------------

/** Loose header → canonical field. First match wins. */
const HEADER_ALIASES: [RegExp, string][] = [
  [/^date$|^appt.?date$|^appointment.?date$|^day$/i, "date"],
  [/^time$|^start|^appt.?time$|^appointment.?time$/i, "time"],
  [/^customer|^client|^name$|^customer.?name$/i, "customer"],
  [/^phone|^tel|^cell|^mobile/i, "phone"],
  [/^e-?mail/i, "email"],
  [/^vehicle$|^car$|^ymm$|^year.?make.?model$/i, "vehicle"],
  [/^vin$/i, "vin"],
  [/^service|^job|^work|^repair$/i, "service"],
  [/^duration|^minutes$|^mins$|^time.?req/i, "duration"],
  [/^notes?$|^comments?$|^concern|^description$/i, "notes"],
  [/^status$/i, "status"],
];

function canonicalHeader(raw: string): string | null {
  const h = raw.trim();
  if (!h) return null;
  for (const [re, name] of HEADER_ALIASES) if (re.test(h)) return name;
  return null;
}

/** Coerce a sheet cell to "YYYY-MM-DD". Returns null if unreadable. */
export function coerceDate(cell: unknown): string | null {
  if (cell instanceof Date && !isNaN(cell.getTime())) {
    // cellDates:true gives us a Date at UTC-ish midnight; read the UTC parts
    // so the shop's local calendar date survives regardless of server TZ.
    const y = cell.getUTCFullYear();
    const m = String(cell.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cell.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof cell === "number" && Number.isFinite(cell) && cell > 0) {
    // Excel serial date: days since 1899-12-30, so serial 25569 = 1970-01-01.
    const d = new Date((Math.floor(cell) - 25569) * 86_400_000);
    if (isNaN(d.getTime())) return null;
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  if (typeof cell === "string") {
    const s = cell.trim();
    if (isValidDateISO(s)) return s;
    // "8/14/2026", "08-14-26" (US order, as the shop writes it).
    const us = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (us) {
      const [, mo, d, yRaw] = us;
      const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
      const iso = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
      return isValidDateISO(iso) ? iso : null;
    }
  }
  return null;
}

/** Coerce a sheet cell to "HH:MM" 24h. Returns null if unreadable. */
export function coerceTime(cell: unknown): string | null {
  if (cell instanceof Date && !isNaN(cell.getTime())) {
    return `${String(cell.getUTCHours()).padStart(2, "0")}:${String(cell.getUTCMinutes()).padStart(2, "0")}`;
  }
  if (typeof cell === "number" && Number.isFinite(cell)) {
    // Excel time fraction (0.5 = noon); also handles date+time serials.
    const frac = cell % 1;
    const totalMin = Math.round(frac * 24 * 60);
    const h = Math.floor(totalMin / 60) % 24;
    const m = totalMin % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  if (typeof cell === "string") {
    const s = cell.trim();
    const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm]?)?\.?$/);
    if (!m) return null;
    let h = Number(m[1]);
    const min = Number(m[2]);
    const ampm = m[3]?.toLowerCase();
    if (ampm?.startsWith("p") && h < 12) h += 12;
    if (ampm?.startsWith("a") && h === 12) h = 0;
    const out = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    return isValidTime(out) ? out : null;
  }
  return null;
}

/** Match free service text against the menu; null = no confident match. */
export function matchService(text: string): Service | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;

  const byId = serviceById(t);
  if (byId) return byId;

  const exact = SERVICES.find((s) => s.name.toLowerCase() === t);
  if (exact) return exact;

  // Substring either way: "oil" → Oil & Filter Change; "va state inspection
  // 2pm bay 2" → Virginia State Inspection.
  const partial = SERVICES.find(
    (s) =>
      s.id !== "other" &&
      (s.name.toLowerCase().includes(t) || t.includes(s.name.toLowerCase().split(" ")[0].toLowerCase())),
  );
  if (partial) return partial;

  // Keyword net for the shorthand a shop actually types into a sheet.
  const keywords: [RegExp, string][] = [
    [/oil|lube|lof\b/, "oil-change"],
    [/inspect/, "state-inspection"],
    [/tire|rotat|balanc|wheel/, "tire-rotation"],
    [/brake|pad|rotor|caliper/, "brakes"],
    [/diag|check.?engine|cel\b|scan/, "diagnostics"],
    [/\ba\/?c\b|air.?cond|refriger|recharge/, "ac-service"],
    [/suspension|strut|shock|align|steering|tie.?rod|control.?arm/, "suspension"],
    [/battery|alternator|starter|electrical/, "battery-electrical"],
    [/trans|clutch|flush/, "transmission"],
  ];
  for (const [re, id] of keywords) {
    if (re.test(t)) return serviceById(id) ?? null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

type ParsedRow = { row: number; appointment: NewAppointment; warning?: string };

/**
 * Parse a spreadsheet into appointment drafts + per-row errors, without
 * writing anything. Pure enough to test directly.
 */
export function parseScheduleSheet(buffer: Buffer | Uint8Array): {
  rows: ParsedRow[];
  errors: ImportRowResult[];
} {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { rows: [], errors: [{ row: 0, status: "skipped", message: "The file has no sheets." }] };

  // Raw arrays: row 0 = header. `raw:true` keeps Dates/numbers as values.
  const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: "",
  });
  if (grid.length === 0) {
    return { rows: [], errors: [{ row: 0, status: "skipped", message: "The sheet is empty." }] };
  }

  const headerRow = grid[0].map((c) => canonicalHeader(String(c ?? "")));
  const col = (name: string) => headerRow.indexOf(name);
  if (col("date") === -1 || col("time") === -1 || col("customer") === -1) {
    const found = headerRow.filter(Boolean).join(", ") || "none recognized";
    return {
      rows: [],
      errors: [{
        row: 1,
        status: "skipped",
        message: `Need Date, Time and Customer columns (found: ${found}). ` +
          `Header row must be the first row of the sheet.`,
      }],
    };
  }

  const rows: ParsedRow[] = [];
  const errors: ImportRowResult[] = [];

  for (let i = 1; i < grid.length; i++) {
    const rowNum = i + 1; // 1-based, matching what the user sees in Excel
    const cells = grid[i];
    const cell = (name: string): unknown => {
      const c = col(name);
      return c === -1 ? "" : cells[c];
    };
    const text = (name: string): string => String(cell(name) ?? "").trim();

    // Fully blank rows are common at the bottom of a sheet — skip silently.
    if (cells.every((c) => String(c ?? "").trim() === "")) continue;

    const date = coerceDate(cell("date"));
    if (!date) {
      errors.push({ row: rowNum, status: "skipped", message: `Unreadable date "${text("date")}".` });
      continue;
    }
    const time = coerceTime(cell("time"));
    if (!time) {
      errors.push({ row: rowNum, status: "skipped", message: `Unreadable time "${text("time")}".` });
      continue;
    }
    const customer = text("customer");
    if (!customer) {
      errors.push({ row: rowNum, status: "skipped", message: "Missing customer name." });
      continue;
    }

    const serviceText = text("service");
    const service = matchService(serviceText) ?? serviceById("other")!;
    let warning: string | undefined;
    if (serviceText && service.id === "other" && !matchService(serviceText)) {
      warning = `Service "${serviceText}" isn't on the menu — filed under "${service.name}".`;
    }

    const durationRaw = Number(text("duration"));
    const duration =
      Number.isFinite(durationRaw) && durationRaw >= 15 && durationRaw <= 600
        ? Math.round(durationRaw)
        : service.minutes;

    const vehicle = text("vehicle");
    const vinText = text("vin");
    const vin = vinText && isValidVinFormat(vinText) ? normalizeVin(vinText) : "";
    if (vinText && !vin) {
      warning = [warning, `VIN "${vinText}" is malformed — imported without it.`]
        .filter(Boolean)
        .join(" ");
    }

    const statusText = text("status").toUpperCase().replace(/[\s-]/g, "_");
    const status: AppointmentStatus = isAppointmentStatus(statusText)
      ? statusText
      : "CONFIRMED";

    const cls = classifyVehicle(vehicle);
    const notes = [
      text("notes"),
      serviceText && service.id === "other" ? `Sheet service: ${serviceText}` : "",
    ]
      .filter(Boolean)
      .join(" — ");

    rows.push({
      row: rowNum,
      warning,
      appointment: {
        serviceId: service.id,
        serviceName: service.name,
        durationMinutes: duration,
        priceCents: priceFor(service, cls) ?? 0,
        date,
        startTime: time,
        customerName: customer,
        customerEmail: text("email"),
        customerPhone: text("phone"),
        vehicle,
        vehicleVin: vin,
        vehicleClass: cls,
        notes,
        status,
        source: "import",
      },
    });
  }

  return { rows, errors };
}

/**
 * Parse and persist a schedule sheet.
 *
 * The sheet is the shop's own book, so rows import even when they collide
 * with something already on the calendar — but collisions (against existing
 * appointments AND between rows in the same sheet) come back flagged so the
 * shop can untangle them.
 */
export async function importScheduleSheet(
  buffer: Buffer | Uint8Array,
): Promise<ImportReport> {
  const { rows, errors } = parseScheduleSheet(buffer);
  const results: ImportRowResult[] = [...errors];

  // Busy blocks per date: what's already booked + what this sheet adds.
  const busyByDate = new Map<string, BusyBlock[]>();
  const busyFor = async (date: string): Promise<BusyBlock[]> => {
    let blocks = busyByDate.get(date);
    if (!blocks) {
      const existing = await listAppointments({ date });
      blocks = existing
        .filter((a) => a.status === "CONFIRMED" || a.status === "COMPLETED")
        .map((a) => ({ startTime: a.startTime, durationMinutes: a.durationMinutes }));
      busyByDate.set(date, blocks);
    }
    return blocks;
  };

  const toCreate: NewAppointment[] = [];
  for (const { row, appointment, warning } of rows) {
    const busy = await busyFor(appointment.date);
    const collides = hasConflict(appointment.startTime, appointment.durationMinutes, busy);

    toCreate.push(appointment);
    busy.push({
      startTime: appointment.startTime,
      durationMinutes: appointment.durationMinutes,
    });

    const messages = [
      warning,
      collides ? "Overlaps another appointment that day — double-check the bay." : undefined,
    ].filter(Boolean);

    results.push({
      row,
      status: "imported",
      message: messages.length ? messages.join(" ") : undefined,
      summary: `${appointment.date} ${appointment.startTime} — ${appointment.customerName} (${appointment.serviceName})`,
    });
  }

  if (toCreate.length > 0) await createAppointments(toCreate);

  results.sort((a, b) => a.row - b.row);
  return {
    imported: toCreate.length,
    skipped: results.filter((r) => r.status === "skipped").length,
    results,
  };
}
