import BookingScheduler from "@/components/BookingScheduler";
import { SERVICES } from "@/lib/services";

export const metadata = { title: "Schedule Drop-off — Shank Auto Repair" };

export default function BookPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-4xl font-semibold uppercase tracking-wide text-slate-900">Schedule a drop-off</h1>
      <p className="mt-2 text-slate-600">
        Pick a service and a time that suits you. Times shown are open on our
        schedule — no double-booking.
      </p>

      <div className="mt-8">
        <BookingScheduler services={SERVICES} />
      </div>
    </div>
  );
}
