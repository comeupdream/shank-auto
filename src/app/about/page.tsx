import { SHOP } from "@/lib/shop-config";

export const metadata = { title: "About — Shank Auto Repair" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold text-slate-900">About {SHOP.name}</h1>
      <p className="text-slate-600">{SHOP.tagline}</p>

      {/* TODO: replace with the shop's real story — years in business, the
          team, certifications, and what they specialize in. */}
      <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        Placeholder — needs the shop&apos;s own copy.
      </p>
    </div>
  );
}
