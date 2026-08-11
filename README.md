# Shank Auto Repair

Website scaffold for **Shank Auto Repair** (2467 Cross Keys Road, Harrisonburg,
VA) with VIN decoding, an expanded year/make/model lookup, online drop-off
scheduling, and a spreadsheet-driven admin schedule. The scheduling engine is
ported from the [Revive Detail](https://github.com/comeupdream/auto-revival)
build; vehicle identification is new.

## What's built

- **Public site** — home, services & pricing, about, contact, in the current
  site's dark-chassis / light-blue look.
- **VIN decoding** (`/api/vin/:vin`) — full ISO 3779 / 49 CFR 565 math, offline:
  17-char + I/O/Q validation, position-9 **check digit** (required for
  North American VINs, advisory for imports), model year from position 10
  (with the 30-year-cycle ambiguity surfaced, not hidden), country from
  position 1, and a ~180-entry WMI table covering every make a Valley shop
  sees. Pure functions in `src/lib/vin.ts`, fully unit-tested.
- **Year → Make → Model lookup** (`/api/ymm`) — expanded from Revive Detail's
  flat 31-make list to a real catalog (`src/lib/vehicle-catalog.ts`):
  40 makes, ~480 models with production year ranges and body classes, so the
  cascade only offers models actually sold that year. Feeds the vehicle-class
  labor multiplier.
- **Estimate requests** (`/estimate`) — identify the vehicle (VIN or Y/M/M),
  pick a service, describe the concern. Flat-rate services price live by
  vehicle class; repair work is marked "priced after inspection."
- **Drop-off scheduling** (`/book`) — Revive Detail's booking engine:
  fixed daily slots, opening hours, booking horizon, lead time, and
  server-side conflict checks (long jobs consume following slots). Booked
  times vanish from the picker; double-booking is refused server-side.
- **Admin schedule** (`/admin`) — password-gated (HMAC session cookie) job
  book grouped by day, plus **spreadsheet import**: upload the shop's
  .xlsx/.csv schedule and it populates the book. Row-by-row report (imported /
  skipped + reason, with Excel row numbers); flags overlaps and unknown
  services rather than silently dropping them. Template:
  [`docs/schedule-template.csv`](docs/schedule-template.csv).

### Sheet format

First row = headers. **Date, Time, Customer** are required; Phone, Email,
Vehicle, VIN, Service, Duration, Notes, Status are picked up when present
(loose spellings like "Appt Date" / "Cell" / "Job" work). Dates accept Excel
date cells, serials, `8/14/2026`, or `2026-08-14`; times accept `8:00`,
`8:00 AM`, or Excel time fractions. Service text is keyword-matched to the
menu ("LOF" → Oil & Filter Change, "front pads" → Brake Service); no match
files under "Something Else" with the original text kept in notes.

## Vehicle-data providers

`src/lib/vehicle-provider.ts` defines a provider interface so the VIN/YMM
data source can be swapped without touching UI or routes. Included:

| Provider | Env | What it adds |
| -------- | --- | ------------ |
| `local` (default) | — | Offline WMI + catalog. No network, no key. |
| `vpic` | `VEHICLE_DATA_PROVIDER=vpic` | NHTSA vPIC (free, key-less): resolves **model, trim, body class** from the VIN — the part offline math can't do. Falls back to `local` on any error. |

**On XAT Racing:** xatracing.com was investigated as the requested VIN/YMM
source. It's a Toyota/Lexus performance-parts store whose "Choose Your
Vehicle" pages are a static parts-catalog navigation — no VIN decoder or
vehicle-data API is publicly exposed, and this dev environment's egress
policy blocks the domain outright. If XAT publishes (or you have) an API
endpoint, implement it as a third `VehicleDataProvider` alongside `vpic` —
that's the seam it was built for.

> Note: the dev sandbox also blocks `vpic.nhtsa.dot.gov`, so the vPIC provider
> is written to the documented API shape but **unverified against the live
> service** — test once from an unrestricted network.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # VIN, catalog, availability, sheet-import tests
```

- `/` `/services` `/estimate` `/book` — public
- `/admin` — schedule + sheet import (dev password `shank-admin`, set
  `ADMIN_PASSWORD`)

No database needed: appointments persist to `data/appointments.json`
(gitignored). See `.env.example` for the knobs.

## Tech

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS ·
SheetJS (`xlsx`) for the schedule import · zero-infra JSON store behind a
swap-ready seam.

## Not built yet

- **Database** — `src/lib/appointment-store.ts` is a JSON-file store behind a
  Prisma-shaped seam; swap it for Postgres (auto-revival's `prisma/` is the
  template) before production. The file store does not survive ephemeral
  filesystems.
- **Emails** — booking confirmations/reminders (port auto-revival's
  `email.ts` + Resend templates). Estimate requests currently validate + log
  only.
- **Admin extras** — status changes, walk-in entry, CSV export, calendar view
  (all exist in auto-revival to port).
- **Real content** — hours, prices, labor multipliers, and About copy are
  placeholders marked `TODO` in `src/lib/shop-config.ts` and
  `src/lib/services.ts`.
