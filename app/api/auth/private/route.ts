import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PRIVATE_COOKIE, privatePassphrase, sessionToken } from "@/lib/auth/private-session";

export async function POST(request: Request) {
  const form = await request.formData();
  const passphrase = String(form.get("passphrase") ?? "");
  const next = String(form.get("next") ?? "/private");
  const destination = next.startsWith("/private") ? next : "/private";
  const expected = privatePassphrase();
  const url = new URL(destination, request.url);
  if (!expected || passphrase !== expected) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", destination);
    login.searchParams.set("error", "1");
    return NextResponse.redirect(login, 303);
  }
  const jar = await cookies();
  jar.set(PRIVATE_COOKIE, sessionToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return NextResponse.redirect(url, 303);
}
