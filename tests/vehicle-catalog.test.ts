import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATALOG,
  EARLIEST_YEAR,
  MAKES,
  allModelsFor,
  canonicalMake,
  classifyVehicle,
  findModel,
  makesForYear,
  modelsFor,
  years,
} from "../src/lib/vehicle-catalog.ts";

describe("catalog integrity", () => {
  it("has every make sorted and non-empty", () => {
    assert.ok(MAKES.length > 30, `only ${MAKES.length} makes`);
    for (const make of MAKES) {
      assert.ok(CATALOG[make].length > 0, `${make} has no models`);
    }
  });

  it("has sane year ranges on every entry", () => {
    const maxYear = new Date().getFullYear() + 2;
    for (const make of MAKES) {
      for (const [name, from, to] of CATALOG[make]) {
        assert.ok(from >= 1900 && from <= maxYear, `${make} ${name}: bad start ${from}`);
        if (to !== null) {
          assert.ok(to >= from, `${make} ${name}: ends ${to} before it starts ${from}`);
          assert.ok(to <= maxYear, `${make} ${name}: bad end ${to}`);
        }
      }
    }
  });

  it("has no duplicate model entries with overlapping years", () => {
    for (const make of MAKES) {
      const byName = new Map<string, [number, number | null][]>();
      for (const [name, from, to] of CATALOG[make]) {
        const runs = byName.get(name) ?? [];
        for (const [f, t] of runs) {
          const overlap = from <= (t ?? Infinity) && (to ?? Infinity) >= f;
          assert.ok(!overlap, `${make} ${name}: overlapping runs`);
        }
        runs.push([from, to]);
        byName.set(name, runs);
      }
    }
  });
});

describe("years", () => {
  it("runs from next model year back to the earliest", () => {
    const ys = years(new Date("2026-08-11T00:00:00Z"));
    assert.equal(ys[0], 2027);
    assert.equal(ys[ys.length - 1], EARLIEST_YEAR);
  });
});

describe("makesForYear", () => {
  it("includes only makes that sold something that year", () => {
    assert.ok(makesForYear(2024).includes("Toyota"));
    // Oldsmobile ended in 2004 and Pontiac in 2010.
    assert.ok(!makesForYear(2024).includes("Oldsmobile"));
    assert.ok(makesForYear(2000).includes("Oldsmobile"));
    assert.ok(!makesForYear(2024).includes("Pontiac"));
  });
});

describe("modelsFor", () => {
  it("returns models in production that year", () => {
    const names = modelsFor("Toyota", 2019).map((m) => m.name);
    assert.ok(names.includes("Camry"));
    assert.ok(names.includes("Tacoma"));
    // The FJ Cruiser ended in 2014.
    assert.ok(!names.includes("FJ Cruiser"));
  });

  it("handles a nameplate with two separate production runs", () => {
    assert.ok(modelsFor("Ford", 1995).some((m) => m.name === "Bronco"));
    assert.ok(!modelsFor("Ford", 2005).some((m) => m.name === "Bronco"));
    assert.ok(modelsFor("Ford", 2023).some((m) => m.name === "Bronco"));
  });

  it("de-duplicates names", () => {
    const names = allModelsFor("Jeep").map((m) => m.name);
    assert.equal(new Set(names).size, names.length);
  });

  it("returns empty for an unknown make", () => {
    assert.deepEqual(modelsFor("DeLorean", 1982), []);
  });

  it("is sorted by name", () => {
    const names = modelsFor("Honda", 2020).map((m) => m.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe("canonicalMake", () => {
  it("matches regardless of case, spacing and punctuation", () => {
    assert.equal(canonicalMake("mercedes benz"), "Mercedes-Benz");
    assert.equal(canonicalMake("MERCEDES-BENZ"), "Mercedes-Benz");
    assert.equal(canonicalMake("land rover"), "Land Rover");
    assert.equal(canonicalMake("nonesuch"), null);
  });
});

describe("findModel", () => {
  it("finds the run matching the year", () => {
    assert.equal(findModel("Ford", "Bronco", 1990)?.to, 1996);
    assert.equal(findModel("Ford", "Bronco", 2023)?.to, null);
  });

  it("normalizes the model name", () => {
    assert.equal(findModel("Toyota", "rav4", 2020)?.name, "RAV4");
    assert.equal(findModel("Mazda", "cx 5", 2020)?.name, "CX-5");
  });
});

describe("classifyVehicle", () => {
  it("prefers the catalog over the regexes", () => {
    assert.equal(classifyVehicle("2020 Honda Odyssey"), "minivan");
    assert.equal(classifyVehicle("2021 Ford F-150"), "truck");
    assert.equal(classifyVehicle("2019 Toyota RAV4"), "suv");
    assert.equal(classifyVehicle("2018 Honda Accord"), "sedan");
  });

  it("classifies full-size vans apart from minivans", () => {
    assert.equal(classifyVehicle("2018 Mercedes-Benz Sprinter"), "van");
    assert.equal(classifyVehicle("2015 Chevrolet Express"), "van");
    assert.equal(classifyVehicle("2015 Chrysler Town & Country"), "minivan");
  });

  it("falls back to the regexes for vehicles outside the catalog", () => {
    assert.equal(classifyVehicle("1978 Chevrolet C10 pickup"), "truck");
    assert.equal(classifyVehicle("some crossover"), "suv");
  });

  it("defaults to sedan on empty or unrecognized input", () => {
    assert.equal(classifyVehicle(""), "sedan");
    assert.equal(classifyVehicle("   "), "sedan");
    assert.equal(classifyVehicle("qqqq"), "sedan");
  });
});
