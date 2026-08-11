/**
 * GET /api/vin/:vin — decode a VIN.
 *
 * Always answers 200 with a decode result, even for a malformed VIN: the
 * `valid` / `errors` fields on the payload carry the problem so the form can
 * show it inline. A 4xx here would just make the client re-derive the same
 * information from a status code.
 */

import { NextResponse } from "next/server";
import { getVehicleProvider } from "@/lib/vehicle-provider";
import { normalizeVin } from "@/lib/vin";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vin: string }> },
) {
  const { vin } = await params;
  const normalized = normalizeVin(vin ?? "");

  // Cheap guard against being used as a proxy for arbitrary upstream calls.
  if (normalized.length > 17) {
    return NextResponse.json({ error: "VIN too long." }, { status: 400 });
  }

  const identity = await getVehicleProvider().decodeVin(normalized);
  return NextResponse.json(identity);
}
