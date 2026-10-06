import { inArray, sql } from "drizzle-orm";
import { learningAllocation } from "@/lib/analytics/allocation";
import { diffusionFor } from "@/lib/analytics/diffusion";
import { operatorEvents } from "@/lib/analytics/events";
import { greeksFor } from "@/lib/analytics/greeks";
import { capabilityMomentum, persistenceScore } from "@/lib/analytics/momentum";
import { getDb } from "@/lib/db/client";
import * as tables from "@/lib/db/schema";
import type { Dataset } from "@/lib/domain";
import { DATA_AS_OF } from "@/lib/dates";

function ts(day: string): string {
  return day.length > 10 ? day : `${day}T00:00:00.000Z`;
}

export async function replaceDemoDataset(dataset: Dataset): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required to seed Postgres.");
  await db.execute(sql`delete from job_capabilities where job_id in (select id from jobs where is_demo = true)`);
  await db.execute(sql`delete from job_snapshots where job_id in (select id from jobs where is_demo = true)`);
  await db.execute(sql`delete from recommendations where is_demo = true`);
  await db.execute(sql`delete from events where coalesce(metadata_json->>'isDemo', 'false') = 'true'`);
  await db.execute(sql`delete from jobs where is_demo = true`);
  await db.execute(sql`delete from ingestion_runs where is_demo = true`);
  await db.delete(tables.capabilityUpdateProposals).where(
    inArray(
      tables.capabilityUpdateProposals.id,
      dataset.proposals.map((proposal) => proposal.id),
    ),
  );
  await db.delete(tables.monthlyInterviews).where(
    inArray(
      tables.monthlyInterviews.id,
      dataset.interviews.map((interview) => interview.id),
    ),
  );
  await db.delete(tables.mandateCapabilities).where(inArray(tables.mandateCapabilities.mandateId, dataset.mandates.map((mandate) => mandate.id)));
  await db.delete(tables.mandates).where(inArray(tables.mandates.id, dataset.mandates.map((mandate) => mandate.id)));

  await db
    .insert(tables.capabilities)
    .values(
      dataset.capabilities.map((capability) => ({
        id: capability.id,
        slug: capability.slug,
        name: capability.name,
        parentId: capability.parentId,
        description: capability.description,
        aliasesJson: capability.aliases,
        phrasesJson: capability.phrases,
        category: capability.category,
        baseTheta: capability.baseTheta,
        baseVega: capability.baseVega,
        adjacencyJson: capability.adjacency,
        createdAt: ts(DATA_AS_OF),
      })),
    )
    .onConflictDoNothing();

  for (const chunk of chunks(dataset.jobs, 40)) {
    await db.insert(tables.jobs).values(
      chunk.map((job) => ({
        id: job.id,
        source: job.source,
        sourceJobId: job.sourceJobId,
        title: job.title,
        company: job.company,
        org: job.org,
        team: job.team,
        discipline: job.discipline,
        level: job.level,
        locationsJson: job.locations,
        sourceUrl: job.sourceUrl,
        postedAt: ts(job.postedAt),
        firstSeenAt: ts(job.firstSeenAt),
        lastSeenAt: ts(job.lastSeenAt),
        closedAt: job.closedAt ? ts(job.closedAt) : null,
        status: job.status,
        archetype: job.archetype,
        isDemo: job.isDemo,
        createdAt: ts(job.createdAt),
        updatedAt: ts(job.updatedAt),
      })),
    );
  }
  for (const chunk of chunks(dataset.snapshots, 30)) {
    await db.insert(tables.jobSnapshots).values(
      chunk.map((snapshot) => ({
        id: snapshot.id,
        jobId: snapshot.jobId,
        capturedAt: ts(snapshot.capturedAt),
        contentHash: snapshot.contentHash,
        rawHtml: snapshot.rawHtml,
        rawText: snapshot.rawText,
        sourceMetadataJson: snapshot.sourceMetadata,
      })),
    );
  }
  for (const chunk of chunks(dataset.links, 80)) {
    await db.insert(tables.jobCapabilities).values(
      chunk.map((link) => ({
        id: link.id,
        jobId: link.jobId,
        capabilityId: link.capabilityId,
        weight: link.weight,
        evidenceType: link.evidenceType,
        confidence: link.confidence,
        evidenceQuote: link.evidenceQuote,
        sourceSnapshotId: link.sourceSnapshotId,
        createdAt: ts(link.createdAt),
      })),
    );
  }
  await db.insert(tables.mandates).values(
    dataset.mandates.map((mandate) => ({
      id: mandate.id,
      name: mandate.name,
      title: mandate.title,
      organization: mandate.organization,
      description: mandate.description,
      activeFrom: ts(mandate.activeFrom),
      activeTo: mandate.activeTo ? ts(mandate.activeTo) : null,
      createdAt: ts(mandate.createdAt),
    })),
  );
  await db.insert(tables.mandateCapabilities).values(
    dataset.mandateCapabilities.map((row) => ({
      id: row.id,
      mandateId: row.mandateId,
      capabilityId: row.capabilityId,
      importance: row.importance,
      currentDepth: row.currentDepth,
      targetDepth: row.targetDepth,
      confidence: row.confidence,
      rationale: row.rationale,
      historyJson: row.history,
      updatedAt: ts(row.updatedAt),
    })),
  );
  if (dataset.recommendations.length) {
    await db.insert(tables.recommendations).values(
      dataset.recommendations.map((rec) => ({
        id: rec.id,
        jobId: rec.jobId,
        sourceMessageId: rec.sourceMessageId,
        recommendedAt: ts(rec.recommendedAt),
        recommendationRank: rec.recommendationRank,
        subject: rec.subject,
        rawMetadataJson: rec.rawMetadata,
        isDemo: rec.isDemo,
      })),
    );
  }
  await db.insert(tables.monthlyInterviews).values(
    dataset.interviews.map((interview) => ({
      id: interview.id,
      month: interview.month,
      answersJson: interview.answers,
      summary: interview.summary,
      completedAt: interview.completedAt ? ts(interview.completedAt) : null,
      createdAt: ts(interview.createdAt),
    })),
  );
  await db.insert(tables.capabilityUpdateProposals).values(
    dataset.proposals.map((proposal) => ({
      id: proposal.id,
      monthlyInterviewId: proposal.monthlyInterviewId,
      capabilityId: proposal.capabilityId,
      oldValue: proposal.oldValue,
      proposedValue: proposal.proposedValue,
      rationale: proposal.rationale,
      approved: proposal.approved,
      approvedAt: proposal.approvedAt ? ts(proposal.approvedAt) : null,
    })),
  );
  await db.insert(tables.ingestionRuns).values(
    dataset.ingestionRuns.map((run) => ({
      id: run.id,
      source: run.source,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      status: run.status,
      recordsSeen: run.recordsSeen,
      recordsCreated: run.recordsCreated,
      recordsChanged: run.recordsChanged,
      recordsUnchanged: run.recordsUnchanged,
      recordsFailed: run.recordsFailed,
      errorSummary: run.errorSummary,
      isDemo: run.isDemo,
      detailsJson: run.details,
    })),
  );
  await persistDerived(dataset);
}

export async function persistDerived(dataset: Dataset, asOf = dataset.asOf): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required to persist metrics.");
  const createdAt = new Date().toISOString();
  const greeks = new Map(greeksFor(dataset, asOf).map((row) => [row.capabilityId, row]));
  const metricRows = dataset.capabilities
    .filter((capability) => capability.parentId)
    .map((capability) => {
      const momentum = capabilityMomentum(dataset, asOf, capability.slug, 90);
      const diffusion = diffusionFor(dataset, asOf, capability.slug, 90);
      const greek = greeks.get(capability.slug);
      const persistence = persistenceScore(dataset, asOf, capability.slug);
      return {
        id: `metric_${capability.slug}_${asOf}_90`,
        capabilityId: capability.slug,
        asOfDate: ts(asOf),
        windowDays: 90,
        postingCount: momentum.current,
        recommendationCount: dataset.recommendations.filter((rec) => rec.recommendedAt <= asOf && rec.jobId && dataset.links.some((link) => link.jobId === rec.jobId && link.capabilityId === capability.slug)).length,
        momentum: momentum.ratio,
        novelty: diffusion.novelty,
        persistence,
        functionalDiffusion: diffusion.functionCount,
        geographicDiffusion: diffusion.locationCount,
        levelDiffusion: diffusion.levelSpread,
        delta: greek?.delta ?? 0,
        gamma: greek?.gamma ?? 0,
        theta: greek?.theta ?? 0,
        vega: greek?.vega ?? 0,
        impliedVol: greek?.impliedVol ?? 0,
        confidence: Math.min(1, (momentum.current + momentum.prior) / 20),
        inputsJson: { counts: [momentum.current, momentum.prior], greek: greek?.inputs ?? [] },
        createdAt,
      };
    });
  await db.delete(tables.capabilityMetrics).where(inArray(tables.capabilityMetrics.id, metricRows.map((row) => row.id)));
  for (const chunk of chunks(metricRows, 40)) await db.insert(tables.capabilityMetrics).values(chunk);

  const lines = learningAllocation(dataset, asOf);
  const month = asOf.slice(0, 7);
  const allocationRows = lines.map((line) => ({
    id: `alloc_${month}_${line.capabilityId}`,
    month,
    capabilityId: line.capabilityId,
    allocationPct: line.allocationPct,
    rationale: line.whyNow,
    recommendedAction: line.action,
    timeEstimateHours: line.hours,
    createdAt,
  }));
  await db.delete(tables.learningAllocations).where(inArray(tables.learningAllocations.id, allocationRows.map((row) => row.id)));
  if (allocationRows.length) await db.insert(tables.learningAllocations).values(allocationRows);

  const eventRows = operatorEvents(dataset, asOf).slice(0, 400).map((event) => ({
    id: event.id,
    eventType: event.eventType,
    jobId: event.jobId,
    capabilityId: event.capabilityId,
    occurredAt: ts(event.occurredAt),
    title: event.title,
    summary: event.summary,
    metadataJson: { org: event.org, isDemo: event.isDemo, discipline: event.discipline },
  }));
  await db.delete(tables.events).where(inArray(tables.events.id, eventRows.map((row) => row.id)));
  for (const chunk of chunks(eventRows, 50)) await db.insert(tables.events).values(chunk);
}

function chunks<T>(items: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let i = 0; i < items.length; i += size) output.push(items.slice(i, i + size));
  return output;
}
