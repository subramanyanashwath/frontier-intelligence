import { eq } from "drizzle-orm";
import { DATA_AS_OF } from "@/lib/dates";
import { getDb } from "@/lib/db/client";
import { capabilityUpdateProposals, mandateCapabilities, monthlyInterviews } from "@/lib/db/schema";
import { readOverlay, writeOverlay } from "@/lib/data/overlay";
import { getDataset } from "@/lib/data/repository";
import type { CapabilityUpdateProposal } from "@/lib/domain";

export async function saveMandateRows(
  rows: { capabilityId: string; importance: number; currentDepth: number; targetDepth: number }[],
): Promise<void> {
  const db = getDb();
  const stamp = process.env.DATABASE_URL ? new Date().toISOString() : `${DATA_AS_OF}T12:00:00.000Z`;
  if (db) {
    for (const row of rows) {
      const existing = await db.select().from(mandateCapabilities).where(eq(mandateCapabilities.capabilityId, row.capabilityId));
      const current = existing[0];
      if (!current) continue;
      const history = current.historyJson.some((point) => point.depth === row.currentDepth && point.date === stamp.slice(0, 10))
        ? current.historyJson
        : [...current.historyJson, { date: stamp.slice(0, 10), depth: row.currentDepth }];
      await db
        .update(mandateCapabilities)
        .set({
          importance: row.importance,
          currentDepth: row.currentDepth,
          targetDepth: row.targetDepth,
          historyJson: history,
          updatedAt: stamp,
        })
        .where(eq(mandateCapabilities.id, current.id));
    }
    return;
  }
  const overlay = await readOverlay();
  for (const row of rows) {
    overlay.mandate[row.capabilityId] = {
      importance: row.importance,
      currentDepth: row.currentDepth,
      targetDepth: row.targetDepth,
      updatedAt: stamp.slice(0, 10),
    };
  }
  await writeOverlay(overlay);
}

export async function draftCalibration(input: {
  answers: Record<string, string>;
  exercised: string[];
  leverage: string;
}): Promise<CapabilityUpdateProposal[]> {
  const dataset = await getDataset();
  const month = DATA_AS_OF.slice(0, 7);
  const interviewId = `int_${month.replace("-", "_")}_${Date.now()}`;
  const summary = input.answers.artifact || input.answers.faster || "Calibration submitted. Awaiting approval.";
  const slugs = [...new Set([...input.exercised, input.leverage].filter(Boolean))];
  const proposals: CapabilityUpdateProposal[] = [];
  for (const slug of slugs) {
    const row = dataset.mandateCapabilities.find((item) => item.capabilityId === slug);
    if (!row) continue;
    const bump = slug === input.leverage ? 4 : 3;
    const proposed = Math.min(row.targetDepth, row.currentDepth + bump);
    if (proposed === row.currentDepth) continue;
    proposals.push({
      id: `prop_${interviewId}_${slug}`,
      monthlyInterviewId: interviewId,
      capabilityId: slug,
      oldValue: row.currentDepth,
      proposedValue: proposed,
      rationale: `Draft from this month's notes. ${slug === input.leverage ? "Marked as highest leverage." : "Marked as exercised."} Approval is required before depth changes.`,
      approved: null,
      approvedAt: null,
    });
  }
  const interview = {
    id: interviewId,
    month,
    answers: { ...input.answers, exercised: input.exercised, leverage: input.leverage },
    summary,
    completedAt: null,
    createdAt: DATA_AS_OF,
  };
  const db = getDb();
  if (db) {
    await db.insert(monthlyInterviews).values({
      id: interview.id,
      month: interview.month,
      answersJson: interview.answers,
      summary: interview.summary,
      completedAt: null,
      createdAt: `${DATA_AS_OF}T00:00:00.000Z`,
    });
    if (proposals.length) {
      await db.insert(capabilityUpdateProposals).values(
        proposals.map((proposal) => ({
          id: proposal.id,
          monthlyInterviewId: proposal.monthlyInterviewId,
          capabilityId: proposal.capabilityId,
          oldValue: proposal.oldValue,
          proposedValue: proposal.proposedValue,
          rationale: proposal.rationale,
          approved: null,
          approvedAt: null,
        })),
      );
    }
    return proposals;
  }
  const overlay = await readOverlay();
  overlay.interviews.push(interview);
  overlay.proposals.push(...proposals);
  await writeOverlay(overlay);
  return proposals;
}

export async function approveProposals(ids: string[]): Promise<number> {
  const dataset = await getDataset();
  const chosen = dataset.proposals.filter((proposal) => ids.includes(proposal.id) && proposal.approved !== true);
  const db = getDb();
  const stamp = `${DATA_AS_OF}T12:00:00.000Z`;
  if (db) {
    for (const proposal of chosen) {
      await db
        .update(capabilityUpdateProposals)
        .set({ approved: true, approvedAt: stamp })
        .where(eq(capabilityUpdateProposals.id, proposal.id));
      const rows = await db.select().from(mandateCapabilities).where(eq(mandateCapabilities.capabilityId, proposal.capabilityId));
      const row = rows[0];
      if (!row) continue;
      await db
        .update(mandateCapabilities)
        .set({
          currentDepth: proposal.proposedValue,
          historyJson: [...row.historyJson, { date: DATA_AS_OF, depth: proposal.proposedValue }],
          updatedAt: stamp,
        })
        .where(eq(mandateCapabilities.id, row.id));
    }
    return chosen.length;
  }
  const overlay = await readOverlay();
  for (const proposal of chosen) {
    const stored = overlay.proposals.find((item) => item.id === proposal.id);
    if (stored) {
      stored.approved = true;
      stored.approvedAt = DATA_AS_OF;
    }
    const patch = overlay.mandate[proposal.capabilityId] ?? { updatedAt: DATA_AS_OF };
    overlay.mandate[proposal.capabilityId] = {
      ...patch,
      currentDepth: proposal.proposedValue,
      updatedAt: DATA_AS_OF,
    };
  }
  await writeOverlay(overlay);
  return chosen.length;
}
