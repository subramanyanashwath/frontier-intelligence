import type { Dataset, EvidenceJob } from "@/lib/domain";
import { CAPABILITY_BY_SLUG } from "@/lib/capabilities/ontology";
import { confidenceFrom } from "@/lib/analytics/confidence";
import { greeksFor } from "@/lib/analytics/greeks";
import { capabilityMomentum } from "@/lib/analytics/momentum";
import { depthAt, latestSnapshotText } from "@/lib/analytics/selectors";

export type AllocationLine = {
  capabilityId: string;
  name: string;
  allocationPct: number;
  hours: number;
  whyNow: string;
  mandateRelevance: string;
  gap: number;
  objective: string;
  action: string;
  evidenceJobs: EvidenceJob[];
  confidence: ReturnType<typeof confidenceFrom>;
  heuristic: string;
  inputs: { label: string; value: string }[];
};

const ACTIONS: Record<string, { objective: string; action: string }> = {
  "statistical-evaluation": {
    objective: "Treat a customer eval as a measurement problem.",
    action: "Implement confidence intervals and failure-distribution analysis in Gnomon.",
  },
  evals: {
    objective: "Make an eval plan a default artifact in deployment reviews.",
    action: "Write a one-page eval plan and apply it to the next agent pilot: task set, failure taxonomy, and pass bar.",
  },
  "agent-evals": {
    objective: "Judge trajectory quality, not demo completion.",
    action: "Score ten real pilot trajectories in Gnomon against an explicit failure taxonomy.",
  },
  "failure-analysis": {
    objective: "Name the failures that change a deployment decision.",
    action: "Publish a failure distribution for the current CAPE pilot and review it with engineering.",
  },
  "agent-orchestration": {
    objective: "Read an orchestration design well enough to shape it.",
    action: "Annotate one customer agent graph: state, handoffs, and the missing eval points.",
  },
  "reinforcement-learning": {
    objective: "Stay literate in how RL environments are being operationalized.",
    action: "Walk one public RL-environment posting end to end and write what CAPE would need to ask.",
  },
  "post-training": {
    objective: "Recognize when a customer issue is actually a post-training issue.",
    action: "Map the last pilot failure to post-training, product, or integration, and record the distinction.",
  },
  "data-flywheels": {
    objective: "Notice when customer usage could become a learning loop.",
    action: "Draft the data-rights and signal questions for one workflow that could feed a flywheel.",
  },
  "customer-workflows": {
    objective: "Keep workflow discovery ahead of solutioning.",
    action: "Rewrite one active account brief so the workflow, not the feature list, is the spine.",
  },
  governance: {
    objective: "Make risk a design input.",
    action: "Add a governance section to the next solution shape: owner, residual risk, and eval evidence required.",
  },
};

const DEFAULT_ACTION = {
  objective: "Deepen the capability that most changes current-mandate judgment.",
  action: "Produce a one-page note tying this capability to a live CAPE decision, with the source postings attached.",
};

export function learningAllocation(dataset: Dataset, asOf: string, hours = 10): AllocationLine[] {
  const greeks = new Map(greeksFor(dataset, asOf).map((row) => [row.capabilityId, row]));
  const scored = dataset.mandateCapabilities
    .map((row) => {
      const depth = depthAt(row, asOf);
      const gap = Math.max(0, row.targetDepth - depth);
      const greek = greeks.get(row.capabilityId);
      const momentum = capabilityMomentum(dataset, asOf, row.capabilityId, 90);
      const momentumPts = clamp(Math.round(Math.max(0, momentum.ratio) * 100));
      const score =
        0.34 * (greek?.delta ?? 0) +
        0.22 * momentumPts +
        0.16 * clamp(gap * 2) +
        0.14 * (greek?.vega ?? 0) +
        0.08 * (greek?.gamma ?? 0) +
        0.06 * (100 - (greek?.theta ?? 30));
      return { row, depth, gap, greek, momentum, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 7);
  const total = top.reduce((sum, item) => sum + item.score, 0) || 1;
  const raw = top.map((item) => ({ ...item, pct: (item.score / total) * 100 }));
  const otherPct = raw.filter((item) => item.pct < 4).reduce((sum, item) => sum + item.pct, 0);
  const kept = raw.filter((item) => item.pct >= 4);
  const keptTotal = kept.reduce((sum, item) => sum + item.pct, 0) || 1;
  const scale = (100 - (otherPct > 0 ? Math.round(otherPct) : 0)) / keptTotal;
  const lines: AllocationLine[] = kept.map((item) => toLine(dataset, asOf, item, Math.max(4, Math.round(item.pct * scale))));

  let drift = 100 - lines.reduce((sum, line) => sum + line.allocationPct, 0) - (otherPct > 0 ? Math.round(otherPct) : 0);
  if (lines[0]) lines[0].allocationPct += drift;
  if (otherPct >= 1) {
    lines.push({
      capabilityId: "other",
      name: "Other",
      allocationPct: Math.round(otherPct),
      hours: round1((Math.round(otherPct) / 100) * hours),
      whyNow: "Residual weight across smaller mandate gaps.",
      mandateRelevance: "Kept visible so the portfolio sums to the full 10 hours.",
      gap: 0,
      objective: "Do not spread this residue across generic courses.",
      action: "Leave it unassigned until the next calibration.",
      evidenceJobs: [],
      confidence: { band: "LOW", score: 0.2, detail: "Bucket of sub-threshold scores." },
      heuristic: "Capabilities under 4% are grouped so the portfolio stays readable.",
      inputs: [{ label: "Grouped share", value: `${Math.round(otherPct)}%` }],
    });
  }
  drift = 100 - lines.reduce((sum, line) => sum + line.allocationPct, 0);
  if (lines[0]) lines[0].allocationPct += drift;
  for (const line of lines) line.hours = round1((line.allocationPct / 100) * hours);
  return lines;
}

function toLine(
  dataset: Dataset,
  asOf: string,
  item: {
    row: Dataset["mandateCapabilities"][number];
    depth: number;
    gap: number;
    momentum: ReturnType<typeof capabilityMomentum>;
    greek: ReturnType<typeof greeksFor>[number] | undefined;
    pct: number;
  },
  allocationPct: number,
): AllocationLine {
  const capability = CAPABILITY_BY_SLUG.get(item.row.capabilityId);
  const action = ACTIONS[item.row.capabilityId] ?? DEFAULT_ACTION;
  const evidenceJobs = item.momentum.jobs.slice(0, 4).map((job) => ({
    id: job.id,
    title: job.title,
    org: job.org,
    team: job.team,
    location: job.locations[0] ?? "",
    discipline: job.discipline,
    date: job.firstSeenAt,
    excerpt: excerpt(latestSnapshotText(dataset, job.id, asOf)),
  }));
  return {
    capabilityId: item.row.capabilityId,
    name: capability?.name ?? item.row.capabilityId,
    allocationPct,
    hours: 0,
    whyNow: whyNow(item.momentum.ratio, item.gap, item.row.importance),
    mandateRelevance: item.row.rationale,
    gap: item.gap,
    objective: action.objective,
    action: action.action,
    evidenceJobs,
    confidence: confidenceFrom({
      jobs: item.momentum.current + item.momentum.prior,
      functions: item.momentum.functions,
      locations: item.momentum.locations,
      persistence: item.momentum.current > 0 ? 0.7 : 0.3,
    }),
    heuristic:
      "Equal-looking percents are a normalized portfolio, not a measurement. Score = 0.34 Delta + 0.22 positive 90d momentum + 0.16 gap + 0.14 Vega + 0.08 Gamma + 0.06 (100 − Theta). Weights are configurable placeholders.",
    inputs: [
      { label: "Delta", value: String(item.greek?.delta ?? 0) },
      { label: "90d momentum", value: `${item.momentum.current} vs ${item.momentum.prior}` },
      { label: "Gap", value: String(item.gap) },
      { label: "Vega", value: String(item.greek?.vega ?? 0) },
      { label: "Gamma", value: String(item.greek?.gamma ?? 0) },
      { label: "Theta", value: String(item.greek?.theta ?? 0) },
      { label: "Importance", value: String(item.row.importance) },
      { label: "Depth", value: String(item.depth) },
    ],
  };
}

function whyNow(ratio: number, gap: number, importance: number): string {
  if (ratio > 0.2 && gap >= 12) {
    return `Market postings are up and the mandate gap is still ${gap} points. Importance is ${importance}.`;
  }
  if (gap >= 15) return `The current mandate gap is ${gap} points, large enough to change deployment judgment.`;
  if (ratio > 0.15) return "Posting frequency rose across the last two 90-day windows.";
  return "Included because it still moves execution of the current mandate.";
}

function excerpt(text: string): string {
  const line = text.split("\n").find((part) => part.startsWith("- Demonstrated") || part.startsWith("- Exposure"));
  return (line ?? text).replace(/\s+/g, " ").trim().slice(0, 220);
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
