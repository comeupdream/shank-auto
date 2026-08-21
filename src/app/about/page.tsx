import Link from "next/link";
import SectionHeader from "@/components/SectionHeader";
import ShankLogo from "@/components/ShankLogo";
import { SHOP, directionsHref, telHref } from "@/lib/shop-config";

export const metadata = { title: "About — Shank Auto Repair" };

/**
 * TODO: the story card below is deliberately generic — swap in the shop's
 * real history (years in business, the team, certifications, specialties)
 * when the owner supplies it.
 */

const HOW_WE_WORK = [
  {
    title: "Straight prices",
    body: "Maintenance is flat-rate and posted. Repair work is quoted after we actually look at the vehicle — never off a guess.",
  },
  {
    title: "A call before any work",
    body: "Nothing gets fixed until you've heard the number and said yes. No surprise line items at pickup.",
  },
  {
    title: "Your time, respected",
    body: "Book a drop-off online, price the job from your couch, and get your VIN decoded before you've found your keys.",
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <SectionHeader
        as="h1"
        kicker="The shop"
        title={`About ${SHOP.name}`}
        blurb={SHOP.tagline}
      />

      <section className="card flex flex-col items-start gap-8 p-6 sm:p-8 lg:flex-row lg:items-center">
        <ShankLogo className="w-32 shrink-0 sm:w-40" />
        <div className="max-w-2xl space-y-3 text-slate-700">
          <p>
            {SHOP.name} is a Harrisonburg repair shop on Cross Keys Road,
            keeping Valley cars, trucks, and vans on the road. {SHOP.blurb}
          </p>
          <p>
            Bring us the maintenance your schedule keeps postponing, the
            warning light you&apos;ve been ignoring, or the noise you can&apos;t
            place — we&apos;ll tell you what it needs, what it costs, and what
            can wait.
          </p>
        </div>
      </section>

      <section>
        <SectionHeader
          kicker="How we work"
          title="No surprises"
          blurb="The rules of the shop, in three lines."
        />
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {HOW_WE_WORK.map(({ title, body }) => (
            <div key={title} className="card p-5">
              <h3 className="text-sm font-bold uppercase tracking-wide text-accent-dark">
                {title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col justify-between gap-6 !bg-chassis p-6 text-white sm:p-8 lg:flex-row lg:items-center">
        <div>
          <h2 className="font-display text-3xl font-semibold uppercase tracking-wide">
            Come see us
          </h2>
          <p className="mt-1 text-slate-300">
            {SHOP.address}, {SHOP.cityLine} —{" "}
            <a href={directionsHref()} className="text-accent underline">
              directions
            </a>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/book"
            className="rounded-md bg-white px-6 py-3 text-sm font-bold text-chassis transition-colors hover:bg-accent"
          >
            Book a drop-off
          </Link>
          <a
            href={telHref()}
            className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Call {SHOP.phone}
          </a>
        </div>
      </section>
    </div>
  );
}
