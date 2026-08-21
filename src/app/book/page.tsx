import BookingScheduler from "@/components/BookingScheduler";
import SectionHeader from "@/components/SectionHeader";
import { SERVICES } from "@/lib/services";

export const metadata = { title: "Schedule Drop-off — Shank Auto Repair" };

export default function BookPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionHeader
        as="h1"
        kicker="Scheduling"
        title="Schedule a drop-off"
        blurb="Pick a service and a time that suits you. Times shown are open on our schedule — no double-booking."
      />
      <div className="card p-5 sm:p-8">
        <BookingScheduler services={SERVICES} />
      </div>
    </div>
  );
}
