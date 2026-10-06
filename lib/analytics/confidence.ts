import type { Confidence, ConfidenceBand, Job } from "@/lib/domain";

export function confidenceFrom(input: {
  jobs: number;
  functions: number;
  locations: number;
  persistence: number;
}): Confidence {
  let score = 0;
  if (input.jobs >= 12) score += 0.42;
  else if (input.jobs >= 6) score += 0.28;
  else if (input.jobs >= 3) score += 0.14;
  if (input.functions >= 4) score += 0.24;
  else if (input.functions >= 2) score += 0.14;
  if (input.locations >= 3) score += 0.18;
  else if (input.locations >= 2) score += 0.1;
  score += 0.16 * clamp01(input.persistence);
  const band: ConfidenceBand = score >= 0.7 ? "HIGH" : score >= 0.4 ? "MEDIUM" : "LOW";
  const detail = `${input.jobs} postings across ${input.functions} function${input.functions === 1 ? "" : "s"} and ${input.locations} location${input.locations === 1 ? "" : "s"}.`;
  return { band, score: round2(score), detail };
}

export function distinctCount(jobs: Job[], read: (job: Job) => string): number {
  return new Set(jobs.map(read)).size;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
