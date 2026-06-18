import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getClearCookieOptions } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const opts = getClearCookieOptions();
    cookieStore.set(opts);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Logout failed." }, { status: 500 });
  }
}
