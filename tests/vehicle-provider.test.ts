import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LocalVehicleProvider,
  classFromBodyClass,
  localModelsFor,
} from "../src/lib/vehicle-provider.ts";
import { classifyVehicle } from "../src/lib/vehicle-catalog.ts";

describe("classFromBodyClass (vPIC body-class auto-identity)", () => {
  it("maps vPIC's vocabulary onto the five service classes", () => {
    assert.equal(classFromBodyClass("Pickup"), "truck");
    assert.equal(
      classFromBodyClass("Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)"),
      "suv",
    );
    assert.equal(classFromBodyClass("Crossover Utility Vehicle (CUV)"), "suv");
    assert.equal(classFromBodyClass("Minivan"), "minivan");
    assert.equal(classFromBodyClass("Cargo Van"), "van");
    assert.equal(classFromBodyClass("Sedan/Saloon"), "sedan");
    assert.equal(classFromBodyClass("Convertible/Cabriolet"), "sedan");
  });

  it("returns null when the body class is missing or off the map", () => {
    assert.equal(classFromBodyClass(null), null);
    assert.equal(classFromBodyClass("Motorcycle"), null);
  });
});

describe("keyword auto-identity floor (classifyVehicle)", () => {
  it("classifies the trucks and SUVs the shop sees", () => {
    assert.equal(classifyVehicle("2015 Toyota Tundra"), "truck");
    assert.equal(classifyVehicle("2019 Honda CR-V"), "suv");
    assert.equal(classifyVehicle("2011 Honda Odyssey"), "minivan");
    assert.equal(classifyVehicle("2016 Ford Transit"), "van");
    assert.equal(classifyVehicle("2003 Honda Accord"), "sedan");
  });
});

describe("localModelsFor", () => {
  it("returns catalog models for a make + year, classed", () => {
    const models = localModelsFor("Toyota", 2015);
    const tundra = models.find((m) => m.name === "Tundra");
    assert.ok(tundra, "Tundra missing from 2015 Toyota");
    assert.equal(tundra.vehicleClass, "truck");
  });

  it("is loose about make spelling and empty off-catalog", () => {
    assert.ok(localModelsFor("mercedes benz", 2018).length > 0);
    assert.equal(localModelsFor("Koenigsegg", 2018).length, 0);
  });

  it("falls back to the make's full model list outside the year range", () => {
    assert.ok(localModelsFor("Toyota", 1900).length > 0);
  });
});

describe("LocalVehicleProvider.decodeVin", () => {
  it("identifies year, make, and a default class from the VIN alone", async () => {
    const id = await new LocalVehicleProvider().decodeVin("1HGCM82633A004352");
    assert.equal(id.year, 2003);
    assert.equal(id.make, "Honda");
    assert.equal(id.vehicleClass, "sedan");
    assert.equal(id.decoded?.checkDigitValid, true);
  });
});
