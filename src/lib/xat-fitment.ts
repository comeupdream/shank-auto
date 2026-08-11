/**
 * XAT Racing platform fitment — ported from comeupdream/XATRACING
 * (assets/data/ymm.json + the matcher in assets/js/ymm.js).
 *
 * XAT's YMM system resolves a year/make/model (typed or VIN-decoded) to a
 * *platform*: chassis code + the engines that fit it. For the repair shop
 * this rides along as enrichment — when a customer's vehicle lands on one of
 * these classic Toyota/Lexus platforms, the picker shows the chassis and
 * stock engine, which is exactly the vocabulary parts lookup speaks.
 *
 * The table is XAT's curated fitment data verbatim (their note: replaceable
 * with licensed ACES data later). The matcher reproduces ymm.js's logic:
 * make equal, year in range, model matched loosely in both directions so
 * vPIC's "LS" or a customer's "LS400" both land on "LS400 (UCF20)".
 */

export type Fitment = {
  make: string;
  model: string;
  from: number;
  to: number;
  /** Platform/chassis code — the id XAT's catalog filters by. */
  chassis: string;
  /** Engines that fit the platform (swaps included). */
  engines: string[];
  /** Engine(s) the platform shipped with. */
  stock: string[];
};

type Row = [
  make: string,
  model: string,
  from: number,
  to: number,
  chassis: string,
  engines: string,
  stock: string,
];

// assets/data/ymm.json, one row per vehicle entry.
const TABLE: Row[] = [
  ["Lexus", "LS400 (UCF10)", 1990, 1994, "UCF10", "1UZ,2JZ", "1UZ"],
  ["Lexus", "LS400 (UCF20)", 1995, 2000, "UCF20", "1UZ,2JZ", "1UZ"],
  ["Toyota", "Celsior (UCF10/20)", 1989, 2000, "UCF20", "1UZ", "1UZ"],
  ["Lexus", "SC300", 1992, 2000, "Z30", "2JZ,1JZ,1UZ", "2JZ"],
  ["Lexus", "SC400", 1992, 2000, "Z30", "1UZ,3UZ,2JZ", "1UZ"],
  ["Toyota", "Soarer (Z30)", 1991, 2000, "Z30", "1JZ,1UZ,2JZ", "1JZ,1UZ"],
  ["Lexus", "GS400", 1998, 2000, "2GS", "1UZ,2JZ", "1UZ"],
  ["Lexus", "GS430", 2001, 2005, "2GS", "3UZ,2JZ", "3UZ"],
  ["Toyota", "Aristo (JZS147/161)", 1991, 2004, "2GS", "2JZ,1UZ", "2JZ"],
  ["Lexus", "IS300", 2001, 2005, "IS300", "2JZ,1UZ,1JZ", "2JZ"],
  ["Toyota", "Altezza (XE10)", 1998, 2005, "IS300", "2JZ,1UZ", "2JZ"],
  ["Lexus", "LS430", 2001, 2006, "LS430", "3UZ", "3UZ"],
  ["Lexus", "SC430", 2002, 2010, "SC430", "3UZ,2JZ", "3UZ"],
  ["Toyota", "Supra MkIII (A70)", 1986, 1992, "A70", "1JZ,2JZ", "1JZ"],
  ["Toyota", "Supra MkIV (A80)", 1993, 2002, "A80", "2JZ", "2JZ"],
  ["Toyota", "Supra MkV / GR (A90)", 2020, 2026, "A90", "", ""],
  ["Toyota", "Crown (JZS155/170)", 1995, 2003, "CROWN", "1JZ,2JZ", "1JZ,2JZ"],
  ["Toyota", "Crown Majesta (UZS/URS)", 2004, 2012, "CROWN", "3UZ,1UR", "3UZ,1UR"],
  ["Toyota", "Century V12 (GZG50)", 1997, 2017, "CENTURY", "1GZ", "1GZ"],
  ["Toyota", "Tacoma / X-Runner", 2005, 2015, "TACOMA", "1UZ,3UR", ""],
  ["Toyota", "Tundra (2nd gen)", 2007, 2021, "TUNDRA", "3UR,2UZ", "3UR,2UZ"],
  ["Toyota", "Sequoia (2nd gen)", 2008, 2021, "TUNDRA", "3UR", "3UR"],
  ["Toyota", "Land Cruiser 70 series", 1985, 2004, "LC70", "1UZ,2UZ", ""],
  ["Toyota", "Land Cruiser 80 series", 1990, 1997, "LC80", "1UZ,2UZ,3UR", ""],
  ["Toyota", "Land Cruiser 100/200", 1998, 2021, "LC100", "2UZ,3UR", "2UZ,3UR"],
  ["Lexus", "LX470 / LX570", 1998, 2021, "LC100", "2UZ,3UR", "2UZ,3UR"],
  ["Lexus", "GX470", 2003, 2009, "GX470", "2UZ", "2UZ"],
  ["Toyota", "4Runner (4th gen V8)", 2003, 2009, "GX470", "2UZ", "2UZ"],
];

export const FITMENTS: Fitment[] = TABLE.map(
  ([make, model, from, to, chassis, engines, stock]) => ({
    make,
    model,
    from,
    to,
    chassis,
    engines: engines ? engines.split(",") : [],
    stock: stock ? stock.split(",") : [],
  }),
);

/**
 * Resolve a year/make/model to an XAT platform. Ported from ymm.js: make must
 * match (case-insensitive), the year must fall in the run, and the model
 * matches loosely in either direction — the fitment row's model contains the
 * given model ("LS" → "LS400 (UCF20)"), or the given model contains the
 * row's first word ("Supra Turbo" → "Supra MkIV (A80)").
 */
export function matchFitment(
  year: number,
  make: string,
  model: string,
): Fitment | null {
  const mk = make.trim().toLowerCase();
  const md = model.trim().toLowerCase();
  if (!mk || !md || !year) return null;

  return (
    FITMENTS.find((f) => {
      if (f.make.toLowerCase() !== mk) return false;
      if (year < f.from || year > f.to) return false;
      const fm = f.model.toLowerCase();
      return fm.includes(md) || md.includes(fm.split(" ")[0]);
    }) ?? null
  );
}

/** One-line platform summary for the UI, e.g. "UCF20 platform · stock 1UZ". */
export function fitmentSummary(f: Fitment): string {
  const engine = f.stock.length
    ? ` · stock ${f.stock.join("/")}`
    : f.engines.length
      ? ` · fits ${f.engines.join("/")}`
      : "";
  return `${f.chassis} platform${engine}`;
}
