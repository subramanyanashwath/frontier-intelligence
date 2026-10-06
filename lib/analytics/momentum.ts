import { CAPABILITY_BY_SLUG, childrenOf } from "@/lib/capabilities/ontology";
import { addDays } from "@/lib/dates";
import type { Dataset, Job } from "@/lib/domain";
import { confidenceFrom, distinctCount } from "@/lib/analytics/confidence";
import {
  jobsVisible,
  jobsWithCapability,
  linksByJob,
  newPostings,
  priorWindow,
} from "@/lib/analytics/selectors";

export const SMOOTHING = 2;

export function momentumRatio(current: number, prior: number): number {
  return (current - prior) / (prior + SMOOTHING);
}

export type MomentumRow = {
  capabilityId: string;
  name: string;
  category: string;
  current: number;
  prior: number;
  ratio: number;
  days: number;
  windows: { d7: number; d30: number; d90: number };
  counts: { d7: [number, number]; d30: [number, number]; d90: [number, number] };
  persistence: number;
  confidence: ReturnType<typeof confidenceFrom>;
  jobs: Job[];
};

export function capabilityMomentum(dataset: Dataset, asOf: string, capabilityId: string, days: number) {
  const visible = jobsVisible(dataset, asOf);
  const links = linksByJob(dataset);
  const window = priorWindow(asOf, days);
  const currentJobs = jobsWithCapability(newPostings(visible, window.currentStart, window.currentEnd), links, capabilityId);
  const priorJobs = jobsWithCapability(newPostings(visible, window.priorStart, window.priorEnd), links, capabilityId);
  return {
    current: currentJobs.length,
    prior: priorJobs.length,
    ratio: momentumRatio(currentJobs.length, priorJobs.length),
    jobs: currentJobs,
    locations: distinctCount(currentJobs, (job) => job.locations[0] ?? "Unknown"),
    functions: distinctCount(currentJobs, (job) => job.discipline),
  };
}

export function persistenceScore(dataset: Dataset, asOf: string, capabilityId: string): number {
  const hits = [0, 1, 2, 3].filter((step) => {
    const end = addDays(asOf, -step * 30);
    const start = addDays(end, -29);
    return capabilityMomentum(dataset, end, capabilityId, 30).current > 0 || newPostingCount(dataset, capabilityId, start, end) > 0;
  });
  return hits.length / 4;
}

function newPostingCount(dataset: Dataset, capabilityId: string, start: string, end: string): number {
  const links = linksByJob(dataset);
  return jobsWithCapability(newPostings(jobsVisible(dataset, end), start, end), links, capabilityId).length;
}

export function momentumTable(dataset: Dataset, asOf: string): MomentumRow[] {
  const leaves = dataset.capabilities.filter((capability) => capability.parentId);
  return leaves
    .map((capability) => {
      const d7 = capabilityMomentum(dataset, asOf, capability.slug, 7);
      const d30 = capabilityMomentum(dataset, asOf, capability.slug, 30);
      const d90 = capabilityMomentum(dataset, asOf, capability.slug, 90);
      const persistence = persistenceScore(dataset, asOf, capability.slug);
      return {
        capabilityId: capability.slug,
        name: capability.name,
        category: capability.category,
        current: d90.current,
        prior: d90.prior,
        ratio: d90.ratio,
        days: 90,
        windows: { d7: d7.ratio, d30: d30.ratio, d90: d90.ratio },
        counts: {
          d7: [d7.current, d7.prior] as [number, number],
          d30: [d30.current, d30.prior] as [number, number],
          d90: [d90.current, d90.prior] as [number, number],
        },
        persistence,
        confidence: confidenceFrom({
          jobs: d90.current + d90.prior,
          functions: d90.functions,
          locations: d90.locations,
          persistence,
        }),
        jobs: d90.jobs,
      };
    })
    .filter((row) => row.counts.d90[0] + row.counts.d90[1] + row.counts.d30[0] + row.counts.d30[1] > 0)
    .sort((a, b) => b.windows.d90 - a.windows.d90 || b.current - a.current);
}

export function familyMomentum(dataset: Dataset, asOf: string, familyId: string, days: number) {
  const members = [familyId, ...childrenOf(familyId).map((child) => child.slug)];
  const visible = jobsVisible(dataset, asOf);
  const links = linksByJob(dataset);
  const window = priorWindow(asOf, days);
  const match = (jobs: Job[]) =>
    jobs.filter((job) =>
      (links.get(job.id) ?? []).some((link) => members.includes(link.capabilityId) && link.weight >= 0.4),
    );
  const currentJobs = match(newPostings(visible, window.currentStart, window.currentEnd));
  const priorJobs = match(newPostings(visible, window.priorStart, window.priorEnd));
  return {
    name: CAPABILITY_BY_SLUG.get(familyId)?.name ?? familyId,
    current: currentJobs.length,
    prior: priorJobs.length,
    ratio: momentumRatio(currentJobs.length, priorJobs.length),
    jobs: currentJobs,
  };
}
