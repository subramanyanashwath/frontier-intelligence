import { learningAllocation, type AllocationLine } from "@/lib/analytics/allocation";
import { confidenceFrom } from "@/lib/analytics/confidence";
import { diffusionFor, skewSummary } from "@/lib/analytics/diffusion";
import { operatorEvents, type TapeEvent } from "@/lib/analytics/events";
import { greeksFor } from "@/lib/analytics/greeks";
import { momentumTable, type MomentumRow } from "@/lib/analytics/momentum";
import { marketRegime } from "@/lib/analytics/regime";
import { depthAt, jobsVisible, latestSnapshotText, linksByJob } from "@/lib/analytics/selectors";
import { HORIZONS, marketSurface, mandateSurface, SURFACE_CAPABILITIES, type SurfaceCell } from "@/lib/analytics/surface";
import { addDays, DATA_AS_OF } from "@/lib/dates";
import { CAPABILITY_BY_SLUG } from "@/lib/capabilities/ontology";
import type { Confidence, Dataset, EvidenceJob, EvidenceModel, Job } from "@/lib/domain";
import { formatRatio } from "@/lib/format";

const PRIVATE_KEYS = ["subject", "fitNow", "fit6m", "fit12m", "careerAlpha", "salary", "recommendationSubject"];

export type ShellMeta = {
  product: "Frontier Operator";
  mode: "OPERATOR" | "PRIVATE";
  asOf: string;
  dataDate: string;
  provenance: "DEMO SEED" | "LIVE" | "MIXED";
  sweepLabel: string;
  sweepDetail: string;
  confidence: Confidence;
};

export function shellMeta(dataset: Dataset): ShellMeta {
  const latest = [...dataset.ingestionRuns].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
  const live = dataset.ingestionRuns.filter((run) => !run.isDemo);
  const provenance = dataset.isDemo ? "DEMO SEED" : live.length ? "LIVE" : "MIXED";
  const sweepLabel = !latest
    ? "NO SWEEP"
    : latest.isDemo
      ? "DEMO SEED"
      : latest.status === "success"
        ? "SUCCESS"
        : latest.status === "partial"
          ? "PARTIAL"
          : latest.status === "failed"
            ? "FAILED"
            : "RUNNING";
  return {
    product: "Frontier Operator",
    mode: "OPERATOR",
    asOf: dataset.asOf,
    dataDate: dataset.asOf || DATA_AS_OF,
    provenance,
    sweepLabel: `LAST SWEEP: ${sweepLabel}`,
    sweepDetail: latest?.errorSummary || (latest?.isDemo ? "Synthetic history. Not a live Microsoft sweep." : latest?.source ?? ""),
    confidence: confidenceFrom({ jobs: dataset.jobs.length, functions: 4, locations: 4, persistence: 0.8 }),
  };
}

export type PulseView = {
  regime: ReturnType<typeof marketRegime>;
  movers: Array<MomentumRow & { evidenceId: string }>;
  signals: TapeEvent[];
  gaps: Array<{ capabilityId: string; name: string; importance: number; depth: number; gap: number; momentum: string; evidenceId: string }>;
  allocationShift: Array<{ name: string; previous: number; next: number }>;
  evidence: EvidenceModel[];
  copilotClosures: number;
};

export function buildPulse(dataset: Dataset, asOf: string): PulseView {
  const regime = marketRegime(dataset, asOf);
  const table = momentumTable(dataset, asOf);
  const interesting = [...table].sort((a, b) => Math.abs(b.windows.d90) - Math.abs(a.windows.d90)).slice(0, 8);
  const evidence: EvidenceModel[] = [];
  const movers = interesting.map((row) => {
    const evidenceId = `mover_${row.capabilityId}`;
    evidence.push(moverEvidence(dataset, asOf, row, evidenceId));
    return { ...row, evidenceId };
  });
  const signals = operatorEvents(dataset, asOf)
    .filter((event) => event.occurredAt >= addDays(asOf, -21))
    .filter((event) => event.eventType !== "NEW_JOB" || event.occurredAt >= addDays(asOf, -14))
    .slice(0, 10);
  const gaps = dataset.mandateCapabilities
    .map((row) => {
      const depth = depthAt(row, asOf);
      const gap = row.targetDepth - depth;
      const momentum = table.find((item) => item.capabilityId === row.capabilityId);
      return {
        capabilityId: row.capabilityId,
        name: CAPABILITY_BY_SLUG.get(row.capabilityId)?.name ?? row.capabilityId,
        importance: row.importance,
        depth,
        gap,
        momentum: momentum ? formatRatio(momentum.windows.d90) : "n/a",
        evidenceId: `gap_${row.capabilityId}`,
      };
    })
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 5);
  for (const gap of gaps) {
    const row = table.find((item) => item.capabilityId === gap.capabilityId);
    if (row) evidence.push(moverEvidence(dataset, asOf, row, gap.evidenceId));
  }
  const nowAlloc = learningAllocation(dataset, asOf);
  const thenAlloc = learningAllocation(dataset, addDays(asOf, -30));
  const allocationShift = nowAlloc
    .filter((line) => line.capabilityId !== "other")
    .slice(0, 5)
    .map((line) => ({
      name: line.name,
      previous: thenAlloc.find((item) => item.capabilityId === line.capabilityId)?.allocationPct ?? 0,
      next: line.allocationPct,
    }));
  const copilotClosures = jobsVisible(dataset, asOf).filter(
    (job) => job.archetype === "copilot" && job.closedAt && job.closedAt <= asOf && job.closedAt >= addDays(asOf, -120),
  ).length;
  return { regime, movers, signals, gaps, allocationShift, evidence, copilotClosures };
}

function moverEvidence(dataset: Dataset, asOf: string, row: MomentumRow, id: string): EvidenceModel {
  return {
    id,
    title: row.name,
    value: `${formatRatio(row.windows.d90)} · 90d`,
    confidence: row.confidence,
    heuristic:
      "Momentum = (postings in window − postings in prior window) / (prior + 2). The +2 term is smoothing for small samples. Percentages are rounded. They are not a precision claim.",
    inputs: [
      { label: "7d", value: `${formatRatio(row.windows.d7)} (${row.counts.d7[0]} vs ${row.counts.d7[1]})` },
      { label: "30d", value: `${formatRatio(row.windows.d30)} (${row.counts.d30[0]} vs ${row.counts.d30[1]})` },
      { label: "90d", value: `${formatRatio(row.windows.d90)} (${row.counts.d90[0]} vs ${row.counts.d90[1]})` },
      { label: "Persistence", value: row.persistence.toFixed(2) },
    ],
    jobs: row.jobs.slice(0, 8).map((job) => jobEvidence(dataset, job, asOf)),
  };
}

export function jobEvidence(dataset: Dataset, job: Job, asOf: string): EvidenceJob {
  const text = latestSnapshotText(dataset, job.id, asOf);
  const quote = dataset.links.find((link) => link.jobId === job.id)?.evidenceQuote;
  return {
    id: job.id,
    title: job.title,
    org: job.org,
    team: job.team,
    location: job.locations[0] ?? "",
    discipline: job.discipline,
    date: job.firstSeenAt,
    excerpt: quote || text.replace(/\s+/g, " ").trim().slice(0, 220),
  };
}

export type TapeFilters = {
  org: string;
  discipline: string;
  location: string;
  capability: string;
  level: string;
  eventType: string;
  from: string;
  to: string;
};

export function buildTape(dataset: Dataset, asOf: string, days: number, filters: TapeFilters) {
  const start = filters.from || addDays(asOf, -(days - 1));
  const end = filters.to && filters.to < asOf ? filters.to : asOf;
  let events = operatorEvents(dataset, asOf).filter((event) => event.occurredAt >= start && event.occurredAt <= end);
  if (filters.org) events = events.filter((event) => event.org === filters.org);
  if (filters.discipline) events = events.filter((event) => event.discipline === filters.discipline);
  if (filters.location) events = events.filter((event) => event.location === filters.location);
  if (filters.level) events = events.filter((event) => event.level === filters.level);
  if (filters.eventType) events = events.filter((event) => event.eventType === filters.eventType);
  if (filters.capability) events = events.filter((event) => event.capabilityId === filters.capability || event.title.toLowerCase().includes(filters.capability.toLowerCase()));
  const orgs = [...new Set(operatorEvents(dataset, asOf).map((event) => event.org))].filter(Boolean).sort();
  return { events: events.slice(0, 180), total: events.length, orgs, start, end };
}

export function buildSurface(dataset: Dataset, asOf: string, view: "market" | "mandate") {
  const cells = view === "mandate" ? mandateSurface(dataset, asOf) : marketSurface(dataset, asOf);
  return {
    view,
    capabilities: SURFACE_CAPABILITIES.map((slug) => ({
      slug,
      name: CAPABILITY_BY_SLUG.get(slug)?.name ?? slug,
    })),
    horizons: HORIZONS.map((horizon) => ({ id: horizon.id, label: horizon.label })),
    cells,
    z: matrix(cells),
  };
}

function matrix(cells: SurfaceCell[]): number[][] {
  return HORIZONS.map((horizon) =>
    SURFACE_CAPABILITIES.map((slug) => cells.find((cell) => cell.capabilityId === slug && cell.horizon === horizon.id)?.intensity ?? 0),
  );
}

export function buildXray(dataset: Dataset, jobId: string, asOf: string) {
  const job = jobsVisible(dataset, asOf).find((item) => item.id === jobId);
  if (!job) return null;
  const links = (linksByJob(dataset).get(job.id) ?? []).slice().sort((a, b) => b.weight - a.weight);
  const text = latestSnapshotText(dataset, job.id, asOf);
  const snapshots = dataset.snapshots.filter((snapshot) => snapshot.jobId === job.id && snapshot.capturedAt <= asOf);
  const diffusion = diffusionFor(dataset, asOf, links[0]?.capabilityId ?? "evals", 90);
  const skew = skewSummary(jobsVisible(dataset, asOf).filter((item) => item.archetype === job.archetype));
  return {
    job,
    text,
    snapshots: snapshots.length,
    firstSeen: job.firstSeenAt,
    lastSeen: job.lastSeenAt <= asOf ? job.lastSeenAt : asOf,
    fingerprint: links.map((link) => ({
      slug: link.capabilityId,
      name: CAPABILITY_BY_SLUG.get(link.capabilityId)?.name ?? link.capabilityId,
      weight: link.weight,
      evidenceType: link.evidenceType,
      confidence: link.confidence,
      quote: link.evidenceQuote,
    })),
    required: links.filter((link) => link.evidenceType === "required"),
    preferred: links.filter((link) => link.evidenceType === "preferred"),
    inferred: links.filter((link) => link.evidenceType === "inferred"),
    signal: organizationalSignal(links.map((link) => link.capabilityId), job.discipline, job.archetype),
    skew,
    diffusion,
    demo: job.isDemo,
  };
}

export function organizationalSignal(slugs: string[], discipline: string, archetype: string): string {
  const has = (slug: string) => slugs.includes(slug);
  if (has("reinforcement-learning") && has("post-training")) {
    return "This role suggests reinforcement learning is being operationalized alongside post-training infrastructure rather than remaining isolated in research.";
  }
  if ((has("evals") || has("agent-evals")) && ["TPM", "FDE", "PM"].includes(discipline)) {
    return "Evaluation language is sitting inside a delivery function. That is diffusion: measurement is becoming part of how the work ships.";
  }
  if (has("data-flywheels") || has("synthetic-data")) {
    return "The posting treats usage and synthetic data as a loop, not a one-time dataset. That is the flywheel pattern showing up in the text.";
  }
  if (archetype === "copilot") {
    return "The language is still generic copilot surface area. Compare it with later agent-platform postings, which talk about orchestration rather than a feature shell.";
  }
  if (has("forward-deployed-engineering") && has("agent-evals")) {
    return "Field deployment and agent evaluation are in the same description. The customer workflow is being tied to a measurement problem.";
  }
  const names = slugs
    .slice(0, 3)
    .map((slug) => CAPABILITY_BY_SLUG.get(slug)?.name ?? slug)
    .join(", ");
  return `The strongest explicit signals are ${names || "unspecified"}, inside ${discipline}. Weights come from phrase hits in the source text.`;
}

export function buildMandate(dataset: Dataset, asOf: string) {
  const greeks = new Map(greeksFor(dataset, asOf).map((row) => [row.capabilityId, row]));
  const momentum = new Map(momentumTable(dataset, asOf).map((row) => [row.capabilityId, row]));
  const mandate = dataset.mandates[0];
  const rows = dataset.mandateCapabilities
    .map((row) => {
      const depth = depthAt(row, asOf);
      const greek = greeks.get(row.capabilityId);
      const move = momentum.get(row.capabilityId);
      const gap = row.targetDepth - depth;
      const priority = greek?.delta ?? 0;
      return {
        capabilityId: row.capabilityId,
        name: CAPABILITY_BY_SLUG.get(row.capabilityId)?.name ?? row.capabilityId,
        importance: row.importance,
        depth,
        target: row.targetDepth,
        gap,
        momentum: move ? formatRatio(move.windows.d90) : "n/a",
        priority,
        confidence: row.confidence,
        rationale: row.rationale,
        greek,
      };
    })
    .sort((a, b) => b.priority - a.priority || b.gap - a.gap);
  return { mandate, rows };
}

export function buildAllocate(dataset: Dataset, asOf: string): { lines: AllocationLine[]; evidence: EvidenceModel[] } {
  const lines = learningAllocation(dataset, asOf);
  const evidence = lines.map((line) => ({
    id: `alloc_${line.capabilityId}`,
    title: line.name,
    value: `${line.allocationPct}% · ${line.hours}h`,
    confidence: line.confidence,
    heuristic: line.heuristic,
    inputs: line.inputs,
    jobs: line.evidenceJobs,
  }));
  return { lines, evidence };
}

export function assertOperatorSafe(value: unknown): void {
  const json = JSON.stringify(value);
  for (const key of PRIVATE_KEYS) {
    if (json.includes(`"${key}"`)) {
      throw new Error(`Operator payload contains private key ${key}`);
    }
  }
}

export function xrayIndex(dataset: Dataset, asOf: string) {
  return jobsVisible(dataset, asOf)
    .slice()
    .sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt))
    .slice(0, 40);
}
