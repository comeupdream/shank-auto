/**
 * POST /api/appointments — public booking. Ported from Revive Detail.
 */

import { NextResponse } from "next/server";
import { createBooking } from "@/lib/booking";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await createBooking({
    serviceId: String(body.serviceId ?? ""),
    date: String(body.date ?? ""),
    startTime: String(body.startTime ?? ""),
    customerName: String(body.customerName ?? ""),
    customerEmail: body.customerEmail ? String(body.customerEmail) : "",
    customerPhone: body.customerPhone ? String(body.customerPhone) : "",
    vehicle: body.vehicle ? String(body.vehicle) : "",
    vehicleVin: body.vehicleVin ? String(body.vehicleVin) : "",
    vehicleType: body.vehicleType ? String(body.vehicleType) : "",
    notes: body.notes ? String(body.notes) : "",
    source: "online",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.code });
  }
  return NextResponse.json(
    { ok: true, appointmentId: result.appointment.id },
    { status: 201 },
  );
}
