import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ownerSessionCookieName } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ownerSessionCookieName);
  return NextResponse.json({ ok: true });
}
