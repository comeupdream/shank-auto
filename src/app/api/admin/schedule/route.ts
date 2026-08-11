/**
 * GET /api/admin/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD — the job book.
 * Auth-gated; defaults to today through two weeks out.
 */

import { NextResponse } from "next/server";
import { listAppointments } from "@/lib/appointment-store";
import { isAdminAuthed } from "@/lib/auth";
import { shopTodayISO } from "@/lib/shop-config";
import { addDaysISO, isValidDateISO } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const today = shopTodayISO();
  const from = searchParams.get("from") ?? today;
  const to = searchParams.get("to") ?? addDaysISO(today, 14);

  if (!isValidDateISO(from) || !isValidDateISO(to)) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const appointments = await listAppointments({ from, to });
  return NextResponse.json({ from, to, appointments });
}
