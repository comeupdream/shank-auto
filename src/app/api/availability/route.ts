/**
 * GET /api/availability?date=YYYY-MM-DD&serviceId=... — open start times.
 * Ported from Revive Detail; services come from the static menu.
 */

import { NextResponse } from "next/server";
import { computeAvailableSlots } from "@/lib/availability";
import { getBusyBlocks } from "@/lib/appointment-store";
import { serviceById } from "@/lib/services";
import { isValidDateISO } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  const serviceId = searchParams.get("serviceId") ?? "";

  if (!isValidDateISO(date)) {
    return NextResponse.json({ error: "Invalid or missing date." }, { status: 400 });
  }

  const service = serviceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "Invalid service." }, { status: 400 });
  }

  const busy = await getBusyBlocks(date);
  const slots = computeAvailableSlots(date, service.minutes, busy);

  return NextResponse.json({
    date,
    serviceId,
    durationMinutes: service.minutes,
    slots,
  });
}
