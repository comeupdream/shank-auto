/**
 * POST /api/estimates — receive an estimate request.
 *
 * SCAFFOLD: this validates the payload and logs it. There is no database yet,
 * so nothing is persisted and no email is sent — a submitted request would be
 * lost on restart. Wiring this up is the next step; see README "Not built
 * yet". Revive Detail's Prisma schema + Resend integration are the model to
 * copy for both.
 */

import { NextResponse } from "next/server";
import { serviceById } from "@/lib/services";
import { isVehicleClass } from "@/lib/vehicle-catalog";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const serviceId = typeof b.serviceId === "string" ? b.serviceId : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!phone && !email) {
    return NextResponse.json(
      { error: "A phone number or email is required." },
      { status: 400 },
    );
  }
  const service = serviceById(serviceId);
  if (!service) {
    return NextResponse.json({ error: "Unknown service." }, { status: 400 });
  }

  const vehicle = (b.vehicle ?? {}) as Record<string, unknown>;
  if (vehicle.vehicleClass !== undefined && !isVehicleClass(vehicle.vehicleClass)) {
    return NextResponse.json({ error: "Unknown vehicle type." }, { status: 400 });
  }

  // TODO: persist to the database and email the shop.
  console.info("[estimate request]", {
    name,
    phone,
    email,
    service: service.name,
    vehicle: b.vehicleLabel,
    concern: b.concern,
  });

  return NextResponse.json({ ok: true });
}
