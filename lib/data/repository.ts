import { cache } from "react";
import { ONTOLOGY } from "@/lib/capabilities/ontology";
import { getDb } from "@/lib/db/client";
import * as tables from "@/lib/db/schema";
import { applyOverlay, readOverlay } from "@/lib/data/overlay";
import type {
  CapabilityUpdateProposal,
  Dataset,
  Discipline,
  EvidenceType,
  IngestionRun,
  Job,
  JobStatus,
  MonthlyInterview,
} from "@/lib/domain";
import { getSeedDataset } from "@/lib/seed/generate";

export const getDataset = cache(async (): Promise<Dataset> => {
  const base = process.env.DATABASE_URL ? await loadPostgres() : getSeedDataset();
  if (process.env.DATABASE_URL) return base;
  return applyOverlay(base, await readOverlay());
});

async function loadPostgres(): Promise<Dataset> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is set but the Postgres client did not start.");
  const [jobRows, snapshotRows, linkRows, capabilityRows, mandateRows, mandateCapRows, recommendationRows, interviewRows, proposalRows, runRows] =
    await Promise.all([
      db.select().from(tables.jobs),
      db.select().from(tables.jobSnapshots),
      db.select().from(tables.jobCapabilities),
      db.select().from(tables.capabilities),
      db.select().from(tables.mandates),
      db.select().from(tables.mandateCapabilities),
      db.select().from(tables.recommendations),
      db.select().from(tables.monthlyInterviews),
      db.select().from(tables.capabilityUpdateProposals),
      db.select().from(tables.ingestionRuns),
    ]);

  if (jobRows.length === 0) {
    throw new Error("Postgres is connected and empty. Run pnpm db:seed. Demo data is not substituted for an empty database.");
  }

  const capabilities = capabilityRows.length
    ? capabilityRows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        parentId: row.parentId,
        description: row.description,
        aliases: row.aliasesJson,
        phrases: row.phrasesJson,
        category: row.category,
        baseTheta: row.baseTheta,
        baseVega: row.baseVega,
        adjacency: row.adjacencyJson,
      }))
    : ONTOLOGY;

  return {
    asOf: jobRows.reduce((max, job) => (job.lastSeenAt.slice(0, 10) > max ? job.lastSeenAt.slice(0, 10) : max), "1970-01-01"),
    isDemo: jobRows.every((job) => job.isDemo),
    capabilities,
    jobs: jobRows.map((row) => ({
      id: row.id,
      source: row.source,
      sourceJobId: row.sourceJobId,
      title: row.title,
      company: row.company,
      org: row.org,
      team: row.team,
      discipline: row.discipline as Discipline,
      level: row.level,
      locations: row.locationsJson,
      sourceUrl: row.sourceUrl,
      postedAt: row.postedAt.slice(0, 10),
      firstSeenAt: row.firstSeenAt.slice(0, 10),
      lastSeenAt: row.lastSeenAt.slice(0, 10),
      closedAt: row.closedAt ? row.closedAt.slice(0, 10) : null,
      status: row.status as JobStatus,
      archetype: row.archetype,
      isDemo: row.isDemo,
      createdAt: row.createdAt.slice(0, 10),
      updatedAt: row.updatedAt.slice(0, 10),
    })),
    snapshots: snapshotRows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      capturedAt: row.capturedAt.slice(0, 10),
      contentHash: row.contentHash,
      rawHtml: row.rawHtml,
      rawText: row.rawText,
      sourceMetadata: row.sourceMetadataJson,
    })),
    links: linkRows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      capabilityId: row.capabilityId,
      weight: row.weight,
      evidenceType: row.evidenceType as EvidenceType,
      confidence: row.confidence,
      evidenceQuote: row.evidenceQuote,
      sourceSnapshotId: row.sourceSnapshotId,
      createdAt: row.createdAt.slice(0, 10),
    })),
    recommendations: recommendationRows.map((row) => ({
      id: row.id,
      jobId: row.jobId,
      sourceMessageId: row.sourceMessageId,
      recommendedAt: row.recommendedAt.slice(0, 10),
      recommendationRank: row.recommendationRank,
      subject: row.subject,
      rawMetadata: row.rawMetadataJson,
      isDemo: row.isDemo,
    })),
    mandates: mandateRows.map((row) => ({
      id: row.id,
      name: row.name,
      title: row.title,
      organization: row.organization,
      description: row.description,
      activeFrom: row.activeFrom.slice(0, 10),
      activeTo: row.activeTo ? row.activeTo.slice(0, 10) : null,
      createdAt: row.createdAt.slice(0, 10),
    })),
    mandateCapabilities: mandateCapRows.map((row) => ({
      id: row.id,
      mandateId: row.mandateId,
      capabilityId: row.capabilityId,
      importance: row.importance,
      currentDepth: row.currentDepth,
      targetDepth: row.targetDepth,
      confidence: row.confidence,
      rationale: row.rationale,
      updatedAt: row.updatedAt.slice(0, 10),
      history: row.historyJson,
    })),
    interviews: interviewRows.map(mapInterview),
    proposals: proposalRows.map(mapProposal),
    ingestionRuns: runRows.map(mapRun),
  };
}

function mapInterview(row: typeof tables.monthlyInterviews.$inferSelect): MonthlyInterview {
  return {
    id: row.id,
    month: row.month,
    answers: row.answersJson,
    summary: row.summary,
    completedAt: row.completedAt ? row.completedAt.slice(0, 10) : null,
    createdAt: row.createdAt.slice(0, 10),
  };
}

function mapProposal(row: typeof tables.capabilityUpdateProposals.$inferSelect): CapabilityUpdateProposal {
  return {
    id: row.id,
    monthlyInterviewId: row.monthlyInterviewId,
    capabilityId: row.capabilityId,
    oldValue: row.oldValue,
    proposedValue: row.proposedValue,
    rationale: row.rationale,
    approved: row.approved,
    approvedAt: row.approvedAt ? row.approvedAt.slice(0, 10) : null,
  };
}

function mapRun(row: typeof tables.ingestionRuns.$inferSelect): IngestionRun {
  return {
    id: row.id,
    source: row.source,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    status: row.status as IngestionRun["status"],
    recordsSeen: row.recordsSeen,
    recordsCreated: row.recordsCreated,
    recordsChanged: row.recordsChanged,
    recordsUnchanged: row.recordsUnchanged,
    recordsFailed: row.recordsFailed,
    errorSummary: row.errorSummary,
    isDemo: row.isDemo,
    details: row.detailsJson,
  };
}

export async function listJobs(): Promise<Job[]> {
  return (await getDataset()).jobs;
}

export async function findJob(id: string): Promise<Job | undefined> {
  return (await getDataset()).jobs.find((job) => job.id === id);
}
