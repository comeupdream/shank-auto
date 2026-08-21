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

**From XAT Racing** ([comeupdream/XATRACING](https://github.com/comeupdream/XATRACING),
xatracing.onrender.com), three things are ported:

1. **The vPIC VIN pattern** (`assets/js/ymm.js`) — XAT decodes VINs by calling
   NHTSA vPIC **from the browser** (free, keyless, CORS-open). The
   VehiclePicker does the same: server decode first (instant, offline —
   make/year/check digit), then a browser-side vPIC call fills in model +
   trim. Server egress policy can't break it, because the customer's browser
   makes the call.
2. **Platform fitment** (`assets/data/ymm.json` → `src/lib/xat-fitment.ts`) —
   XAT's curated chassis table. When a customer's vehicle lands on a
   supported platform (LS400 → UCF20, Tundra → 3UR, …) the picker shows the
   chassis code and stock engine.
3. **The core charge program** (`src/lib/core-charges.ts`) — XAT's refundable
   core-deposit model, adapted to the repair counter: leave the old part with
   the shop and the deposit is waived; keep it and the deposit refunds when
   the part comes back. Shown on `/services` and inside the estimate flow.

> Note: this dev sandbox blocks `vpic.nhtsa.dot.gov`, so the server-side
> vPIC provider and the browser-side call are written to the documented API
> shape but **unverified against the live service from here** — the browser
> path works wherever the customer's own network allows it (it's exactly
> what xatracing.onrender.com ships).

## Run it

```bash
npm install
npm run dev           # http://localhost:3000
npm test              # VIN, catalog, availability, sheet-import tests
npm run build:static  # static demo build → out/ (see below)
```

- `/` `/services` `/estimate` `/book` — public
- `/admin` — schedule + sheet import (dev password `shank-admin`, set
  `ADMIN_PASSWORD`)

No database needed: appointments persist to `data/appointments.json`
(gitignored). See `.env.example` for the knobs.

## Static demo deploy (Render)

The demo deploys as a **Render Static Site** — no server, no env vars:

| Render field | Value |
| ------------ | ----- |
| Build Command | `npm ci && npm run build:static` |
| Publish Directory | `out` |

Or skip the form: **New → Blueprint** on this repo reads
[`render.yaml`](render.yaml). Node version comes from `.node-version`.

`build:static` runs `next build` with `output: "export"`, hiding the
server-only segments (`/api`, `/admin`) for the duration of the build
(`scripts/build-static.mjs`). The static build stays genuinely usable
because the vehicle stack is pure bundled code:

- **VIN decode and the year/make/model cascade run in the browser** —
  the WMI math, catalog, and XAT fitment ship in the bundle, and the
  browser-side vPIC call still fills in model/trim on customer networks.
- **Booking shows real slot math** (hours, lead time, closed days) computed
  client-side against an empty schedule; submitting shows a clearly-marked
  demo notice with the shop's phone number instead of recording anything.
  The estimate form does the same.
- `/admin` and the JSON appointment book don't exist in this build — they
  need the Node deployment (`npm run build` + `npm start` on any Node host).

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
