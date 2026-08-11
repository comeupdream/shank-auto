/**
 * VIN decoding (ISO 3779 / 49 CFR 565) — pure, offline, no network.
 *
 * This is the trustworthy half of vehicle identification: everything here is
 * derivable from the 17 characters themselves plus a static WMI table, so it
 * works with no API key, no rate limit, and no outbound request. It gives us
 * make, model year, country, and assembly plant.
 *
 * What a VIN alone CANNOT tell you is the model and trim — those live in the
 * VDS (positions 4-8), which every manufacturer encodes differently and which
 * no public spec covers. For that we enrich with a vehicle-data provider (see
 * `src/lib/vehicle-provider.ts`); this module is the always-available floor
 * that the provider layers on top of.
 */

export type VinPosition = {
  wmi: string; // 1-3   world manufacturer identifier
  vds: string; // 4-8   vehicle descriptor section (make-specific)
  checkDigit: string; // 9     check digit (North America)
  yearCode: string; // 10    model year
  plantCode: string; // 11    assembly plant
  serial: string; // 12-17 sequential serial
};

export type DecodedVin = {
  vin: string;
  valid: boolean;
  /** Reasons the VIN failed validation. Empty when `valid` is true. */
  errors: string[];
  /** True when the position-9 check digit matches. Only meaningful in NA. */
  checkDigitValid: boolean | null;
  positions: VinPosition;
  make: string | null;
  manufacturer: string | null;
  country: string | null;
  modelYear: number | null;
  /** Other plausible model years — the year code repeats on a 30-year cycle. */
  modelYearAlternatives: number[];
};

/** Characters I, O and Q are excluded from VINs to avoid 1/0 confusion. */
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

/** Transliteration values for the check-digit calculation (49 CFR 565.15). */
const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4,
  "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
};

/** Positional weights for the check digit; position 9 itself carries 0. */
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

/**
 * Model-year codes, in cycle order. The sequence repeats every 30 years, so
 * "N" means 1992 *or* 2022 — see `decodeModelYear` for how we disambiguate.
 */
const YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";

export function normalizeVin(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function isValidVinFormat(vin: string): boolean {
  return VIN_RE.test(normalizeVin(vin));
}

/**
 * The check digit a VIN *should* carry at position 9, as a single character
 * ("0"-"9" or "X"). Returns null if the VIN has characters we can't weigh.
 */
export function computeCheckDigit(vin: string): string | null {
  const v = normalizeVin(vin);
  if (v.length !== 17) return null;

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const value = TRANSLITERATION[v[i]];
    if (value === undefined) return null;
    sum += value * WEIGHTS[i];
  }

  const remainder = sum % 11;
  return remainder === 10 ? "X" : String(remainder);
}

export function hasValidCheckDigit(vin: string): boolean {
  const expected = computeCheckDigit(vin);
  return expected !== null && expected === normalizeVin(vin)[8];
}

/**
 * Model year from position 10.
 *
 * The 30-character code cycle repeats, so each code maps to several years. We
 * disambiguate with the long-standing convention that position 11 (the plant
 * code) is alphabetic and position 7 is numeric for 1980-2009 vehicles but
 * alphabetic for 2010+. That rule holds for the overwhelming majority of
 * passenger vehicles; we still return the alternatives so callers can offer a
 * correction rather than silently pick wrong.
 */
export function decodeModelYear(
  vin: string,
  now = new Date(),
): { year: number | null; alternatives: number[] } {
  const v = normalizeVin(vin);
  if (v.length !== 17) return { year: null, alternatives: [] };

  const index = YEAR_CODES.indexOf(v[9]);
  if (index === -1) return { year: null, alternatives: [] };

  // Every year whose code matches, from 1980 up to next model year.
  const maxYear = now.getFullYear() + 1;
  const candidates: number[] = [];
  for (let y = 1980 + index; y <= maxYear; y += 30) candidates.push(y);
  if (candidates.length === 0) return { year: null, alternatives: [] };

  const seventhIsDigit = /[0-9]/.test(v[6]);
  // Newest candidate that agrees with the position-7 convention, else newest.
  const picked = seventhIsDigit
    ? candidates.find((y) => y <= 2009) ?? candidates[0]
    : candidates.filter((y) => y >= 2010).pop() ?? candidates[candidates.length - 1];

  return {
    year: picked,
    alternatives: candidates.filter((y) => y !== picked),
  };
}

/**
 * Region/country of the assembly plant, from the first VIN character (and the
 * second for finer splits). Coarse by design — the WMI table below is the
 * authority when it has an entry.
 */
export function decodeCountry(vin: string): string | null {
  const c = normalizeVin(vin)[0];
  if (!c) return null;

  const byFirstChar: Record<string, string> = {
    "1": "United States", "4": "United States", "5": "United States",
    "2": "Canada",
    "3": "Mexico",
    "6": "Australia",
    "7": "New Zealand",
    "8": "Argentina / Chile",
    "9": "Brazil",
    J: "Japan",
    K: "South Korea",
    L: "China",
    M: "India / Indonesia / Thailand",
    N: "Turkey",
    P: "Philippines / Malaysia",
    R: "Taiwan / United Arab Emirates",
    S: "United Kingdom",
    T: "Switzerland / Czechia / Hungary",
    U: "Denmark / Slovakia",
    V: "France / Spain / Austria",
    W: "Germany",
    X: "Russia / Netherlands / Latvia",
    Y: "Sweden / Finland / Belgium",
    Z: "Italy",
  };

  return byFirstChar[c] ?? null;
}

/**
 * World Manufacturer Identifier → { make, manufacturer }.
 *
 * Keyed by the 3-character WMI, with a 2-character fallback for
 * low-volume manufacturers (whose WMI third character is a series code).
 * Covers the makes a Virginia general-repair shop actually sees; anything
 * missing falls through to the provider lookup and, failing that, to the
 * customer's own year/make/model entry.
 */
const WMI: Record<string, { make: string; manufacturer: string }> = {
  // ---------------------------------------------------------------- Honda
  "1HG": { make: "Honda", manufacturer: "Honda of America" },
  "2HG": { make: "Honda", manufacturer: "Honda Canada" },
  "2HK": { make: "Honda", manufacturer: "Honda Canada" },
  "5FN": { make: "Honda", manufacturer: "Honda of America" },
  "5J6": { make: "Honda", manufacturer: "Honda of America" },
  "5KB": { make: "Honda", manufacturer: "Honda of America" },
  JHM: { make: "Honda", manufacturer: "Honda Motor Co." },
  JHL: { make: "Honda", manufacturer: "Honda Motor Co." },
  SHH: { make: "Honda", manufacturer: "Honda UK" },
  "19U": { make: "Acura", manufacturer: "Honda of America" },
  JH4: { make: "Acura", manufacturer: "Honda Motor Co." },
  "5J8": { make: "Acura", manufacturer: "Honda of America" },

  // ---------------------------------------------------------------- Toyota
  JTD: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  JTE: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  JTF: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  JTG: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  JTH: { make: "Lexus", manufacturer: "Toyota Motor Corp." },
  JTJ: { make: "Lexus", manufacturer: "Toyota Motor Corp." },
  JTK: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  JTL: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  JTM: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  JTN: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  "4T1": { make: "Toyota", manufacturer: "Toyota Motor Manufacturing" },
  "4T3": { make: "Toyota", manufacturer: "Toyota Motor Manufacturing" },
  "5TD": { make: "Toyota", manufacturer: "Toyota Motor Manufacturing" },
  "5TB": { make: "Toyota", manufacturer: "Toyota Motor Manufacturing" },
  "5TF": { make: "Toyota", manufacturer: "Toyota Motor Manufacturing" },
  "2T1": { make: "Toyota", manufacturer: "Toyota Canada" },
  "2T2": { make: "Lexus", manufacturer: "Toyota Canada" },
  "2T3": { make: "Toyota", manufacturer: "Toyota Canada" },
  "3TM": { make: "Toyota", manufacturer: "Toyota Mexico" },
  "58A": { make: "Lexus", manufacturer: "Toyota Motor Manufacturing" },

  // ------------------------------------------------------------------ Ford
  "1FA": { make: "Ford", manufacturer: "Ford Motor Company" },
  "1FB": { make: "Ford", manufacturer: "Ford Motor Company" },
  "1FC": { make: "Ford", manufacturer: "Ford Motor Company" },
  "1FD": { make: "Ford", manufacturer: "Ford Motor Company" },
  "1FM": { make: "Ford", manufacturer: "Ford Motor Company" },
  "1FT": { make: "Ford", manufacturer: "Ford Motor Company" },
  "2FA": { make: "Ford", manufacturer: "Ford Canada" },
  "2FM": { make: "Ford", manufacturer: "Ford Canada" },
  "2FT": { make: "Ford", manufacturer: "Ford Canada" },
  "3FA": { make: "Ford", manufacturer: "Ford Mexico" },
  "3FE": { make: "Ford", manufacturer: "Ford Mexico" },
  "5LM": { make: "Lincoln", manufacturer: "Ford Motor Company" },
  "5LT": { make: "Lincoln", manufacturer: "Ford Motor Company" },
  "1LN": { make: "Lincoln", manufacturer: "Ford Motor Company" },
  "1ME": { make: "Mercury", manufacturer: "Ford Motor Company" },
  "4M2": { make: "Mercury", manufacturer: "Ford Motor Company" },

  // -------------------------------------------------------------- GM group
  "1G1": { make: "Chevrolet", manufacturer: "General Motors" },
  "1GC": { make: "Chevrolet", manufacturer: "General Motors" },
  "1GN": { make: "Chevrolet", manufacturer: "General Motors" },
  "2G1": { make: "Chevrolet", manufacturer: "General Motors Canada" },
  "3GN": { make: "Chevrolet", manufacturer: "General Motors Mexico" },
  KL8: { make: "Chevrolet", manufacturer: "GM Korea" },
  "1GK": { make: "GMC", manufacturer: "General Motors" },
  "1GT": { make: "GMC", manufacturer: "General Motors" },
  "3GT": { make: "GMC", manufacturer: "General Motors Mexico" },
  "1G4": { make: "Buick", manufacturer: "General Motors" },
  "5GA": { make: "Buick", manufacturer: "General Motors" },
  KL4: { make: "Buick", manufacturer: "GM Korea" },
  "1G6": { make: "Cadillac", manufacturer: "General Motors" },
  "1GY": { make: "Cadillac", manufacturer: "General Motors" },
  "1G8": { make: "Saturn", manufacturer: "General Motors" },
  "1G2": { make: "Pontiac", manufacturer: "General Motors" },
  "1G3": { make: "Oldsmobile", manufacturer: "General Motors" },

  // ----------------------------------------------------------- Stellantis
  "1C3": { make: "Chrysler", manufacturer: "FCA US / Stellantis" },
  "1C4": { make: "Chrysler", manufacturer: "FCA US / Stellantis" },
  "2C3": { make: "Chrysler", manufacturer: "FCA Canada" },
  "2C4": { make: "Chrysler", manufacturer: "FCA Canada" },
  "3C4": { make: "Chrysler", manufacturer: "FCA Mexico" },
  "1B3": { make: "Dodge", manufacturer: "FCA US / Stellantis" },
  "1D4": { make: "Dodge", manufacturer: "FCA US / Stellantis" },
  "2B3": { make: "Dodge", manufacturer: "FCA Canada" },
  "2D4": { make: "Dodge", manufacturer: "FCA Canada" },
  "3D7": { make: "Dodge", manufacturer: "FCA Mexico" },
  "1J4": { make: "Jeep", manufacturer: "FCA US / Stellantis" },
  "1J8": { make: "Jeep", manufacturer: "FCA US / Stellantis" },
  "1C6": { make: "Ram", manufacturer: "FCA US / Stellantis" },
  "3C6": { make: "Ram", manufacturer: "FCA Mexico" },

  // ---------------------------------------------------------------- Nissan
  JN1: { make: "Nissan", manufacturer: "Nissan Motor Co." },
  JN6: { make: "Nissan", manufacturer: "Nissan Motor Co." },
  JN8: { make: "Nissan", manufacturer: "Nissan Motor Co." },
  "1N4": { make: "Nissan", manufacturer: "Nissan North America" },
  "1N6": { make: "Nissan", manufacturer: "Nissan North America" },
  "5N1": { make: "Nissan", manufacturer: "Nissan North America" },
  "3N1": { make: "Nissan", manufacturer: "Nissan Mexico" },
  JNK: { make: "Infiniti", manufacturer: "Nissan Motor Co." },
  JNR: { make: "Infiniti", manufacturer: "Nissan Motor Co." },
  "5N3": { make: "Infiniti", manufacturer: "Nissan North America" },

  // ------------------------------------------------------- Hyundai / Kia
  KMH: { make: "Hyundai", manufacturer: "Hyundai Motor Co." },
  KM8: { make: "Hyundai", manufacturer: "Hyundai Motor Co." },
  "5NP": { make: "Hyundai", manufacturer: "Hyundai Motor Manufacturing Alabama" },
  "5NM": { make: "Hyundai", manufacturer: "Hyundai Motor Manufacturing Alabama" },
  KNA: { make: "Kia", manufacturer: "Kia Corporation" },
  KND: { make: "Kia", manufacturer: "Kia Corporation" },
  KNM: { make: "Kia", manufacturer: "Kia Corporation" },
  "5XY": { make: "Kia", manufacturer: "Kia Georgia" },
  "5XX": { make: "Kia", manufacturer: "Kia Georgia" },
  KMT: { make: "Genesis", manufacturer: "Hyundai Motor Co." },

  // --------------------------------------------------------------- Subaru
  JF1: { make: "Subaru", manufacturer: "Fuji Heavy Industries" },
  JF2: { make: "Subaru", manufacturer: "Fuji Heavy Industries" },
  "4S3": { make: "Subaru", manufacturer: "Subaru of Indiana" },
  "4S4": { make: "Subaru", manufacturer: "Subaru of Indiana" },

  // ----------------------------------------------------------------- Mazda
  JM1: { make: "Mazda", manufacturer: "Mazda Motor Corp." },
  JM3: { make: "Mazda", manufacturer: "Mazda Motor Corp." },
  "4F2": { make: "Mazda", manufacturer: "Mazda North America" },
  "4F4": { make: "Mazda", manufacturer: "Mazda North America" },
  "3MZ": { make: "Mazda", manufacturer: "Mazda Mexico" },
  "3MV": { make: "Mazda", manufacturer: "Mazda Mexico" },

  // --------------------------------------------------------------- Mitsubishi
  JA3: { make: "Mitsubishi", manufacturer: "Mitsubishi Motors" },
  JA4: { make: "Mitsubishi", manufacturer: "Mitsubishi Motors" },
  "4A3": { make: "Mitsubishi", manufacturer: "Mitsubishi Motors NA" },
  "4A4": { make: "Mitsubishi", manufacturer: "Mitsubishi Motors NA" },

  // --------------------------------------------------------------- Germans
  WBA: { make: "BMW", manufacturer: "BMW AG" },
  WBS: { make: "BMW", manufacturer: "BMW M GmbH" },
  WBX: { make: "BMW", manufacturer: "BMW AG" },
  WBY: { make: "BMW", manufacturer: "BMW AG" },
  "5UX": { make: "BMW", manufacturer: "BMW Spartanburg" },
  "5YM": { make: "BMW", manufacturer: "BMW Spartanburg" },
  "4US": { make: "BMW", manufacturer: "BMW Spartanburg" },
  WMW: { make: "Mini", manufacturer: "BMW AG" },
  WDB: { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz AG" },
  WDC: { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz AG" },
  WDD: { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz AG" },
  W1K: { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz AG" },
  W1N: { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz AG" },
  "4JG": { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz Alabama" },
  WD3: { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz Vans" },
  WD4: { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz Vans" },
  WVW: { make: "Volkswagen", manufacturer: "Volkswagen AG" },
  WV1: { make: "Volkswagen", manufacturer: "Volkswagen AG" },
  WV2: { make: "Volkswagen", manufacturer: "Volkswagen AG" },
  "3VW": { make: "Volkswagen", manufacturer: "Volkswagen Mexico" },
  "1VW": { make: "Volkswagen", manufacturer: "Volkswagen Chattanooga" },
  WAU: { make: "Audi", manufacturer: "Audi AG" },
  WA1: { make: "Audi", manufacturer: "Audi AG" },
  TRU: { make: "Audi", manufacturer: "Audi Hungaria" },
  WP0: { make: "Porsche", manufacturer: "Porsche AG" },
  WP1: { make: "Porsche", manufacturer: "Porsche AG" },

  // --------------------------------------------------------------- Others
  YV1: { make: "Volvo", manufacturer: "Volvo Cars" },
  YV4: { make: "Volvo", manufacturer: "Volvo Cars" },
  LVY: { make: "Volvo", manufacturer: "Volvo Cars China" },
  "5YJ": { make: "Tesla", manufacturer: "Tesla, Inc." },
  "7SA": { make: "Tesla", manufacturer: "Tesla, Inc." },
  "7G2": { make: "Tesla", manufacturer: "Tesla, Inc." },
  LRW: { make: "Tesla", manufacturer: "Tesla Shanghai" },
  SAL: { make: "Land Rover", manufacturer: "Jaguar Land Rover" },
  SAJ: { make: "Jaguar", manufacturer: "Jaguar Land Rover" },
  ZFA: { make: "Fiat", manufacturer: "Fiat Group" },
  ZAR: { make: "Alfa Romeo", manufacturer: "Alfa Romeo" },
  ZAM: { make: "Maserati", manufacturer: "Maserati" },
};

/** Two-character WMI prefixes for low-volume manufacturers. */
const WMI_SHORT: Record<string, { make: string; manufacturer: string }> = {
  "1F": { make: "Ford", manufacturer: "Ford Motor Company" },
  "1G": { make: "General Motors", manufacturer: "General Motors" },
  JT: { make: "Toyota", manufacturer: "Toyota Motor Corp." },
  JH: { make: "Honda", manufacturer: "Honda Motor Co." },
  JN: { make: "Nissan", manufacturer: "Nissan Motor Co." },
  JM: { make: "Mazda", manufacturer: "Mazda Motor Corp." },
  JF: { make: "Subaru", manufacturer: "Fuji Heavy Industries" },
  KM: { make: "Hyundai", manufacturer: "Hyundai Motor Co." },
  KN: { make: "Kia", manufacturer: "Kia Corporation" },
  WB: { make: "BMW", manufacturer: "BMW AG" },
  WD: { make: "Mercedes-Benz", manufacturer: "Mercedes-Benz AG" },
  WV: { make: "Volkswagen", manufacturer: "Volkswagen AG" },
  WA: { make: "Audi", manufacturer: "Audi AG" },
  WP: { make: "Porsche", manufacturer: "Porsche AG" },
  YV: { make: "Volvo", manufacturer: "Volvo Cars" },
};

export function lookupWmi(vin: string): { make: string; manufacturer: string } | null {
  const v = normalizeVin(vin);
  return WMI[v.slice(0, 3)] ?? WMI_SHORT[v.slice(0, 2)] ?? null;
}

/**
 * Decode a VIN as far as the characters allow. Never throws: an unusable VIN
 * comes back with `valid: false` and a populated `errors` array so the UI can
 * explain the problem instead of failing silently.
 */
export function decodeVin(input: string, now = new Date()): DecodedVin {
  const vin = normalizeVin(input);
  const errors: string[] = [];

  if (vin.length === 0) {
    errors.push("Enter a VIN.");
  } else if (vin.length !== 17) {
    errors.push(`A VIN is 17 characters — this one has ${vin.length}.`);
  }
  if (vin.length === 17 && !VIN_RE.test(vin)) {
    errors.push("A VIN can't contain the letters I, O or Q.");
  }

  const wellFormed = errors.length === 0;
  const checkDigitValid = wellFormed ? hasValidCheckDigit(vin) : null;

  // North American VINs (first char 1-5) are required to carry a valid check
  // digit; imports frequently do not, so a mismatch there is worth surfacing
  // but not worth rejecting the VIN over.
  const northAmerican = /^[1-5]/.test(vin);
  if (wellFormed && northAmerican && checkDigitValid === false) {
    errors.push("Check digit doesn't match — please re-check the VIN.");
  }

  const wmi = wellFormed ? lookupWmi(vin) : null;
  const { year, alternatives } = wellFormed
    ? decodeModelYear(vin, now)
    : { year: null, alternatives: [] };

  return {
    vin,
    valid: errors.length === 0,
    errors,
    checkDigitValid,
    positions: {
      wmi: vin.slice(0, 3),
      vds: vin.slice(3, 8),
      checkDigit: vin.slice(8, 9),
      yearCode: vin.slice(9, 10),
      plantCode: vin.slice(10, 11),
      serial: vin.slice(11, 17),
    },
    make: wmi?.make ?? null,
    manufacturer: wmi?.manufacturer ?? null,
    country: wellFormed ? decodeCountry(vin) : null,
    modelYear: year,
    modelYearAlternatives: alternatives,
  };
}
