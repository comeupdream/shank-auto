import { NextResponse } from "next/server";
import { checkAdminPassword, createSessionToken, sessionCookieOptions } from "@/lib/auth";

/** POST /api/admin/login — password → signed session cookie. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !checkAdminPassword(body.password)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...sessionCookieOptions, value: createSessionToken() });
  return res;
}
