import { NextResponse } from "next/server";
import { PRIVATE_COOKIE } from "@/lib/auth/private-session";

export async function POST(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const response = NextResponse.redirect(new URL("/operator", `${proto}://${host}`), 303);
  response.cookies.set(PRIVATE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}
