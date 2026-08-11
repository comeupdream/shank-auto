import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCheckDigit,
  decodeModelYear,
  decodeVin,
  hasValidCheckDigit,
  isValidVinFormat,
  lookupWmi,
  normalizeVin,
} from "../src/lib/vin.ts";

// A widely used reference VIN (2003 Honda Accord) whose check digit is correct.
const ACCORD = "1HGCM82633A004352";

describe("normalizeVin", () => {
  it("uppercases and strips separators", () => {
    assert.equal(normalizeVin(" 1hgcm826-33a004352 "), ACCORD);
  });
});

describe("isValidVinFormat", () => {
  it("accepts a well-formed VIN", () => {
    assert.ok(isValidVinFormat(ACCORD));
  });

  it("rejects the wrong length", () => {
    assert.ok(!isValidVinFormat("1HGCM8263"));
    assert.ok(!isValidVinFormat(ACCORD + "9"));
  });

  it("rejects I, O and Q", () => {
    assert.ok(!isValidVinFormat("1HGCM8263IA004352"));
    assert.ok(!isValidVinFormat("1HGCM8263OA004352"));
    assert.ok(!isValidVinFormat("1HGCM8263QA004352"));
  });
});

describe("computeCheckDigit", () => {
  it("reproduces the check digit of a known-good VIN", () => {
    assert.equal(computeCheckDigit(ACCORD), ACCORD[8]);
    assert.ok(hasValidCheckDigit(ACCORD));
  });

  it("catches a single transposed character", () => {
    // Swap two characters in the serial — the weighted sum must change.
    const swapped = "1HGCM82633A004325";
    assert.ok(!hasValidCheckDigit(swapped));
  });

  it("returns null for the wrong length", () => {
    assert.equal(computeCheckDigit("12345"), null);
  });

  it("only ever produces 0-9 or X", () => {
    const d = computeCheckDigit(ACCORD);
    assert.ok(d !== null && /^[0-9X]$/.test(d));
  });
});

describe("decodeModelYear", () => {
  const now = new Date("2026-08-11T00:00:00Z");

  it("reads a 2000s VIN with a numeric position 7", () => {
    // Position 10 is "3", position 7 is "6" (numeric) → 2003, not 2033.
    assert.equal(decodeModelYear(ACCORD, now).year, 2003);
  });

  it("prefers the modern year when position 7 is alphabetic", () => {
    // 5YJ3E... Tesla Model 3: position 10 "L", position 7 alphabetic → 2020.
    const { year } = decodeModelYear("5YJ3E1EA7LF000316", now);
    assert.equal(year, 2020);
  });

  it("reports the 30-year alternatives", () => {
    // Year code "L" is both 1990 and 2020; position 7 picks the modern one,
    // and the older reading is offered as the alternative.
    const { year, alternatives } = decodeModelYear("5YJ3E1EA7LF000316", now);
    assert.equal(year, 2020);
    assert.deepEqual(alternatives, [1990]);
  });

  it("offers no alternative when the other reading is in the future", () => {
    // Code "3" is 2003 or 2033; 2033 is past next model year, so it's dropped.
    assert.deepEqual(decodeModelYear(ACCORD, now).alternatives, []);
  });

  it("returns null for an invalid year code", () => {
    // "U" is not in the model-year cycle.
    assert.equal(decodeModelYear("1HGCM8263UA004352", now).year, null);
  });
});

describe("lookupWmi", () => {
  it("resolves a 3-character WMI", () => {
    assert.equal(lookupWmi(ACCORD)?.make, "Honda");
    assert.equal(lookupWmi("5YJ3E1EA7LF000316")?.make, "Tesla");
    assert.equal(lookupWmi("WBA3A5C5XFF000000")?.make, "BMW");
  });

  it("falls back to the 2-character prefix", () => {
    // JFZ is not in the table, but JF is Subaru.
    assert.equal(lookupWmi("JFZGD70L0MG000000")?.make, "Subaru");
  });

  it("returns null for an unknown prefix", () => {
    assert.equal(lookupWmi("QQQ0000000000000"), null);
  });
});

describe("decodeVin", () => {
  it("decodes a valid VIN end to end", () => {
    const d = decodeVin(ACCORD, new Date("2026-08-11T00:00:00Z"));
    assert.ok(d.valid, d.errors.join(" "));
    assert.equal(d.make, "Honda");
    assert.equal(d.modelYear, 2003);
    assert.equal(d.country, "United States");
    assert.equal(d.checkDigitValid, true);
    assert.equal(d.positions.wmi, "1HG");
    assert.equal(d.positions.serial, "004352");
  });

  it("flags a bad check digit on a North American VIN", () => {
    const bad = ACCORD.slice(0, 8) + "9" + ACCORD.slice(9);
    const d = decodeVin(bad);
    assert.ok(!d.valid);
    assert.equal(d.checkDigitValid, false);
    assert.ok(d.errors.some((e) => e.includes("Check digit")));
  });

  it("does not reject an import over its check digit", () => {
    // A German-built VIN (W…) is not required to carry a valid check digit.
    const d = decodeVin("WVWZZZ1JZ3W000000");
    assert.ok(d.valid, d.errors.join(" "));
    assert.equal(d.make, "Volkswagen");
  });

  it("never throws on garbage input", () => {
    for (const input of ["", "   ", "not-a-vin", "!@#$%^&*()", "0".repeat(40)]) {
      const d = decodeVin(input);
      assert.equal(typeof d.valid, "boolean");
      assert.ok(d.errors.length > 0);
    }
  });
});
