import { describe, expect, it } from "vitest";
import { DATA_AS_OF } from "@/lib/dates";
import { familyMomentum, momentumRatio } from "@/lib/analytics/momentum";
import { generateDataset } from "@/lib/seed/generate";

describe("deterministic seed", () => {
  const dataset = generateDataset();

  it("builds at least 100 marked demo jobs across a year", () => {
    expect(dataset.jobs.length).toBeGreaterThanOrEqual(100);
    expect(dataset.jobs.every((job) => job.isDemo && job.source === "demo-seed")).toBe(true);
    expect(dataset.snapshots.length).toBeGreaterThan(dataset.jobs.length);
    expect(dataset.asOf).toBe(DATA_AS_OF);
    const second = generateDataset();
    expect(second.jobs.map((job) => job.id)).toEqual(dataset.jobs.map((job) => job.id));
  });

  it("tells the intended market story", () => {
    const evals = familyMomentum(dataset, DATA_AS_OF, "evaluations", 90);
    const training = familyMomentum(dataset, DATA_AS_OF, "training", 90);
    const flywheel = familyMomentum(dataset, DATA_AS_OF, "training", 90);
    expect(evals.ratio).toBeGreaterThan(0.15);
    expect(training.ratio).toBeGreaterThan(0.1);
    expect(flywheel.current).toBeGreaterThan(0);
    expect(dataset.jobs.some((job) => job.archetype === "copilot" && job.status === "closed")).toBe(true);
    expect(dataset.recommendations.length).toBeGreaterThan(8);
  });

  it("keeps raw text immutable and hashed", () => {
    const snapshot = dataset.snapshots[0];
    expect(snapshot?.rawText.length).toBeGreaterThan(40);
    expect(snapshot?.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("momentum smoothing", () => {
  it("does not explode on a zero prior", () => {
    expect(momentumRatio(3, 0)).toBeCloseTo(3 / 2);
    expect(momentumRatio(0, 0)).toBe(0);
  });
});
