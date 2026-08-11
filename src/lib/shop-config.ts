/**
 * Central shop configuration.
 *
 * Everything the site needs to know about the business lives here so it can be
 * changed without hunting through components. Values marked TODO were not on
 * the existing shankautorepair site and need confirming with the owner.
 */

export type DayHours = { open: string; close: string } | null;

export const SHOP = {
  name: "Shank Auto Repair",
  shortName: "Shank Auto",
  tagline: "Dedicated to keeping your automobile trouble free.",
  blurb:
    "Fast, reliable, affordable. Check car care off your list. We've got you covered.",
  phone: "540-638-1720",
  email: "shankautorepair@gmail.com",
  address: "2467 Cross Keys Road",
  cityLine: "Harrisonburg, VA 22801",

  // TODO: confirm the real profile URLs — the current site links to both.
  facebook: "",
  youtube: "",

  /** IANA timezone the shop operates in. Drives "today" / past-slot logic. */
  timezone: "America/New_York",

  /**
   * Drop-off appointment start times offered each open day. A repair bay
   * turns over roughly hourly for maintenance work; longer jobs consume the
   * following slot(s) automatically via the conflict check.
   * TODO: confirm with the owner.
   */
  slotTimes: ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"],

  /** How far ahead clients may book, in days. */
  bookingHorizonDays: 30,

  /** Minimum lead time before a job can start today, in minutes. */
  minLeadMinutes: 60,

  /**
   * TODO: confirm real hours with the owner. These are placeholder
   * general-repair hours so the site renders something sensible.
   * Index: 0 = Sunday … 6 = Saturday. `null` means closed.
   */
  hours: {
    0: null, // Sunday — closed
    1: { open: "08:00", close: "17:00" },
    2: { open: "08:00", close: "17:00" },
    3: { open: "08:00", close: "17:00" },
    4: { open: "08:00", close: "17:00" },
    5: { open: "08:00", close: "17:00" },
    6: null, // Saturday — closed
  } as Record<number, DayHours>,
} as const;

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Human-readable hours list for display on the site. */
export function hoursForDisplay(): { day: string; hours: string }[] {
  return WEEKDAY_LABELS.map((day, i) => {
    const h = SHOP.hours[i];
    return { day, hours: h ? `${to12h(h.open)} – ${to12h(h.close)}` : "Closed" };
  });
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}

/** Current date in the shop timezone as "YYYY-MM-DD". */
export function shopTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Current time in the shop timezone as "HH:MM" (24h). */
export function shopNowHM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: SHOP.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** `tel:` href — strips the formatting out of the display number. */
export function telHref(): string {
  return `tel:+1${SHOP.phone.replace(/\D/g, "")}`;
}

/** Google Maps directions link for the shop address. */
export function directionsHref(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${SHOP.address}, ${SHOP.cityLine}`,
  )}`;
}
