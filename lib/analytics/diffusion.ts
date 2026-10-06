import type { Dataset, Job } from "@/lib/domain";
import { jobsVisible, jobsWithCapability, linksByJob, newPostings, priorWindow } from "@/lib/analytics/selectors";

export type Diffusion = {
  functions: string[];
  locations: string[];
  levels: string[];
  functionCount: number;
  locationCount: number;
  levelSpread: number;
  novelty: number;
};

const LEVEL_BANDS = [
  { name: "59-60", test: (level: string) => Number(level) <= 60 },
  { name: "61-62", test: (level: string) => Number(level) >= 61 && Number(level) <= 62 },
  { name: "63-64", test: (level: string) => Number(level) >= 63 && Number(level) <= 64 },
  { name: "65+", test: (level: string) => Number(level) >= 65 },
];

export function levelBand(level: string): string {
  return LEVEL_BANDS.find((band) => band.test(level))?.name ?? level;
}

export function diffusionFor(dataset: Dataset, asOf: string, capabilityId: string, days = 90): Diffusion {
  const links = linksByJob(dataset);
  const window = priorWindow(asOf, days);
  const visible = jobsVisible(dataset, asOf);
  const current = jobsWithCapability(newPostings(visible, window.currentStart, window.currentEnd), links, capabilityId);
  const history = jobsWithCapability(
    visible.filter((job) => job.firstSeenAt < window.currentStart),
    links,
    capabilityId,
  );
  const functions = unique(current.map((job) => job.discipline));
  const locations = unique(current.flatMap((job) => job.locations));
  const levels = unique(current.map((job) => levelBand(job.level)));
  const historicalPairs = new Set(history.map((job) => `${capabilityId}:${job.discipline}`));
  const novelPairs = current.filter((job) => !historicalPairs.has(`${capabilityId}:${job.discipline}`));
  return {
    functions,
    locations,
    levels,
    functionCount: functions.length,
    locationCount: locations.length,
    levelSpread: levels.length / LEVEL_BANDS.length,
    novelty: current.length === 0 ? 0 : novelPairs.length / current.length,
  };
}

export function skewSummary(jobs: Job[]): { level: string; discipline: string; location: string } {
  return {
    level: mode(jobs.map((job) => levelBand(job.level))),
    discipline: mode(jobs.map((job) => job.discipline)),
    location: mode(jobs.flatMap((job) => job.locations)),
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function mode(values: string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "—";
}
