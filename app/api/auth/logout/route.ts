import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PRIVATE_COOKIE } from "@/lib/auth/private-session";

export async function POST(request: Request) {
  const jar = await cookies();
  jar.delete(PRIVATE_COOKIE);
  return NextResponse.redirect(new URL("/operator", request.url), 303);
}
