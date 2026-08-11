/**
 * Vehicle-data providers.
 *
 * Two things can identify a vehicle for us:
 *
 *   1. The local catalog + VIN math (`vehicle-catalog.ts`, `vin.ts`). Always
 *      available, instant, no key, no network. Gives make / model year /
 *      country from the VIN, and a full year→make→model tree.
 *   2. A remote catalog, which can resolve the *model and trim* out of a VIN's
 *      VDS section — something no offline table can do, because each
 *      manufacturer encodes positions 4-8 its own way.
 *
 * The provider interface below lets (2) be swapped without touching the UI or
 * the API routes. `local` is the default and the floor; every remote provider
 * decorates it and falls back to it on any error, so a provider outage
 * degrades the site to "customer picks year/make/model by hand" rather than
 * breaking the estimate form.
 *
 * Selected with the `VEHICLE_DATA_PROVIDER` env var.
 */

import {
  type Model,
  type VehicleClass,
  allModelsFor,
  canonicalMake,
  classifyVehicle,
  findModel,
  makesForYear,
  modelsFor,
} from "./vehicle-catalog.ts";
import { type DecodedVin, decodeVin, normalizeVin } from "./vin.ts";

export type VehicleIdentity = {
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  vehicleClass: VehicleClass;
  /** Where each field came from, so the UI can say "decoded" vs "you entered". */
  source: "vin" | "catalog" | "manual";
  /** Provider that answered, for debugging. */
  provider: string;
  /** Non-fatal notes worth showing the customer (e.g. ambiguous model year). */
  notes: string[];
  /** Raw VIN decode, present whenever a VIN was supplied. */
  decoded: DecodedVin | null;
};

export interface VehicleDataProvider {
  readonly name: string;
  /** Identify a vehicle from a VIN. */
  decodeVin(vin: string): Promise<VehicleIdentity>;
  /** Makes available for a model year. */
  makesForYear(year: number): Promise<string[]>;
  /** Models a make offered in a model year. */
  modelsFor(make: string, year: number): Promise<Model[]>;
}

// ---------------------------------------------------------------------------
// Local provider — the always-available floor
// ---------------------------------------------------------------------------

export class LocalVehicleProvider implements VehicleDataProvider {
  readonly name = "local";

  async decodeVin(vin: string): Promise<VehicleIdentity> {
    return localIdentity(vin, this.name);
  }

  async makesForYear(year: number): Promise<string[]> {
    return makesForYear(year);
  }

  async modelsFor(make: string, year: number): Promise<Model[]> {
    const canonical = canonicalMake(make);
    if (!canonical) return [];
    const inYear = modelsFor(canonical, year);
    // A year outside the catalog's range shouldn't leave the dropdown empty.
    return inYear.length > 0 ? inYear : allModelsFor(canonical);
  }
}

function localIdentity(vin: string, provider: string): VehicleIdentity {
  const decoded = decodeVin(vin);
  const notes: string[] = [];

  if (decoded.modelYearAlternatives.length > 0 && decoded.modelYear !== null) {
    notes.push(
      `Model year could also be ${decoded.modelYearAlternatives.join(" or ")} — ` +
        `the VIN year code repeats every 30 years. Confirm with the customer.`,
    );
  }
  if (decoded.valid && decoded.make === null) {
    notes.push(
      `VIN prefix "${decoded.positions.wmi}" isn't in our manufacturer table — ` +
        `please pick the make by hand.`,
    );
  }
  notes.push("Model and trim can't be read from a VIN offline — please select the model.");

  return {
    vin: decoded.vin || null,
    year: decoded.modelYear,
    make: decoded.make,
    model: null,
    trim: null,
    vehicleClass: classifyVehicle(
      [decoded.modelYear, decoded.make].filter(Boolean).join(" "),
    ),
    source: decoded.valid ? "vin" : "manual",
    provider,
    notes,
    decoded,
  };
}

// ---------------------------------------------------------------------------
// NHTSA vPIC provider
// ---------------------------------------------------------------------------

/**
 * The US DOT's free, key-less VIN decoder. It resolves model and body class
 * from the VDS for essentially every vehicle sold in the US, which is exactly
 * the gap the local decoder can't close.
 *
 * NOTE: this container's egress policy blocks `vpic.nhtsa.dot.gov`, so this
 * path cannot be exercised from the dev sandbox — it is written against the
 * documented response shape and falls back to the local provider on any
 * error, including the sandbox's connection refusal. Verify it once in an
 * environment with outbound access before relying on it.
 */
export class VpicVehicleProvider implements VehicleDataProvider {
  readonly name = "vpic";
  private readonly local = new LocalVehicleProvider();
  private readonly base = "https://vpic.nhtsa.dot.gov/api/vehicles";
  private readonly timeoutMs = 4000;

  private async get<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.base}/${path}`, {
        signal: AbortSignal.timeout(this.timeoutMs),
        // vPIC data changes rarely; a day of caching is generous and keeps us
        // well clear of any fair-use throttling.
        next: { revalidate: 86_400 },
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  async decodeVin(vin: string): Promise<VehicleIdentity> {
    const fallback = localIdentity(vin, this.name);
    // Don't spend a request on a VIN we already know is malformed.
    if (!fallback.decoded?.valid) return fallback;

    const year = fallback.year;
    const query = year ? `?format=json&modelyear=${year}` : "?format=json";
    const body = await this.get<{ Results?: Array<Record<string, string>> }>(
      `DecodeVinValues/${normalizeVin(vin)}${query}`,
    );
    const r = body?.Results?.[0];
    if (!r) {
      return {
        ...fallback,
        notes: [
          ...fallback.notes,
          "Live VIN lookup was unavailable — showing what the VIN itself encodes.",
        ],
      };
    }

    const value = (k: string): string | null => {
      const v = r[k]?.trim();
      return v && v !== "Not Applicable" ? v : null;
    };

    const make = value("Make");
    const model = value("Model");
    const remoteYear = Number(value("ModelYear")) || null;
    const bodyClass = value("BodyClass");
    const canonical = make ? canonicalMake(make) : null;

    const catalogModel =
      canonical && model ? findModel(canonical, model, remoteYear ?? undefined) : null;

    return {
      vin: fallback.vin,
      year: remoteYear ?? fallback.year,
      make: canonical ?? make ?? fallback.make,
      model: catalogModel?.name ?? model,
      trim: value("Trim") ?? value("Series"),
      vehicleClass:
        catalogModel?.vehicleClass ??
        classFromBodyClass(bodyClass) ??
        classifyVehicle([remoteYear, make, model].filter(Boolean).join(" ")),
      source: "vin",
      provider: this.name,
      // The remote answer supersedes the local "can't read the model" caveat.
      notes: fallback.notes.filter((n) => !n.startsWith("Model and trim")),
      decoded: fallback.decoded,
    };
  }

  async makesForYear(year: number): Promise<string[]> {
    // vPIC's per-year make list runs to thousands of entries including trailer
    // and motorcycle manufacturers, which makes for a hostile dropdown. The
    // curated catalog is the better answer here.
    return this.local.makesForYear(year);
  }

  async modelsFor(make: string, year: number): Promise<Model[]> {
    const local = await this.local.modelsFor(make, year);
    const body = await this.get<{ Results?: Array<{ Model_Name?: string }> }>(
      `GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`,
    );
    const remote = body?.Results ?? [];
    if (remote.length === 0) return local;

    // Union: catalog entries keep their curated body class; anything vPIC
    // knows about that we don't gets appended with a guessed class.
    const byName = new Map(local.map((m) => [m.name.toLowerCase(), m]));
    for (const { Model_Name } of remote) {
      const name = Model_Name?.trim();
      if (!name || byName.has(name.toLowerCase())) continue;
      byName.set(name.toLowerCase(), {
        name,
        from: year,
        to: null,
        vehicleClass: classifyVehicle(`${year} ${make} ${name}`),
      });
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }
}

/** Map vPIC's `BodyClass` vocabulary onto our five service classes. */
function classFromBodyClass(bodyClass: string | null): VehicleClass | null {
  if (!bodyClass) return null;
  const b = bodyClass.toLowerCase();
  if (b.includes("pickup")) return "truck";
  if (b.includes("minivan")) return "minivan";
  if (b.includes("van")) return "van";
  if (b.includes("sport utility") || b.includes("suv") || b.includes("crossover")) {
    return "suv";
  }
  if (b.includes("sedan") || b.includes("coupe") || b.includes("hatchback") ||
      b.includes("convertible") || b.includes("wagon")) {
    return "sedan";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

let cached: VehicleDataProvider | null = null;

/**
 * The provider this deployment uses. Set `VEHICLE_DATA_PROVIDER=vpic` to turn
 * on live model/trim decoding; anything else (or unset) stays fully offline.
 */
export function getVehicleProvider(): VehicleDataProvider {
  if (cached) return cached;
  cached = process.env.VEHICLE_DATA_PROVIDER === "vpic"
    ? new VpicVehicleProvider()
    : new LocalVehicleProvider();
  return cached;
}
