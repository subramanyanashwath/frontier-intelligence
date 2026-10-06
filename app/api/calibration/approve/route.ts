import { NextResponse } from "next/server";
import { z } from "zod";
import { approveProposals } from "@/lib/data/mutations";

const bodySchema = z.object({ ids: z.array(z.string()) });

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid approval payload." }, { status: 400 });
  const updated = await approveProposals(parsed.data.ids);
  return NextResponse.json({ updated });
}
