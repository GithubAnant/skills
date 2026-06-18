import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyPassword,
  createSession,
  getSessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };

    if (!body.password || typeof body.password !== "string") {
      return NextResponse.json(
        { error: "Password is required." },
        { status: 400 },
      );
    }

    if (!verifyPassword(body.password)) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    const token = createSession();
    const cookieStore = await cookies();
    const opts = getSessionCookieOptions(token);
    cookieStore.set(opts);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Authentication failed." },
      { status: 500 },
    );
  }
}
