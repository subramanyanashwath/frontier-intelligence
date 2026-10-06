import { NextResponse } from "next/server";
import { PRIVATE_COOKIE, privatePassphrase, sessionToken } from "@/lib/auth/private-session";

export async function POST(request: Request) {
  const form = await request.formData();
  const passphrase = String(form.get("passphrase") ?? "");
  const next = String(form.get("next") ?? "/private");
  const destination = next.startsWith("/private") ? next : "/private";
  const expected = privatePassphrase();
  const url = sameOrigin(request, destination);
  if (!expected || passphrase !== expected) {
    const login = sameOrigin(request, "/login");
    login.searchParams.set("next", destination);
    login.searchParams.set("error", "1");
    return NextResponse.redirect(login, 303);
  }
  const response = NextResponse.redirect(url, 303);
  response.cookies.set(PRIVATE_COOKIE, sessionToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

function sameOrigin(request: Request, path: string): URL {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return new URL(path, `${proto}://${host}`);
}
