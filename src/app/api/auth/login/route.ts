import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getOwnerSessionToken, ownerSessionCookieName, validateOwnerPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };

  if (!body.password || !validateOwnerPassword(body.password)) {
    return NextResponse.json({ error: "Senha invalida." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ownerSessionCookieName, getOwnerSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return NextResponse.json({ ok: true });
}
