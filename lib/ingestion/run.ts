import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import * as tables from "@/lib/db/schema";
import type { Job, JobCapabilityLink, JobSnapshot } from "@/lib/domain";
import { fetchMicrosoftOpenings } from "@/lib/ingestion/microsoft-careers";
import { emptyMemory, ingestOpening, jobsToClose, type IngestMemory } from "@/lib/ingestion/pipeline";

export async function runMicrosoftIngestion(): Promise<{ status: string; seen: number; created: number; changed: number; unchanged: number; failed: number; closed: number }> {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required for ingestion.");
  const started = new Date().toISOString();
  const runId = `run_msft_${started.replace(/[:.]/g, "-")}`;
  try {
    const fetched = await fetchMicrosoftOpenings();
    const memory = await loadMicrosoftMemory();
    const today = started.slice(0, 10);
    let created = 0;
    let changed = 0;
    let unchanged = 0;
    for (const opening of fetched.openings) {
      const knownSnapshots = new Set(memory.snapshots.map((snapshot) => snapshot.id));
      const action = ingestOpening(memory, opening, today);
      const job = memory.jobs.find((item) => item.source === opening.source && item.sourceJobId === opening.sourceJobId);
      if (!job) continue;
      if (action === "created") {
        created += 1;
        await insertJob(job);
        await insertSnapshots(memory.snapshots.filter((snapshot) => snapshot.jobId === job.id));
        await insertLinks(memory.links.filter((link) => link.jobId === job.id));
      } else if (action === "changed") {
        changed += 1;
        await updateJob(job);
        await insertSnapshots(memory.snapshots.filter((snapshot) => snapshot.jobId === job.id && !knownSnapshots.has(snapshot.id)));
        await db.delete(tables.jobCapabilities).where(eq(tables.jobCapabilities.jobId, job.id));
        await insertLinks(memory.links.filter((link) => link.jobId === job.id));
      } else {
        unchanged += 1;
        await updateJob(job);
      }
    }
    const prior = await db.select().from(tables.ingestionRuns);
    const successfulSets = prior
      .filter((run) => run.source === "microsoft-careers" && run.status === "success" && !run.isDemo)
      .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
      .map((run) => (Array.isArray(run.detailsJson.seenSourceJobIds) ? (run.detailsJson.seenSourceJobIds as string[]) : []));
    const seenIds = fetched.openings.map((opening) => opening.sourceJobId);
    const status = fetched.errors.length === 0 ? "success" : fetched.openings.length > 0 ? "partial" : "failed";
    const closing = status === "success" ? jobsToClose(memory.jobs, [seenIds, ...successfulSets], 2) : [];
    for (const job of closing) {
      job.status = "closed";
      job.closedAt = today;
      await updateJob(job);
    }
    await db.insert(tables.ingestionRuns).values({
      id: runId,
      source: "microsoft-careers",
      startedAt: started,
      completedAt: new Date().toISOString(),
      status,
      recordsSeen: fetched.seen,
      recordsCreated: created,
      recordsChanged: changed,
      recordsUnchanged: unchanged,
      recordsFailed: fetched.errors.length,
      errorSummary: fetched.errors.slice(0, 8).join(" | ") || null,
      isDemo: false,
      detailsJson: { seenSourceJobIds: seenIds, errors: fetched.errors },
    });
    if (fetched.errors.length) {
      console.error(fetched.errors.join("\n"));
    }
    return { status, seen: fetched.seen, created, changed, unchanged, failed: fetched.errors.length, closed: closing.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion failure";
    await db.insert(tables.ingestionRuns).values({
      id: runId,
      source: "microsoft-careers",
      startedAt: started,
      completedAt: new Date().toISOString(),
      status: "failed",
      recordsSeen: 0,
      recordsCreated: 0,
      recordsChanged: 0,
      recordsUnchanged: 0,
      recordsFailed: 1,
      errorSummary: message,
      isDemo: false,
      detailsJson: {},
    });
    throw error;
  }
}

async function loadMicrosoftMemory(): Promise<IngestMemory> {
  const db = getDb();
  if (!db) return emptyMemory();
  const jobRows = await db.select().from(tables.jobs);
  const mine = jobRows.filter((job) => job.source === "microsoft-careers");
  const ids = new Set(mine.map((job) => job.id));
  const snapshotRows = (await db.select().from(tables.jobSnapshots)).filter((row) => ids.has(row.jobId));
  const linkRows = (await db.select().from(tables.jobCapabilities)).filter((row) => ids.has(row.jobId));
  const jobs: Job[] = mine.map((row) => ({
    id: row.id,
    source: row.source,
    sourceJobId: row.sourceJobId,
    title: row.title,
    company: row.company,
    org: row.org,
    team: row.team,
    discipline: row.discipline as Job["discipline"],
    level: row.level,
    locations: row.locationsJson,
    sourceUrl: row.sourceUrl,
    postedAt: row.postedAt.slice(0, 10),
    firstSeenAt: row.firstSeenAt.slice(0, 10),
    lastSeenAt: row.lastSeenAt.slice(0, 10),
    closedAt: row.closedAt ? row.closedAt.slice(0, 10) : null,
    status: row.status as Job["status"],
    archetype: row.archetype,
    isDemo: row.isDemo,
    createdAt: row.createdAt.slice(0, 10),
    updatedAt: row.updatedAt.slice(0, 10),
  }));
  const snapshots: JobSnapshot[] = snapshotRows.map((row) => ({
    id: row.id,
    jobId: row.jobId,
    capturedAt: row.capturedAt.slice(0, 10),
    contentHash: row.contentHash,
    rawHtml: row.rawHtml,
    rawText: row.rawText,
    sourceMetadata: row.sourceMetadataJson,
  }));
  const links: JobCapabilityLink[] = linkRows.map((row) => ({
    id: row.id,
    jobId: row.jobId,
    capabilityId: row.capabilityId,
    weight: row.weight,
    evidenceType: row.evidenceType as JobCapabilityLink["evidenceType"],
    confidence: row.confidence,
    evidenceQuote: row.evidenceQuote,
    sourceSnapshotId: row.sourceSnapshotId,
    createdAt: row.createdAt.slice(0, 10),
  }));
  return { jobs, snapshots, links };
}

async function insertJob(job: Job) {
  const db = getDb();
  if (!db) return;
  await db.insert(tables.jobs).values(jobValues(job));
}

async function updateJob(job: Job) {
  const db = getDb();
  if (!db) return;
  await db.update(tables.jobs).set(jobValues(job)).where(eq(tables.jobs.id, job.id));
}

function jobValues(job: Job) {
  const ts = (day: string) => `${day.slice(0, 10)}T00:00:00.000Z`;
  return {
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
  };
}

async function insertSnapshots(snapshots: JobSnapshot[]) {
  const db = getDb();
  if (!db || snapshots.length === 0) return;
  await db.insert(tables.jobSnapshots).values(
    snapshots.map((snapshot) => ({
      id: snapshot.id,
      jobId: snapshot.jobId,
      capturedAt: `${snapshot.capturedAt.slice(0, 10)}T00:00:00.000Z`,
      contentHash: snapshot.contentHash,
      rawHtml: snapshot.rawHtml,
      rawText: snapshot.rawText,
      sourceMetadataJson: snapshot.sourceMetadata,
    })),
  );
}

async function insertLinks(links: JobCapabilityLink[]) {
  const db = getDb();
  if (!db || links.length === 0) return;
  await db.insert(tables.jobCapabilities).values(
    links.map((link) => ({
      id: link.id,
      jobId: link.jobId,
      capabilityId: link.capabilityId,
      weight: link.weight,
      confidence: link.confidence,
      evidenceType: link.evidenceType,
      evidenceQuote: link.evidenceQuote,
      sourceSnapshotId: link.sourceSnapshotId,
      createdAt: `${link.createdAt.slice(0, 10)}T00:00:00.000Z`,
    })),
  );
}
