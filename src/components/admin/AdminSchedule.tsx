"use client";

/**
 * The shop's job book: upcoming appointments grouped by day, plus the
 * spreadsheet import. Upload a .xlsx/.csv schedule and it populates the
 * book; the per-row report from the server is shown as-is so bad rows are
 * fixable in the sheet and re-uploaded.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatTime12 } from "@/lib/time";
import { formatPrice } from "@/lib/services";

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
  status: string;
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

export default function AdminSchedule() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/schedule");
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const d = await res.json();
      setAppointments(d.appointments ?? []);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

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
      const res = await fetch("/api/admin/schedule/import", {
        method: "POST",
        body: form,
      });
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

  const byDate = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const day = byDate.get(a.date) ?? [];
    day.push(a);
    byDate.set(a.date, day);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Shop schedule</h1>
        <button onClick={() => void logout()} className="text-sm text-slate-500 underline">
          Sign out
        </button>
      </div>

      {/* ------------------------------------------------------ Sheet import */}
      <section className="rounded-lg bg-white p-5 shadow-sm">
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
            className="shrink-0 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
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
                  className={r.status === "skipped" ? "text-red-700" : r.message ? "text-amber-700" : "text-slate-600"}
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

      {/* --------------------------------------------------------- Job book */}
      <section>
        <h2 className="font-semibold text-slate-900">Next two weeks</h2>
        {loading ? (
          <p className="mt-2 text-sm text-slate-500">Loading…</p>
        ) : byDate.size === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Nothing on the book.</p>
        ) : (
          [...byDate.entries()].map(([date, day]) => (
            <div key={date} className="mt-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-accent-dark">
                {date}
              </h3>
              <ul className="mt-1 divide-y divide-slate-200 rounded-lg bg-white shadow-sm">
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
                    <span className="ml-auto flex items-center gap-2">
                      {a.source === "import" && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                          sheet
                        </span>
                      )}
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          a.status === "CONFIRMED"
                            ? "bg-sky-100 text-sky-800"
                            : a.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {a.status.toLowerCase().replace("_", " ")}
                      </span>
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
          ))
        )}
      </section>
    </div>
  );
}
