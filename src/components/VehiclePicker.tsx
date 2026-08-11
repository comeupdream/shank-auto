"use client";

/**
 * Vehicle identification: VIN decode, or year → make → model by hand.
 *
 * The two paths converge on the same `Vehicle` value, and they feed each
 * other — decoding a VIN pre-selects the year and make in the dropdowns and
 * leaves the model list ready to pick from, because a VIN alone can't name the
 * model. Nothing here is blocking: every field stays editable, so a decode
 * that lands slightly wrong is one tap to correct rather than a dead end.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  VEHICLE_CLASSES,
  VEHICLE_CLASS_LABELS,
  type Model,
  type VehicleClass,
  years as catalogYears,
} from "@/lib/vehicle-catalog";

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

type DecodeResponse = {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vehicleClass: VehicleClass;
  notes: string[];
  decoded: {
    valid: boolean;
    errors: string[];
    checkDigitValid: boolean | null;
    positions: Record<string, string>;
    country: string | null;
    manufacturer: string | null;
  } | null;
};

const YEARS = catalogYears();

export default function VehiclePicker({ value, onChange }: Props) {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [decoding, setDecoding] = useState(false);
  const [decode, setDecode] = useState<DecodeResponse | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);
  /** Set when the class came from a decode, so manual edits aren't overwritten. */
  const classTouched = useRef(false);

  const set = useCallback(
    (patch: Partial<Vehicle>) => onChange({ ...value, ...patch }),
    [onChange, value],
  );

  // Year → makes.
  useEffect(() => {
    if (!value.year) {
      setMakes([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/ymm?year=${value.year}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setMakes(d.makes ?? []);
      })
      .catch(() => {
        if (!cancelled) setMakes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [value.year]);

  // Year + make → models.
  useEffect(() => {
    if (!value.year || !value.make) {
      setModels([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/ymm?year=${value.year}&make=${encodeURIComponent(value.make)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setModels(d.models ?? []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      });
    return () => {
      cancelled = true;
    };
  }, [value.year, value.make]);

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
      const res = await fetch(`/api/vin/${encodeURIComponent(vin)}`);
      const data: DecodeResponse = await res.json();
      setDecode(data);

      if (data.decoded && !data.decoded.valid) {
        setVinError(data.decoded.errors.join(" "));
        return;
      }

      classTouched.current = false;
      onChange({
        ...value,
        year: data.year ? String(data.year) : value.year,
        make: data.make ?? value.make,
        model: data.model ?? "",
        trim: data.trim ?? "",
        vehicleClass: data.vehicleClass,
      });
    } catch {
      setVinError("Couldn't reach the decoder. Enter the vehicle by hand below.");
    } finally {
      setDecoding(false);
    }
  }

  const decoded = decode?.decoded;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- VIN */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor="vin" className="block text-sm font-semibold text-slate-900">
          VIN <span className="font-normal text-slate-500">(optional — fastest way)</span>
        </label>
        <p className="mt-1 text-xs text-slate-500">
          17 characters, on the driver&apos;s door jamb or through the base of the
          windshield.
        </p>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="vin"
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm uppercase tracking-wider focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <button
            type="button"
            onClick={() => void runDecode()}
            disabled={decoding}
            className="shrink-0 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
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

const selectClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400";

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
