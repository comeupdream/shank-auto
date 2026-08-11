/**
 * PATCH /api/admin/appointments/:id — change an appointment's status.
 * Auth-gated like every /api/admin route; the page gate is cosmetic, this
 * check is the real one.
 */

import { NextResponse } from "next/server";
import { updateAppointmentStatus } from "@/lib/appointment-store";
import { isAppointmentStatus } from "@/lib/appointment-status";
import { isAdminAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { status?: string } | null;
  if (!body || !isAppointmentStatus(body.status)) {
    return NextResponse.json(
      { error: "status must be CONFIRMED, COMPLETED, CANCELLED or NO_SHOW." },
      { status: 400 },
    );
  }

  const updated = await updateAppointmentStatus(id, body.status);
  if (!updated) {
    return NextResponse.json({ error: "No such appointment." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, appointment: updated });
}
