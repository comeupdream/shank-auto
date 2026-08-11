import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeAvailableSlots,
  hasConflict,
  isWithinHours,
} from "../src/lib/availability.ts";
import { SHOP } from "../src/lib/shop-config.ts";

// 2026-08-14 is a Friday (open); 2026-08-16 is a Sunday (closed).
const FRIDAY = "2026-08-14";
const SUNDAY = "2026-08-16";

describe("computeAvailableSlots", () => {
  it("offers every slot on an open, empty day", () => {
    assert.deepEqual(computeAvailableSlots(FRIDAY, 60, []), [...SHOP.slotTimes]);
  });

  it("offers nothing on a closed day", () => {
    assert.deepEqual(computeAvailableSlots(SUNDAY, 60, []), []);
  });

  it("drops slots the job cannot finish before close", () => {
    // 3h job: 15:00 would end at 18:00, past the 17:00 close.
    const slots = computeAvailableSlots(FRIDAY, 180, []);
    assert.ok(!slots.includes("15:00"));
    assert.ok(slots.includes("08:00"));
  });

  it("blocks slots consumed by an existing long job", () => {
    // 3h job at 09:00 occupies 09:00-12:00.
    const busy = [{ startTime: "09:00", durationMinutes: 180 }];
    const slots = computeAvailableSlots(FRIDAY, 60, busy);
    assert.ok(slots.includes("08:00"));
    assert.ok(!slots.includes("09:00"));
    assert.ok(!slots.includes("10:00"));
    assert.ok(!slots.includes("11:00"));
    assert.ok(slots.includes("13:00"));
  });
});

describe("hasConflict", () => {
  const busy = [{ startTime: "10:00", durationMinutes: 90 }]; // 10:00-11:30

  it("detects overlap at the edges", () => {
    assert.ok(hasConflict("09:30", 60, busy)); // 09:30-10:30 overlaps
    assert.ok(hasConflict("11:00", 60, busy)); // 11:00-12:00 overlaps
  });

  it("allows back-to-back bookings", () => {
    assert.ok(!hasConflict("08:30", 90, busy)); // ends exactly at 10:00
    assert.ok(!hasConflict("11:30", 60, busy)); // starts exactly at 11:30
  });
});

describe("isWithinHours", () => {
  it("accepts a job that fits the day", () => {
    assert.ok(isWithinHours(FRIDAY, "08:00", 60));
  });

  it("rejects a job that runs past close", () => {
    assert.ok(!isWithinHours(FRIDAY, "16:30", 60));
  });

  it("rejects any time on a closed day", () => {
    assert.ok(!isWithinHours(SUNDAY, "10:00", 30));
  });
});
