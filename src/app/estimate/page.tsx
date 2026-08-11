import EstimateForm from "@/components/EstimateForm";
import { SERVICES } from "@/lib/services";

export const metadata = { title: "Get an Estimate — Shank Auto Repair" };

export default function EstimatePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-semibold uppercase tracking-wide text-slate-900">Get an estimate</h1>
      <p className="mt-2 text-slate-600">
        Start with your VIN and we&apos;ll fill in the rest — or pick your
        vehicle by year, make, and model.
      </p>

      <div className="mt-8">
        <EstimateForm services={SERVICES} />
      </div>
    </div>
  );
}
