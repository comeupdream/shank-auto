/**
 * Core charge program — ported from XAT Racing (comeupdream/XATRACING).
 *
 * XAT's store attaches a refundable core deposit (`k` in its catalog) to
 * rebuildable parts, lists it separately from the price ("+ $220 refundable
 * core"), totals it as its own cart line, and refunds it in full when the
 * rebuildable core arrives back at the shop.
 *
 * A repair shop runs the same program from the other side of the counter:
 * replacement parts we install (alternators, starters, calipers, …) carry a
 * supplier core charge, and the customer's old part IS the core. When the old
 * part stays with the shop — the normal case for an in-shop repair — the
 * deposit is waived outright; the charge only sticks if the customer keeps
 * the old part.
 *
 * TODO: deposits below are typical supplier amounts — confirm real numbers
 * with the owner's parts accounts.
 */

export type CoreCharge = {
  id: string;
  /** The rebuildable part the deposit rides on. */
  part: string;
  /** Typical refundable deposit, in cents. */
  depositCents: number;
  /** Service menu ids (src/lib/services.ts) this part shows up in. */
  serviceIds: string[];
};

export const CORE_CHARGES: CoreCharge[] = [
  {
    id: "battery",
    part: "Battery",
    depositCents: 1500,
    serviceIds: ["battery-electrical"],
  },
  {
    id: "alternator",
    part: "Alternator",
    depositCents: 4500,
    serviceIds: ["battery-electrical"],
  },
  {
    id: "starter",
    part: "Starter",
    depositCents: 3500,
    serviceIds: ["battery-electrical"],
  },
  {
    id: "brake-caliper",
    part: "Brake caliper",
    depositCents: 4000,
    serviceIds: ["brakes"],
  },
  {
    id: "ac-compressor",
    part: "A/C compressor",
    depositCents: 5000,
    serviceIds: ["ac-service"],
  },
  {
    id: "steering-rack",
    part: "Steering rack / gear",
    depositCents: 8000,
    serviceIds: ["suspension"],
  },
  {
    id: "transmission",
    part: "Transmission (remanufactured)",
    depositCents: 60000,
    serviceIds: ["transmission"],
  },
];

/**
 * The program in one paragraph, adapted from XAT's cart copy
 * ("Core charges are refunded in full when your rebuildable core arrives
 * back at the shop.").
 */
export const CORE_POLICY =
  "Rebuildable parts carry a refundable core deposit from our suppliers. " +
  "Leave the old part with us — the normal case for any in-shop repair — and " +
  "the deposit is waived on the spot. If you keep the old part, the deposit " +
  "is added to the invoice and refunded in full when the part comes back to " +
  "the shop.";

/** Core-charged parts that can come up for a given service. */
export function coreChargesForService(serviceId: string): CoreCharge[] {
  return CORE_CHARGES.filter((c) => c.serviceIds.includes(serviceId));
}
