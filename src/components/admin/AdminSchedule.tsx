"use client";

/**
 * The shop's job book, in three renderings of the same appointment data:
 *
 *  - List:     upcoming two weeks grouped by day — the "what's next" view.
 *  - Calendar: month grid, one chip per job, closed days grayed out.
 *  - Sheet:    spreadsheet-style table of every fetched appointment with
 *              inline status changes — the digital version of the paper
 *              schedule the Excel import ingests.
 *
 * Plus the spreadsheet import itself. All three views re-render from one
 * fetch (today − 7 days through + 60), so an import updates everything at
 * once. Status changes PATCH /api/admin/appointments/:id and update local
 * state optimistically.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  APPOINTMENT_STATUSES,
  STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/appointment-status";
import { formatPrice } from "@/lib/services";
import { SHOP, shopTodayISO } from "@/lib/shop-config";
import { addDaysISO, formatTime12, weekdayOf } from "@/lib/time";

type Appointment = {
  id: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicle: string;
  vehicleVin: string;
  notes: string;
  status: AppointmentStatus;
  source: string;
};

type ImportRowResult = {
  row: number;
  status: "imported" | "skipped";
  message?: string;
  summary?: string;
};

type ImportReport = {
  imported: number;
  skipped: number;
  results: ImportRowResult[];
};

type View = "list" | "calendar" | "sheet";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  CONFIRMED: "bg-navy-100 text-navy-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-slate-100 text-slate-500 line-through",
  NO_SHOW: "bg-amber-100 text-amber-800",
};

export default function AdminSchedule() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("list");
  const [monthStart, setMonthStart] = useState(() => shopTodayISO().slice(0, 8) + "01");
  const [report, setReport] = useState<ImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = shopTodayISO();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = addDaysISO(today, -7);
      const to = addDaysISO(today, 60);
      const res = await fetch(`/api/admin/schedule?from=${from}&to=${to}`);
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const d = await res.json();
      setAppointments(d.appointments ?? []);
    } finally {
      setLoading(false);
    }
  }, [router, today]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: AppointmentStatus) {
    const prev = appointments;
    setAppointments((all) => all.map((a) => (a.id === id ? { ...a, status } : a)));
    const res = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    if (!res?.ok) setAppointments(prev); // roll back on failure
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setImportError("Choose a spreadsheet first.");
      return;
    }

    setUploading(true);
    setImportError(null);
    setReport(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/schedule/import", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Import failed.");
      setReport(body as ImportReport);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-slate-900">
          Shop schedule
        </h1>
        <nav className="ml-auto flex rounded-md border border-slate-300 bg-white text-sm">
          {(["list", "calendar", "sheet"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 capitalize first:rounded-l-md last:rounded-r-md ${
                view === v ? "bg-navy-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {v}
            </button>
          ))}
        </nav>
        <button onClick={() => void logout()} className="text-sm text-slate-500 underline">
          Sign out
        </button>
      </div>

      {/* ------------------------------------------------------ Sheet import */}
      <section className="rounded-lg bg-white p-5 shadow-card">
        <h2 className="font-semibold text-slate-900">Import a schedule sheet</h2>
        <p className="mt-1 text-sm text-slate-600">
          Upload .xlsx or .csv. First row must be headers; needs{" "}
          <strong>Date</strong>, <strong>Time</strong> and <strong>Customer</strong>{" "}
          columns — Phone, Email, Vehicle, VIN, Service, Duration, Notes and
          Status are picked up when present.
        </p>

        <form onSubmit={upload} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-sm file:font-semibold"
          />
          <button
            type="submit"
            disabled={uploading}
            className="shrink-0 rounded-md bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-50"
          >
            {uploading ? "Importing…" : "Import"}
          </button>
        </form>

        {importError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {importError}
          </p>
        )}

        {report && (
          <div className="mt-4 rounded-md border border-slate-200 p-3 text-sm">
            <p className="font-semibold text-slate-900">
              {report.imported} imported, {report.skipped} skipped.
            </p>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {report.results.map((r) => (
                <li
                  key={`${r.row}-${r.status}`}
                  className={
                    r.status === "skipped"
                      ? "text-red-700"
                      : r.message
                        ? "text-amber-700"
                        : "text-slate-600"
                  }
                >
                  Row {r.row}: {r.status === "skipped" ? "skipped — " : ""}
                  {r.summary && <>{r.summary} </>}
                  {r.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : view === "list" ? (
        <ListView appointments={appointments} today={today} onStatus={setStatus} />
      ) : view === "calendar" ? (
        <CalendarView
          appointments={appointments}
          monthStart={monthStart}
          onMonthChange={setMonthStart}
          today={today}
        />
      ) : (
        <SheetView appointments={appointments} onStatus={setStatus} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ List */

function ListView({
  appointments,
  today,
  onStatus,
}: {
  appointments: Appointment[];
  today: string;
  onStatus: (id: string, s: AppointmentStatus) => void;
}) {
  const horizon = addDaysISO(today, 14);
  const upcoming = appointments.filter((a) => a.date >= today && a.date <= horizon);

  const byDate = new Map<string, Appointment[]>();
  for (const a of upcoming) {
    const day = byDate.get(a.date) ?? [];
    day.push(a);
    byDate.set(a.date, day);
  }

  if (byDate.size === 0) {
    return <p className="text-sm text-slate-500">Nothing on the book for the next two weeks.</p>;
  }

  return (
    <section>
      <h2 className="font-semibold text-slate-900">Next two weeks</h2>
      {[...byDate.entries()].map(([date, day]) => (
        <div key={date} className="mt-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-accent-dark">{date}</h3>
          <ul className="mt-1 divide-y divide-slate-200 rounded-lg bg-white shadow-card">
            {day.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-3 text-sm">
                <span className="w-20 font-mono font-semibold text-slate-900">
                  {formatTime12(a.startTime)}
                </span>
                <span className="font-semibold text-slate-900">{a.customerName}</span>
                <span className="text-slate-600">{a.serviceName}</span>
                {a.vehicle && <span className="text-slate-500">· {a.vehicle}</span>}
                {a.priceCents > 0 && (
                  <span className="text-slate-500">· {formatPrice(a.priceCents)}</span>
                )}
                <span className="ml-auto">
                  <StatusSelect value={a.status} onChange={(s) => onStatus(a.id, s)} />
                </span>
                {(a.customerPhone || a.notes) && (
                  <span className="w-full text-xs text-slate-500">
                    {a.customerPhone}
                    {a.customerPhone && a.notes && " — "}
                    {a.notes}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

/* -------------------------------------------------------------- Calendar */

function CalendarView({
  appointments,
  monthStart,
  onMonthChange,
  today,
}: {
  appointments: Appointment[];
  monthStart: string; // "YYYY-MM-01"
  onMonthChange: (m: string) => void;
  today: string;
}) {
  const [y, m] = monthStart.split("-").map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const byDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const day = map.get(a.date) ?? [];
      day.push(a);
      map.set(a.date, day);
    }
    return map;
  }, [appointments]);

  // Week rows: pad back to the Sunday before the 1st, run past month end.
  const first = `${monthStart.slice(0, 8)}01`;
  const gridStart = addDaysISO(first, -weekdayOf(first));
  const weeks: string[][] = [];
  let cursor = gridStart;
  do {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDaysISO(cursor, 1);
    }
    weeks.push(week);
  } while (cursor.slice(0, 7) <= monthStart.slice(0, 7) && weeks.length < 7);

  function shiftMonth(delta: number) {
    const next = new Date(y, m - 1 + delta, 1);
    onMonthChange(
      `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`,
    );
  }

  return (
    <section className="rounded-lg bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">{monthLabel}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50"
          >
            ←
          </button>
          <button
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-sm hover:bg-slate-50"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-slate-50 px-2 py-1.5 text-center font-semibold text-slate-500">
            {d}
          </div>
        ))}
        {weeks.flat().map((date) => {
          const inMonth = date.slice(0, 7) === monthStart.slice(0, 7);
          const closed = !SHOP.hours[weekdayOf(date)];
          const day = byDate.get(date) ?? [];
          return (
            <div
              key={date}
              className={`min-h-[92px] p-1.5 ${
                !inMonth ? "bg-slate-50 text-slate-300" : closed ? "bg-slate-100" : "bg-white"
              } ${date === today ? "ring-2 ring-inset ring-navy-500" : ""}`}
            >
              <div
                className={`text-right tabular-nums ${
                  inMonth ? (closed ? "text-slate-400" : "text-slate-600") : ""
                }`}
              >
                {Number(date.slice(8))}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {day.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    title={`${formatTime12(a.startTime)} ${a.customerName} — ${a.serviceName}`}
                    className={`truncate rounded px-1 py-0.5 ${STATUS_STYLES[a.status]}`}
                  >
                    {formatTime12(a.startTime).replace(" ", "")} {a.customerName}
                  </div>
                ))}
                {day.length > 3 && (
                  <div className="px-1 text-slate-500">+{day.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- Sheet */

function SheetView({
  appointments,
  onStatus,
}: {
  appointments: Appointment[];
  onStatus: (id: string, s: AppointmentStatus) => void;
}) {
  if (appointments.length === 0) {
    return <p className="text-sm text-slate-500">Nothing on the book.</p>;
  }

  const total = appointments
    .filter((a) => a.status === "CONFIRMED" || a.status === "COMPLETED")
    .reduce((s, a) => s + a.priceCents, 0);

  return (
    <section className="rounded-lg bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              {["When", "Customer", "Vehicle", "Service", "Price", "Status", "Notes"].map((h) => (
                <th key={h} className="px-3 py-2 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <tr key={a.id} className={a.status === "CANCELLED" ? "opacity-50" : ""}>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                  {a.date}
                  <span className="block text-slate-500">
                    {formatTime12(a.startTime)}
                    {a.source === "import" && (
                      <span className="ml-1 rounded bg-slate-100 px-1 font-sans text-[10px] text-slate-500">
                        sheet
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="font-semibold text-slate-900">{a.customerName}</span>
                  {a.customerPhone && (
                    <span className="block text-xs text-slate-500">{a.customerPhone}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {a.vehicle}
                  {a.vehicleVin && (
                    <span className="block font-mono text-[10px] text-slate-400">
                      {a.vehicleVin}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">{a.serviceName}</td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  {a.priceCents > 0 ? formatPrice(a.priceCents) : "—"}
                </td>
                <td className="px-3 py-2">
                  <StatusSelect value={a.status} onChange={(s) => onStatus(a.id, s)} />
                </td>
                <td className="max-w-[14rem] truncate px-3 py-2 text-xs text-slate-500" title={a.notes}>
                  {a.notes}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 text-sm">
              <td colSpan={4} className="px-3 py-2 font-semibold text-slate-900">
                Booked value (confirmed + completed)
              </td>
              <td className="px-3 py-2 font-semibold tabular-nums text-slate-900">
                {formatPrice(total)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: AppointmentStatus;
  onChange: (s: AppointmentStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AppointmentStatus)}
      className={`rounded border-0 px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[value]}`}
    >
      {APPOINTMENT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
