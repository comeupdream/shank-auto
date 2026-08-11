/**
 * POST /api/admin/schedule/import — upload a schedule spreadsheet.
 *
 * Multipart form with a single `file` field (.xlsx, .xls, or .csv). Parses,
 * validates row-by-row, populates the appointment book, and returns the
 * per-row report for the admin UI to display.
 */

import { NextResponse } from "next/server";
import { isAdminAuthed } from "@/lib/auth";
import { importScheduleSheet } from "@/lib/schedule-import";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB is an enormous schedule sheet

export async function POST(req: Request) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Attach a spreadsheet file." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (5 MB max)." }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const report = await importScheduleSheet(buffer);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that file — is it a valid .xlsx or .csv?" },
      { status: 422 },
    );
  }
}
