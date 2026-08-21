"use client";

/**
 * Vehicle identification: VIN decode, or year → make → model by hand.
 *
 * The two paths converge on the same `Vehicle` value, and they feed each
 * other — decoding a VIN pre-selects the year and make in the dropdowns and
 * leaves the model list ready to pick from, because a VIN alone can't name the
 * model. Nothing here is blocking: every field stays editable, so a decode
 * that lands slightly wrong is one tap to correct rather than a dead end.
 *
 * Everything runs in the browser — the VIN math and the catalog are pure,
 * bundled code (the XAT Racing approach), so this component works identically
 * on a Node deployment and on a fully static build with no server at all.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  VEHICLE_CLASSES,
  VEHICLE_CLASS_LABELS,
  canonicalMake,
  makesForYear,
  type VehicleClass,
  years as catalogYears,
} from "@/lib/vehicle-catalog";
import {
  LocalVehicleProvider,
  localModelsFor,
  type VehicleIdentity,
} from "@/lib/vehicle-provider";
import { normalizeVin } from "@/lib/vin";
import { fitmentSummary, matchFitment } from "@/lib/xat-fitment";

export type Vehicle = {
  vin: string;
  year: string;
  make: string;
  model: string;
  trim: string;
  vehicleClass: VehicleClass;
};

export const EMPTY_VEHICLE: Vehicle = {
  vin: "",
  year: "",
  make: "",
  model: "",
  trim: "",
  vehicleClass: "sedan",
};

type Props = {
  value: Vehicle;
  onChange: (v: Vehicle) => void;
};

const YEARS = catalogYears();
const LOCAL = new LocalVehicleProvider();

export default function VehiclePicker({ value, onChange }: Props) {
  // Several pickers can share a page (home quote tool + scheduler).
  const vinId = useId();
  const [decoding, setDecoding] = useState(false);
  const [decode, setDecode] = useState<VehicleIdentity | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);
  /** Set when the class came from a decode, so manual edits aren't overwritten. */
  const classTouched = useRef(false);

  const set = useCallback(
    (patch: Partial<Vehicle>) => onChange({ ...value, ...patch }),
    [onChange, value],
  );

  // The cascade reads the bundled catalog directly — no round-trips.
  const makes = useMemo(
    () => (value.year ? makesForYear(Number(value.year)) : []),
    [value.year],
  );
  const models = useMemo(
    () =>
      value.year && value.make ? localModelsFor(value.make, Number(value.year)) : [],
    [value.year, value.make],
  );

  // Picking a model sets the service class, unless the user overrode it.
  useEffect(() => {
    if (classTouched.current || !value.model) return;
    const m = models.find((x) => x.name === value.model);
    if (m && m.vehicleClass !== value.vehicleClass) {
      onChange({ ...value, vehicleClass: m.vehicleClass });
    }
  }, [models, value, onChange]);

  async function runDecode() {
    const vin = value.vin.trim();
    if (!vin) {
      setVinError("Enter a VIN first.");
      return;
    }

    setDecoding(true);
    setVinError(null);
    try {
      const data = await LOCAL.decodeVin(normalizeVin(vin));

      if (data.decoded && !data.decoded.valid) {
        setDecode(data);
        setVinError(data.decoded.errors.join(" "));
        return;
      }

      // The local decode gives make/year instantly, offline. For model +
      // trim, do what the XAT Racing site does (assets/js/ymm.js): call
      // NHTSA vPIC straight from the browser — free, keyless, CORS-open.
      // Best-effort: any failure just leaves the model dropdown for the
      // customer.
      let model = data.model;
      let trim = data.trim;
      let year = data.year;
      let make = data.make;
      let notes = data.notes;
      if (!model) {
        const live = await browserVpicDecode(vin);
        if (live) {
          model = live.model ?? model;
          trim = live.trim ?? trim;
          year = live.year ?? year;
          make = live.make ?? make;
          notes = notes.filter((n) => !n.startsWith("Model and trim"));
        }
      }
      setDecode({ ...data, model, trim, year, make, notes });

      classTouched.current = false;
      onChange({
        ...value,
        year: year ? String(year) : value.year,
        make: make ?? value.make,
        model: model ?? "",
        trim: trim ?? "",
        vehicleClass: data.vehicleClass,
      });
    } catch {
      setVinError("Couldn't decode that VIN. Enter the vehicle by hand below.");
    } finally {
      setDecoding(false);
    }
  }

  const decoded = decode?.decoded;

  // XAT platform fitment: classic Toyota/Lexus chassis + engine info, shown
  // whenever the selected vehicle lands on a supported platform.
  const fitment = value.year && value.make && value.model
    ? matchFitment(Number(value.year), value.make, value.model)
    : null;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- VIN */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor={vinId} className="block text-sm font-semibold text-slate-900">
          VIN <span className="font-normal text-slate-500">(optional — fastest way)</span>
        </label>
        <p className="mt-1 text-xs text-slate-500">
          17 characters, on the driver&apos;s door jamb or through the base of the
          windshield.
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id={vinId}
            value={value.vin}
            onChange={(e) => set({ vin: e.target.value.toUpperCase() })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runDecode();
              }
            }}
            maxLength={17}
            spellCheck={false}
            autoComplete="off"
            placeholder="1HGCM82633A004352"
            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm uppercase tracking-wider focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <button
            type="button"
            onClick={() => void runDecode()}
            disabled={decoding}
            className="shrink-0 rounded-md bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:opacity-50"
          >
            {decoding ? "Decoding…" : "Decode VIN"}
          </button>
        </div>

        {vinError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {vinError}
          </p>
        )}

        {decoded?.valid && (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-slate-50 p-3 text-xs sm:grid-cols-4">
            <Fact label="Manufacturer" value={decoded.manufacturer} />
            <Fact label="Built in" value={decoded.country} />
            <Fact label="Model year" value={decode?.year ? String(decode.year) : null} />
            <Fact
              label="Check digit"
              value={
                decoded.checkDigitValid === null
                  ? null
                  : decoded.checkDigitValid
                    ? "Valid"
                    : "Not verified"
              }
            />
          </dl>
        )}

        {decode?.notes?.map((n) => (
          <p key={n} className="mt-2 text-xs text-amber-700">
            {n}
          </p>
        ))}
      </section>

      {/* --------------------------------------------------- Year/Make/Model */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Field label="Year">
          <select
            value={value.year}
            onChange={(e) => set({ year: e.target.value, make: "", model: "" })}
            className={selectClass}
          >
            <option value="">Select…</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Make">
          <select
            value={value.make}
            onChange={(e) => set({ make: e.target.value, model: "" })}
            disabled={!value.year}
            className={selectClass}
          >
            <option value="">{value.year ? "Select…" : "Pick a year first"}</option>
            {makes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Model">
          <select
            value={value.model}
            onChange={(e) => set({ model: e.target.value })}
            disabled={!value.make}
            className={selectClass}
          >
            <option value="">{value.make ? "Select…" : "Pick a make first"}</option>
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
            <option value="Other">Other / not listed</option>
          </select>
        </Field>
      </section>

      {fitment && (
        <p className="rounded-md border border-navy-200 bg-navy-50 px-3 py-2 text-sm text-navy-900">
          <strong>{fitment.model}</strong> — {fitmentSummary(fitment)}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Trim / engine" hint="optional">
          <input
            value={value.trim}
            onChange={(e) => set({ trim: e.target.value })}
            placeholder="EX-L, 2.4L, 4WD…"
            className={selectClass}
          />
        </Field>

        <Field label="Vehicle type" hint="affects labor time">
          <select
            value={value.vehicleClass}
            onChange={(e) => {
              classTouched.current = true;
              set({ vehicleClass: e.target.value as VehicleClass });
            }}
            className={selectClass}
          >
            {VEHICLE_CLASSES.map((c) => (
              <option key={c} value={c}>
                {VEHICLE_CLASS_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </section>
    </div>
  );
}

/**
 * Browser-side NHTSA vPIC decode — the XAT Racing pattern. Returns null on
 * any failure (offline, blocked, malformed) so callers can fall through to
 * manual selection.
 */
async function browserVpicDecode(vin: string): Promise<{
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
} | null> {
  try {
    const res = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
      { signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { Results?: Array<Record<string, string>> };
    const r = data.Results?.[0];
    if (!r) return null;
    const clean = (k: string) => {
      const v = r[k]?.trim();
      return v && v !== "Not Applicable" ? v : null;
    };
    const makeRaw = clean("Make");
    return {
      year: Number(clean("ModelYear")) || null,
      // vPIC yells makes in caps ("TOYOTA"); title-case for the dropdown.
      // canonicalMake fixes vPIC's casing ("BMW" not "Bmw"); unknown makes
      // keep a title-cased best effort.
      make: makeRaw
        ? canonicalMake(makeRaw) ??
          makeRaw.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
        : null,
      model: clean("Model"),
      trim: clean("Trim") ?? clean("Series"),
    };
  } catch {
    return null;
  }
}

const selectClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:bg-slate-100 disabled:text-slate-400";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-900">
        {label}
        {hint && <span className="ml-1 font-normal text-slate-500">({hint})</span>}
      </span>
      {children}
    </label>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
