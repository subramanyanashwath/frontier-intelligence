import { describe, expect, it } from "vitest";
import { extractCapabilities } from "@/lib/capabilities/extract";

describe("phrase extraction", () => {
  it("separates required and preferred evidence", () => {
    const text = [
      "Required qualifications",
      "- Demonstrated work on evaluation harness.",
      "- Demonstrated work on reinforcement learning.",
      "Preferred qualifications",
      "- Exposure to data flywheel.",
    ].join("\n");
    const links = extractCapabilities(text, "snap", "job", "2026-10-06");
    const evals = links.find((link) => link.capabilityId === "evals");
    const flywheel = links.find((link) => link.capabilityId === "data-flywheels");
    expect(evals?.evidenceType).toBe("required");
    expect(evals?.evidenceQuote.toLowerCase()).toContain("evaluation harness");
    expect(flywheel?.evidenceType).toBe("preferred");
  });
});
