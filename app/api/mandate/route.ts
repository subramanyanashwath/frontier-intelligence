import { NextResponse } from "next/server";
import { z } from "zod";
import { saveMandateRows } from "@/lib/data/mutations";

const bodySchema = z.object({
  rows: z.array(
    z.object({
      capabilityId: z.string().min(1),
      importance: z.number().min(0).max(100),
      currentDepth: z.number().min(0).max(100),
      targetDepth: z.number().min(0).max(100),
    }),
  ),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid mandate payload." }, { status: 400 });
  await saveMandateRows(parsed.data.rows);
  return NextResponse.json({ ok: true });
}
