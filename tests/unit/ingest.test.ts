import { describe, expect, it } from "vitest";
import { contentHash } from "@/lib/ingestion/hash";
import { emptyMemory, ingestOpening, jobsToClose, type RawOpening } from "@/lib/ingestion/pipeline";

const opening: RawOpening = {
  source: "microsoft-careers",
  sourceJobId: "123",
  title: "Software Engineer, Evaluation Systems",
  company: "Microsoft",
  org: "Microsoft AI",
  team: "Agent Quality",
  discipline: "Engineering",
  level: "62",
  locations: ["Redmond"],
  sourceUrl: "https://apply.careers.microsoft.com/careers/job/123",
  postedAt: "2026-09-01",
  text: "Required qualifications\n- Demonstrated work on evaluation harness.\n- Demonstrated work on agent evaluation.",
  html: "<p>evaluation harness</p>",
  archetype: "live",
  metadata: { isDemo: false },
};

describe("idempotent ingestion", () => {
  it("skips extraction when the content hash is unchanged", () => {
    const memory = emptyMemory();
    expect(ingestOpening(memory, opening, "2026-09-02")).toBe("created");
    const links = memory.links.length;
    const snapshots = memory.snapshots.length;
    expect(ingestOpening(memory, opening, "2026-09-09")).toBe("unchanged");
    expect(memory.jobs).toHaveLength(1);
    expect(memory.snapshots).toHaveLength(snapshots);
    expect(memory.links).toHaveLength(links);
    expect(memory.jobs[0]?.lastSeenAt).toBe("2026-09-09");
  });

  it("stores a new snapshot when the text changes and does not rewrite the old one", () => {
    const memory = emptyMemory();
    ingestOpening(memory, opening, "2026-09-02");
    const original = memory.snapshots[0]?.rawText;
    const changed = { ...opening, text: `${opening.text}\n- Demonstrated work on failure analysis.` };
    expect(contentHash(changed.text)).not.toBe(contentHash(opening.text));
    expect(ingestOpening(memory, changed, "2026-09-20")).toBe("changed");
    expect(memory.snapshots).toHaveLength(2);
    expect(memory.snapshots[0]?.rawText).toBe(original);
    expect(memory.links.some((link) => link.capabilityId === "failure-analysis")).toBe(true);
  });
});

describe("closure", () => {
  it("waits for two successful sweeps", () => {
    const memory = emptyMemory();
    ingestOpening(memory, opening, "2026-09-02");
    expect(jobsToClose(memory.jobs, [["999"]], 2)).toHaveLength(0);
    expect(jobsToClose(memory.jobs, [["999"]], 2)).toHaveLength(0);
    const closed = jobsToClose(memory.jobs, [["999"], ["888"]], 2);
    expect(closed.map((job) => job.id)).toEqual(memory.jobs.map((job) => job.id));
    expect(jobsToClose(memory.jobs, [["123"], ["888"]], 2)).toHaveLength(0);
  });
});
