import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as XLSX from "xlsx";
import {
  coerceDate,
  coerceTime,
  matchService,
  parseScheduleSheet,
} from "../src/lib/schedule-import.ts";

/** Build a real .xlsx buffer from rows, the way the shop's sheet would look. */
function sheet(rows: unknown[][]): Buffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Schedule");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

describe("coerceDate", () => {
  it("accepts ISO and US formats", () => {
    assert.equal(coerceDate("2026-08-14"), "2026-08-14");
    assert.equal(coerceDate("8/14/2026"), "2026-08-14");
    assert.equal(coerceDate("8-14-26"), "2026-08-14");
  });

  it("accepts a Date cell", () => {
    assert.equal(coerceDate(new Date(Date.UTC(2026, 7, 14))), "2026-08-14");
  });

  it("accepts an Excel serial number", () => {
    // 2026-08-14 = 46248 days after 1899-12-30.
    assert.equal(coerceDate(46248), "2026-08-14");
  });

  it("rejects garbage", () => {
    assert.equal(coerceDate("next Tuesday"), null);
    assert.equal(coerceDate("14/25/2026"), null);
    assert.equal(coerceDate(""), null);
  });
});

describe("coerceTime", () => {
  it("accepts 24h, 12h and bare-hour forms", () => {
    assert.equal(coerceTime("08:00"), "08:00");
    assert.equal(coerceTime("8:00"), "08:00");
    assert.equal(coerceTime("8:00 AM"), "08:00");
    assert.equal(coerceTime("1:30 pm"), "13:30");
    assert.equal(coerceTime("12:15 AM"), "00:15");
    assert.equal(coerceTime("12:00 PM"), "12:00");
  });

  it("accepts an Excel time fraction", () => {
    assert.equal(coerceTime(0.5), "12:00");
    assert.equal(coerceTime(1 / 3), "08:00");
  });

  it("rejects garbage", () => {
    assert.equal(coerceTime("morning"), null);
    assert.equal(coerceTime("25:00"), null);
  });
});

describe("matchService", () => {
  it("matches exact names and ids", () => {
    assert.equal(matchService("Oil & Filter Change")?.id, "oil-change");
    assert.equal(matchService("brakes")?.id, "brakes");
  });

  it("matches the shorthand a shop types", () => {
    assert.equal(matchService("oil")?.id, "oil-change");
    assert.equal(matchService("LOF")?.id, "oil-change");
    assert.equal(matchService("state insp")?.id, "state-inspection");
    assert.equal(matchService("front pads + rotors")?.id, "brakes");
    assert.equal(matchService("AC recharge")?.id, "ac-service");
    assert.equal(matchService("check engine light")?.id, "diagnostics");
  });

  it("returns null for unknown work", () => {
    assert.equal(matchService("windshield replacement"), null);
    assert.equal(matchService(""), null);
  });
});

describe("parseScheduleSheet", () => {
  const HEADERS = ["Date", "Time", "Customer", "Phone", "Vehicle", "Service", "Notes"];

  it("parses a normal sheet", () => {
    const buf = sheet([
      HEADERS,
      ["2026-08-14", "8:00 AM", "Pat Miller", "540-555-0101", "2019 Toyota Tacoma", "oil", "synthetic"],
      ["8/14/2026", "9:00", "Sam Rowe", "", "2015 Honda CR-V", "state inspection", ""],
    ]);
    const { rows, errors } = parseScheduleSheet(buf);
    assert.equal(errors.length, 0);
    assert.equal(rows.length, 2);

    const [a, b] = rows.map((r) => r.appointment);
    assert.equal(a.date, "2026-08-14");
    assert.equal(a.startTime, "08:00");
    assert.equal(a.customerName, "Pat Miller");
    assert.equal(a.serviceId, "oil-change");
    assert.equal(a.vehicleClass, "truck"); // Tacoma → truck via catalog
    assert.equal(a.source, "import");
    assert.equal(b.serviceId, "state-inspection");
    assert.equal(b.startTime, "09:00");
  });

  it("recognizes loose header spellings", () => {
    const buf = sheet([
      ["Appt Date", "Start Time", "Customer Name", "Cell", "Year Make Model", "Job"],
      ["2026-08-17", "10:00", "Lee Park", "540-555-0102", "2020 Ford F-150", "brake pads"],
    ]);
    const { rows, errors } = parseScheduleSheet(buf);
    assert.equal(errors.length, 0);
    assert.equal(rows[0].appointment.serviceId, "brakes");
    assert.equal(rows[0].appointment.customerPhone, "540-555-0102");
  });

  it("reports bad rows individually and keeps the good ones", () => {
    const buf = sheet([
      HEADERS,
      ["2026-08-14", "8:00", "Good Row", "", "", "oil", ""],
      ["not a date", "9:00", "Bad Date", "", "", "", ""],
      ["2026-08-14", "sometime", "Bad Time", "", "", "", ""],
      ["2026-08-14", "10:00", "", "", "", "", ""], // no customer
    ]);
    const { rows, errors } = parseScheduleSheet(buf);
    assert.equal(rows.length, 1);
    assert.equal(errors.length, 3);
    // Row numbers match what the user sees in Excel (header = row 1).
    assert.deepEqual(errors.map((e) => e.row), [3, 4, 5]);
  });

  it("skips blank filler rows silently", () => {
    const buf = sheet([
      HEADERS,
      ["2026-08-14", "8:00", "Only Row", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
    ]);
    const { rows, errors } = parseScheduleSheet(buf);
    assert.equal(rows.length, 1);
    assert.equal(errors.length, 0);
  });

  it("files unknown services under Other, keeping the text", () => {
    const buf = sheet([
      HEADERS,
      ["2026-08-14", "11:00", "Kim Ohr", "", "", "windshield replacement", ""],
    ]);
    const { rows } = parseScheduleSheet(buf);
    assert.equal(rows[0].appointment.serviceId, "other");
    assert.ok(rows[0].appointment.notes.includes("windshield replacement"));
    assert.ok(rows[0].warning?.includes("isn't on the menu"));
  });

  it("fails clearly when required columns are missing", () => {
    const buf = sheet([
      ["Who", "When"],
      ["Pat", "tomorrow"],
    ]);
    const { rows, errors } = parseScheduleSheet(buf);
    assert.equal(rows.length, 0);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].message?.includes("Need Date, Time and Customer"));
  });

  it("respects an explicit Status and Duration", () => {
    const buf = sheet([
      ["Date", "Time", "Customer", "Duration", "Status"],
      ["2026-08-14", "8:00", "Done Deal", 120, "completed"],
    ]);
    const { rows } = parseScheduleSheet(buf);
    assert.equal(rows[0].appointment.status, "COMPLETED");
    assert.equal(rows[0].appointment.durationMinutes, 120);
  });

  it("keeps a valid VIN and flags a malformed one", () => {
    const buf = sheet([
      ["Date", "Time", "Customer", "VIN"],
      ["2026-08-14", "8:00", "Vin Diesel", "1HGCM82633A004352"],
      ["2026-08-14", "9:00", "Bad Vin", "NOTAVIN"],
    ]);
    const { rows } = parseScheduleSheet(buf);
    assert.equal(rows[0].appointment.vehicleVin, "1HGCM82633A004352");
    assert.equal(rows[1].appointment.vehicleVin, "");
    assert.ok(rows[1].warning?.includes("malformed"));
  });
});
