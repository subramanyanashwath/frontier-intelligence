import { NextResponse } from "next/server";
import { z } from "zod";
import { CAPABILITY_BY_SLUG } from "@/lib/capabilities/ontology";
import { draftCalibration } from "@/lib/data/mutations";

const bodySchema = z.object({
  answers: z.record(z.string(), z.string()).default({}),
  exercised: z.array(z.string()).default([]),
  leverage: z.string().default(""),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid calibration payload." }, { status: 400 });
  const proposals = await draftCalibration(parsed.data);
  return NextResponse.json({
    proposals: proposals.map((proposal) => ({
      ...proposal,
      name: CAPABILITY_BY_SLUG.get(proposal.capabilityId)?.name ?? proposal.capabilityId,
    })),
  });
}
