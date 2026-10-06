import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const PRIVATE_COOKIE = "fo_private";

export function privatePassphrase(): string | null {
  if (process.env.PRIVATE_MODE_PASSPHRASE) return process.env.PRIVATE_MODE_PASSPHRASE;
  if (process.env.NODE_ENV === "production") return null;
  return "demo-operator";
}

export function sessionToken(passphrase: string): string {
  return createHash("sha256").update(`fo-private:${passphrase}`).digest("hex");
}

export async function isPrivateSession(): Promise<boolean> {
  const passphrase = privatePassphrase();
  if (!passphrase) return false;
  const jar = await cookies();
  const value = jar.get(PRIVATE_COOKIE)?.value;
  if (!value) return false;
  const expected = sessionToken(passphrase);
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
