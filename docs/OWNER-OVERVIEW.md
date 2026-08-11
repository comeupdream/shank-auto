# Your new website — and what it actually does for the shop

*Plain-English overview for Shank Auto Repair. Nothing here is live yet; the
current site is untouched until you say go.*

## The short version

1. **Customers book their own drop-offs, day or night.** The site knows your
   hours and what's already booked. It only offers times that are genuinely
   open, and it will not double-book a bay — even if two people go for the
   same slot at once.
2. **Your Excel schedule drops straight in.** Keep the spreadsheet if you like
   it. Upload the file and every row becomes an appointment on a
   password-protected calendar you can check from any phone.
3. **Every job arrives with the right car attached.** Customers type the VIN
   off the door jamb; the site identifies the vehicle and catches typos before
   they waste anyone's time.

## Today vs. with the new site

| How it works today | With the new site |
| --- | --- |
| Every appointment is a phone call, answered mid-job. | Customers see open slots and book them — nights, weekends, whenever. |
| The schedule lives in one spreadsheet on one computer. | Same spreadsheet, uploaded in one click — then it's a calendar, a job list, and a running total on any phone, behind a password. |
| "What year is it? Which engine?" — guessing over the phone. | The customer types 17 characters; year, make, model come back checked for typos. |
| Estimate requests are scribbled notes from a call. | A written request with the car, VIN, and the customer's own description, waiting when you have a minute. |
| Core charges get explained at pickup — sometimes as a surprise. | Explained up front: leave the old part, deposit waived. |

## For your customers

- **Online drop-off booking** — runs on your real hours (change them once,
  the whole site follows). A brake job blocks the bay longer than an oil
  change. The final availability check happens on the shop's side, so a stale
  page can never steal a taken slot.
- **VIN decoder, free forever** — every VIN carries a built-in check digit
  (the same math the DMV uses); typos get caught on the spot. Make and year
  decode instantly; model and trim fill in from the federal government's free
  vehicle database (NHTSA). No subscription, no per-lookup fee.
- **A year/make/model picker that knows real cars** — pick 2019 and only
  makes that sold cars in 2019 appear. ~480 models, 40 makes, back to 1981.
- **Straight prices where possible** — flat-rate work (oil, inspection,
  rotation) prices on the spot, adjusted for the vehicle: trucks don't pay
  sedan labor. Repair work says "priced after inspection" — the site never
  promises what the shop hasn't seen.
- **Core charges explained before the invoice** — parts with supplier
  deposits are listed with amounts, alongside the rule that matters: leave
  the old part with us and the deposit is waived.

## Behind the counter (password-protected)

- **Spreadsheet import** — upload the Excel/CSV you already keep. Forgiving
  about formats ("8/14/2026", "8am", "LOF", "front pads"). Unreadable rows
  are reported by row number and reason; overlaps import anyway, flagged.
- **The job book, three ways** — List (next two weeks), Calendar (month at a
  glance, closed days grayed), Sheet (looks like your spreadsheet, status
  dropdown per row, booked value totaled). Works on a phone in the bay.
- **One password, properly done** — signing in gives your browser a
  tamper-proof, expiring pass; every schedule request re-checks it. No
  password, no data, even for someone poking at the site's plumbing.

## Under the hood

- **Classic Toyota/Lexus smarts** (from the XAT Racing catalog): a '94 Supra
  or LS400 is recognized by platform and engine code (A80/2JZ, UCF20/1UZ…).
- **No subscriptions.** VIN data is a free federal service; fonts, code, and
  the vehicle catalog are built in. Only recurring cost is ordinary hosting
  (the $10–20/month class).

## Straight talk: before this goes live

- [ ] **Prices, hours, and the service menu are placeholders** — every number
      needs your say-so (all marked `TODO` in one place).
- [ ] **Appointments currently save to a simple file** — fine for trying it;
      gets a proper database before real customers.
- [ ] **Email confirmations aren't wired yet.**
- [ ] **Set a real admin password** — it ships with a temporary one.
- [ ] **Core deposit amounts need checking** against the parts supplier.
- [ ] **One real-world test of the VIN model-lookup** — the network where
      this was built blocks it; it's built to spec but wants one click from a
      normal connection.

**What it adds up to:** fewer interrupted jobs to answer the phone, a schedule
you can check from under a lift, cars identified before they arrive, and
after-hours bookings you're currently not getting — for the cost of basic
hosting.
