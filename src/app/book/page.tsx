import BookingScheduler from "@/components/BookingScheduler";
import { SERVICES } from "@/lib/services";
import { SHOP, shopTodayISO } from "@/lib/shop-config";
import { addDaysISO } from "@/lib/time";

export const metadata = { title: "Schedule Drop-off — Shank Auto Repair" };
export const dynamic = "force-dynamic";

export default function BookPage() {
  const today = shopTodayISO();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold text-slate-900">Schedule a drop-off</h1>
      <p className="mt-2 text-slate-600">
        Pick a service and a time that suits you. Times shown are open on our
        schedule — no double-booking.
      </p>

      <div className="mt-8">
        <BookingScheduler
          services={SERVICES}
          minDate={today}
          maxDate={addDaysISO(today, SHOP.bookingHorizonDays)}
        />
      </div>
    </div>
  );
}
