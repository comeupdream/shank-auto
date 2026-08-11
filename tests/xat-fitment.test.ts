import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FITMENTS, fitmentSummary, matchFitment } from "../src/lib/xat-fitment.ts";

describe("fitment table integrity", () => {
  it("carries the full XATRACING table", () => {
    assert.equal(FITMENTS.length, 28);
    for (const f of FITMENTS) {
      assert.ok(f.chassis, `${f.model} missing chassis`);
      assert.ok(f.from <= f.to, `${f.model} bad year range`);
    }
  });
});

describe("matchFitment", () => {
  it("resolves an exact year/make/model", () => {
    const f = matchFitment(1998, "Lexus", "LS400 (UCF20)");
    assert.equal(f?.chassis, "UCF20");
    assert.deepEqual(f?.stock, ["1UZ"]);
  });

  it("matches the catalog's shorter model names (vPIC style)", () => {
    // Our catalog and vPIC both say "LS", XAT's table says "LS400 (UCF20)".
    assert.equal(matchFitment(1998, "Lexus", "LS")?.chassis, "UCF20");
    // Year picks the right generation.
    assert.equal(matchFitment(1992, "Lexus", "LS")?.chassis, "UCF10");
  });

  it("matches when the given model is longer than the table's first word", () => {
    assert.equal(matchFitment(1995, "Toyota", "Supra Turbo")?.chassis, "A80");
    assert.equal(matchFitment(1990, "Toyota", "Supra Turbo")?.chassis, "A70");
  });

  it("respects make and year windows", () => {
    // 2005 Lexus LS is the LS430 generation, not the LS400.
    assert.equal(matchFitment(2005, "Lexus", "LS")?.chassis, "LS430");
    assert.equal(matchFitment(1985, "Lexus", "LS400"), null); // before UCF10
    assert.equal(matchFitment(1998, "Toyota", "LS400"), null); // wrong make
  });

  it("resolves trucks the shop actually sees", () => {
    assert.equal(matchFitment(2015, "Toyota", "Tundra")?.chassis, "TUNDRA");
    assert.equal(matchFitment(2005, "Toyota", "4Runner")?.chassis, "GX470");
    assert.equal(matchFitment(2010, "Lexus", "LX570")?.chassis, "LC100");
  });

  it("returns null for vehicles off the table", () => {
    assert.equal(matchFitment(2019, "Honda", "Civic"), null);
    assert.equal(matchFitment(2019, "Toyota", "Camry"), null);
  });
});

describe("fitmentSummary", () => {
  it("shows chassis and stock engine", () => {
    const f = matchFitment(1998, "Lexus", "LS400")!;
    assert.equal(fitmentSummary(f), "UCF20 platform · stock 1UZ");
  });

  it("handles platforms with no engine data", () => {
    const f = matchFitment(2021, "Toyota", "Supra")!;
    assert.equal(fitmentSummary(f), "A90 platform");
  });
});
