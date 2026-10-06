import { describe, expect, it } from "vitest";
import { learningAllocation } from "@/lib/analytics/allocation";
import { deltaScore, gammaScore, greeksFor } from "@/lib/analytics/greeks";
import { DATA_AS_OF, addDays } from "@/lib/dates";
import { generateDataset } from "@/lib/seed/generate";
import { jobsVisible } from "@/lib/analytics/selectors";
import { buildPulse, buildTape } from "@/lib/view/operator";

const dataset = generateDataset();

describe("greeks", () => {
  it("keeps scores inside 0-100 and favors mandate gaps", () => {
    expect(deltaScore(80, 50, 80)).toBeGreaterThan(deltaScore(10, 50, 60));
    expect(gammaScore(4)).toBeGreaterThan(gammaScore(1));
    expect(gammaScore(4)).toBeLessThanOrEqual(100);
    const rows = greeksFor(dataset, DATA_AS_OF);
    expect(rows.every((row) => [row.delta, row.gamma, row.theta, row.vega, row.impliedVol].every((n) => n >= 0 && n <= 100))).toBe(true);
    const stats = rows.find((row) => row.capabilityId === "statistical-evaluation");
    const hpc = rows.find((row) => row.capabilityId === "hpc");
    expect(stats && hpc && stats.delta > hpc.delta).toBe(true);
  });
});

describe("allocation", () => {
  it("sums to 100 and puts weight on measurement", () => {
    const lines = learningAllocation(dataset, DATA_AS_OF);
    expect(lines.reduce((sum, line) => sum + line.allocationPct, 0)).toBe(100);
    const top = lines[0];
    expect(top && ["evals", "statistical-evaluation", "agent-evals", "failure-analysis"].includes(top.capabilityId)).toBe(true);
    expect(lines.some((line) => line.action.toLowerCase().includes("gnomon") || line.action.toLowerCase().includes("eval"))).toBe(true);
  });
});

describe("time machine and operator boundary", () => {
  it("hides postings that had not been seen yet", () => {
    const early = addDays(DATA_AS_OF, -300);
    const visible = jobsVisible(dataset, early);
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.length).toBeLessThan(dataset.jobs.length);
    expect(visible.every((job) => job.firstSeenAt <= early)).toBe(true);
  });

  it("does not put private recommendation fields on operator views", () => {
    const pulse = buildPulse(dataset, DATA_AS_OF);
    const tape = buildTape(dataset, DATA_AS_OF, 90, {
      org: "",
      discipline: "",
      location: "",
      capability: "",
      level: "",
      eventType: "",
      from: "",
      to: "",
    });
    const blob = JSON.stringify({ pulse, tape });
    expect(blob).not.toContain("RECOMMENDED_TO_ME");
    expect(blob).not.toContain("Recommended role:");
    expect(blob).not.toContain("fitNow");
    expect(blob).not.toContain("careerAlpha");
    expect(pulse.regime.headline.length).toBeGreaterThan(8);
  });
});
