/**
 * GET /api/ymm — the year → make → model cascade.
 *
 *   /api/ymm                       → { years }
 *   /api/ymm?year=2019             → { year, makes }
 *   /api/ymm?year=2019&make=Toyota → { year, make, models }
 *
 * Each step returns only what the next dropdown needs, so the form never ships
 * the whole catalog to the browser.
 */

import { NextResponse } from "next/server";
import { years } from "@/lib/vehicle-catalog";
import { getVehicleProvider } from "@/lib/vehicle-provider";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const make = searchParams.get("make");

  if (!yearParam) {
    return NextResponse.json({ years: years() });
  }

  const year = Number(yearParam);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    return NextResponse.json({ error: "Invalid year." }, { status: 400 });
  }

  const provider = getVehicleProvider();

  if (!make) {
    return NextResponse.json({ year, makes: await provider.makesForYear(year) });
  }

  return NextResponse.json({
    year,
    make,
    models: await provider.modelsFor(make, year),
  });
}
