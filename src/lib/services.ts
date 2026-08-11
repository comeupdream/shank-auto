/**
 * The repair services menu.
 *
 * Unlike a detailing shop, most repair work can't be quoted from a web form —
 * the price depends on what's actually wrong. So each service carries either a
 * flat price (maintenance items we do at a fixed rate) or a "from" estimate
 * that the shop confirms after a look. `estimateOnly` services show as
 * "Request an estimate" rather than a number.
 *
 * TODO: every price below is a placeholder. Confirm the real menu and rates
 * with the owner before this goes live.
 */

import type { VehicleClass } from "./vehicle-catalog.ts";

export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Base price in cents. Ignored when `estimateOnly`. */
  priceCents: number;
  /** True when the job can't be priced without seeing the vehicle. */
  estimateOnly: boolean;
  /** Rough shop time, in minutes — used for scheduling, not billing. */
  minutes: number;
};

export const SERVICES: Service[] = [
  {
    id: "oil-change",
    name: "Oil & Filter Change",
    category: "Maintenance",
    description: "Full synthetic or conventional, new filter, fluid top-off, and a courtesy inspection.",
    priceCents: 6900,
    estimateOnly: false,
    minutes: 45,
  },
  {
    id: "state-inspection",
    name: "Virginia State Inspection",
    category: "Maintenance",
    description: "Official Virginia safety inspection. Walk-ins welcome most mornings.",
    priceCents: 2000,
    estimateOnly: false,
    minutes: 45,
  },
  {
    id: "tire-rotation",
    name: "Tire Rotation & Balance",
    category: "Tires",
    description: "Rotate, balance, and set pressures. Recommended every 5,000–7,500 miles.",
    priceCents: 8900,
    estimateOnly: false,
    minutes: 60,
  },
  {
    id: "brakes",
    name: "Brake Service",
    category: "Repair",
    description: "Pads, rotors, calipers, and hydraulics. Priced after inspection.",
    priceCents: 0,
    estimateOnly: true,
    minutes: 150,
  },
  {
    id: "diagnostics",
    name: "Check-Engine Diagnostics",
    category: "Diagnostics",
    description: "Full scan and diagnosis. The fee applies toward the repair if you have us do the work.",
    priceCents: 9900,
    estimateOnly: false,
    minutes: 90,
  },
  {
    id: "ac-service",
    name: "A/C Service & Recharge",
    category: "Repair",
    description: "Evacuate, leak-test, and recharge. Component repairs quoted separately.",
    priceCents: 0,
    estimateOnly: true,
    minutes: 120,
  },
  {
    id: "suspension",
    name: "Suspension & Steering",
    category: "Repair",
    description: "Struts, shocks, control arms, tie rods, and alignment-related work.",
    priceCents: 0,
    estimateOnly: true,
    minutes: 180,
  },
  {
    id: "battery-electrical",
    name: "Battery & Electrical",
    category: "Repair",
    description: "Starting, charging, and electrical faults — batteries, alternators, starters.",
    priceCents: 0,
    estimateOnly: true,
    minutes: 90,
  },
  {
    id: "transmission",
    name: "Transmission Service",
    category: "Maintenance",
    description: "Fluid and filter service to the manufacturer's interval.",
    priceCents: 0,
    estimateOnly: true,
    minutes: 120,
  },
  {
    id: "other",
    name: "Something Else",
    category: "Diagnostics",
    description: "Tell us what the vehicle is doing and we'll figure it out.",
    priceCents: 0,
    estimateOnly: true,
    minutes: 60,
  },
];

/**
 * Labor multiplier by vehicle class. Bigger vehicles take longer on the lift —
 * this is the one place the year/make/model lookup feeds pricing directly.
 *
 * TODO: confirm these multipliers with the owner.
 */
export const CLASS_LABOR_MULTIPLIER: Record<VehicleClass, number> = {
  sedan: 1,
  suv: 1.15,
  truck: 1.25,
  minivan: 1.15,
  van: 1.35,
};

export function serviceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id);
}

/** Price for a service on a given vehicle class, in cents. */
export function priceFor(service: Service, cls: VehicleClass): number | null {
  if (service.estimateOnly) return null;
  return Math.round(service.priceCents * CLASS_LABOR_MULTIPLIER[cls]);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

/** The services menu grouped by category, in menu order. */
export function servicesByCategory(): { category: string; services: Service[] }[] {
  const out: { category: string; services: Service[] }[] = [];
  for (const s of SERVICES) {
    const group = out.find((g) => g.category === s.category);
    if (group) group.services.push(s);
    else out.push({ category: s.category, services: [s] });
  }
  return out;
}
