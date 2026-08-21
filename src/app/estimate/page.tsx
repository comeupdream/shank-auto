import EstimateForm from "@/components/EstimateForm";
import SectionHeader from "@/components/SectionHeader";
import { SERVICES } from "@/lib/services";

export const metadata = { title: "Get an Estimate — Shank Auto Repair" };

export default function EstimatePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionHeader
        as="h1"
        kicker="Instant pricing"
        title="Get an estimate"
        blurb="Start with your VIN and we'll fill in the rest — or pick your vehicle by year, make, and model."
      />
      <div className="card p-5 sm:p-8">
        <EstimateForm services={SERVICES} />
      </div>
    </div>
  );
}
