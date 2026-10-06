import { extractCapabilities } from "@/lib/capabilities/extract";
import type { Discipline, Job, JobCapabilityLink, JobSnapshot } from "@/lib/domain";
import { contentHash } from "@/lib/ingestion/hash";

export type RawOpening = {
  source: string;
  sourceJobId: string;
  title: string;
  company: string;
  org: string;
  team: string;
  discipline: Discipline;
  level: string;
  locations: string[];
  sourceUrl: string;
  postedAt: string;
  text: string;
  html: string;
  archetype: string;
  metadata: Record<string, unknown>;
};

export type IngestMemory = {
  jobs: Job[];
  snapshots: JobSnapshot[];
  links: JobCapabilityLink[];
};

export type IngestAction = "created" | "unchanged" | "changed";

export function ingestOpening(memory: IngestMemory, opening: RawOpening, seenAt: string): IngestAction {
  const hash = contentHash(opening.text);
  const existing = memory.jobs.find(
    (job) => job.source === opening.source && job.sourceJobId === opening.sourceJobId,
  );
  if (!existing) {
    const id = `${opening.source}_${opening.sourceJobId}`;
    const snapshotId = `${id}_${hash.slice(0, 12)}`;
    memory.jobs.push({
      id,
      source: opening.source,
      sourceJobId: opening.sourceJobId,
      title: opening.title,
      company: opening.company,
      org: opening.org,
      team: opening.team,
      discipline: opening.discipline,
      level: opening.level,
      locations: opening.locations,
      sourceUrl: opening.sourceUrl,
      postedAt: opening.postedAt,
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
      closedAt: null,
      status: "open",
      archetype: opening.archetype,
      isDemo: false,
      createdAt: seenAt,
      updatedAt: seenAt,
    });
    memory.snapshots.push({
      id: snapshotId,
      jobId: id,
      capturedAt: seenAt,
      contentHash: hash,
      rawHtml: opening.html,
      rawText: opening.text,
      sourceMetadata: opening.metadata,
    });
    memory.links.push(...extractCapabilities(opening.text, snapshotId, id, seenAt));
    return "created";
  }

  const latest = memory.snapshots
    .filter((snapshot) => snapshot.jobId === existing.id)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt))
    .at(-1);
  existing.lastSeenAt = seenAt;
  existing.updatedAt = seenAt;
  if (existing.status === "closed") {
    existing.status = "open";
    existing.closedAt = null;
  }
  if (latest?.contentHash === hash) return "unchanged";

  const snapshotId = `${existing.id}_${hash.slice(0, 12)}`;
  memory.snapshots.push({
    id: snapshotId,
    jobId: existing.id,
    capturedAt: seenAt,
    contentHash: hash,
    rawHtml: opening.html,
    rawText: opening.text,
    sourceMetadata: opening.metadata,
  });
  existing.title = opening.title;
  existing.org = opening.org;
  existing.team = opening.team;
  existing.discipline = opening.discipline;
  existing.level = opening.level;
  existing.locations = opening.locations;
  existing.sourceUrl = opening.sourceUrl;
  for (let i = memory.links.length - 1; i >= 0; i -= 1) {
    if (memory.links[i]?.jobId === existing.id) memory.links.splice(i, 1);
  }
  memory.links.push(...extractCapabilities(opening.text, snapshotId, existing.id, seenAt));
  return "changed";
}

export function jobsToClose(jobs: Job[], successfulSeenSets: string[][], threshold = 2): Job[] {
  if (successfulSeenSets.length < threshold) return [];
  const recent = successfulSeenSets.slice(0, threshold);
  return jobs.filter(
    (job) =>
      job.status === "open" &&
      job.source !== "demo-seed" &&
      recent.every((seen) => !seen.includes(job.sourceJobId)),
  );
}

export function emptyMemory(): IngestMemory {
  return { jobs: [], snapshots: [], links: [] };
}
