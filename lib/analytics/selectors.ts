import { addDays } from "@/lib/dates";
import type { Dataset, Job, JobCapabilityLink } from "@/lib/domain";

export function jobsVisible(dataset: Dataset, asOf: string): Job[] {
  return dataset.jobs.filter((job) => job.firstSeenAt <= asOf);
}

export function newPostings(jobs: Job[], start: string, end: string): Job[] {
  return jobs.filter((job) => job.firstSeenAt >= start && job.firstSeenAt <= end);
}

export function activeJobs(jobs: Job[], start: string, end: string): Job[] {
  return jobs.filter((job) => job.firstSeenAt <= end && (job.closedAt === null || job.closedAt >= start));
}

export function linksByJob(dataset: Dataset): Map<string, JobCapabilityLink[]> {
  const map = new Map<string, JobCapabilityLink[]>();
  for (const link of dataset.links) {
    const list = map.get(link.jobId);
    if (list) list.push(link);
    else map.set(link.jobId, [link]);
  }
  return map;
}

export function jobsWithCapability(
  jobs: Job[],
  links: Map<string, JobCapabilityLink[]>,
  capabilityId: string,
  minimumWeight = 0.4,
): Job[] {
  return jobs.filter((job) =>
    (links.get(job.id) ?? []).some(
      (link) => link.capabilityId === capabilityId && link.weight >= minimumWeight,
    ),
  );
}

export function latestSnapshotText(dataset: Dataset, jobId: string, asOf: string): string {
  const snaps = dataset.snapshots
    .filter((snapshot) => snapshot.jobId === jobId && snapshot.capturedAt <= asOf)
    .sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  return snaps[snaps.length - 1]?.rawText ?? "";
}

export function priorWindow(asOf: string, days: number): { currentStart: string; currentEnd: string; priorStart: string; priorEnd: string } {
  return {
    currentStart: addDays(asOf, -(days - 1)),
    currentEnd: asOf,
    priorStart: addDays(asOf, -(days * 2 - 1)),
    priorEnd: addDays(asOf, -days),
  };
}

export function depthAt(row: { history: { date: string; depth: number }[]; currentDepth: number }, asOf: string): number {
  const points = row.history.filter((point) => point.date <= asOf).sort((a, b) => a.date.localeCompare(b.date));
  return points[points.length - 1]?.depth ?? row.currentDepth;
}
