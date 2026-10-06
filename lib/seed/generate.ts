import { extractCapabilities } from "@/lib/capabilities/extract";
import { ONTOLOGY } from "@/lib/capabilities/ontology";
import { DATA_AS_OF, addDays, monthAnchor } from "@/lib/dates";
import type {
  Dataset,
  Discipline,
  IngestionRun,
  Job,
  JobSnapshot,
  MandateCapability,
  Recommendation,
} from "@/lib/domain";
import { contentHash } from "@/lib/ingestion/hash";

type Archetype = {
  key: string;
  titles: string[];
  org: string;
  team: string;
  discipline: Discipline;
  diffusion: Discipline[];
  levels: string[];
  locations: string[];
  expandLocationsAt: number;
  extraLocations: string[];
  monthly: number[];
  closeAfterDays: number | null;
  capabilities: string[];
  focus: string;
};

const ARCHETYPES: Archetype[] = [
  {
    key: "eval-research",
    titles: ["Researcher, Model Evaluation", "Senior Researcher, Evaluation Science"],
    org: "Microsoft Research",
    team: "Evaluation Science",
    discipline: "Research",
    diffusion: ["Research", "Research", "Data Science"],
    levels: ["63", "64", "65"],
    locations: ["Redmond"],
    expandLocationsAt: 6,
    extraLocations: ["New York", "Zurich"],
    monthly: [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    closeAfterDays: null,
    capabilities: ["evals", "model-evals", "statistical-evaluation", "failure-analysis", "model-behavior"],
    focus: "measurement of model quality after post-training",
  },
  {
    key: "eval-eng",
    titles: ["Senior Software Engineer, Evaluation Systems", "Software Engineer, Agent Evaluations"],
    org: "Microsoft AI",
    team: "Agent Quality",
    discipline: "Engineering",
    diffusion: ["Engineering", "Engineering", "TPM", "FDE"],
    levels: ["61", "62", "63"],
    locations: ["Redmond"],
    expandLocationsAt: 5,
    extraLocations: ["New York", "London", "Mountain View"],
    monthly: [0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3],
    closeAfterDays: null,
    capabilities: ["evals", "agent-evals", "failure-analysis", "reliability", "observability"],
    focus: "evaluation harnesses for agent trajectories and tool use",
  },
  {
    key: "rl",
    titles: ["Researcher, Reinforcement Learning", "Senior Applied Scientist, RL Environments"],
    org: "Microsoft AI",
    team: "RL Environments",
    discipline: "Research",
    diffusion: ["Research", "Research", "Engineering"],
    levels: ["63", "64", "65"],
    locations: ["Redmond", "Mountain View"],
    expandLocationsAt: 7,
    extraLocations: ["Zurich", "New York"],
    monthly: [0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3],
    closeAfterDays: null,
    capabilities: ["reinforcement-learning", "post-training", "reward-modeling", "evals"],
    focus: "reinforcement learning environments tied to the post-training pipeline",
  },
  {
    key: "post-training",
    titles: ["Senior Applied Scientist, Post-Training", "Software Engineer, Post-Training Infrastructure"],
    org: "Microsoft AI",
    team: "Post-Training",
    discipline: "Engineering",
    diffusion: ["Research", "Engineering", "Engineering", "TPM"],
    levels: ["62", "63", "64"],
    locations: ["Redmond"],
    expandLocationsAt: 6,
    extraLocations: ["Mountain View", "Zurich"],
    monthly: [0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3],
    closeAfterDays: null,
    capabilities: ["post-training", "preference-optimization", "reward-modeling", "data-infrastructure"],
    focus: "operational post-training pipelines rather than isolated research prototypes",
  },
  {
    key: "flywheel",
    titles: ["Data Scientist, Data Flywheel", "Senior Data Scientist, Synthetic Data"],
    org: "Microsoft AI",
    team: "Data Flywheel",
    discipline: "Data Science",
    diffusion: ["Data Science", "Research", "Engineering", "FDE"],
    levels: ["62", "63", "64"],
    locations: ["Redmond"],
    expandLocationsAt: 8,
    extraLocations: ["New York", "London"],
    monthly: [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2],
    closeAfterDays: null,
    capabilities: ["data-flywheels", "synthetic-data", "feedback-data", "statistical-evaluation"],
    focus: "usage signals that become the next training and evaluation set",
  },
  {
    key: "agent-platform",
    titles: ["Senior Software Engineer, Agent Orchestration", "Software Engineer, Agent Platform"],
    org: "Microsoft AI",
    team: "Agent Platform",
    discipline: "Engineering",
    diffusion: ["Engineering", "Engineering", "TPM"],
    levels: ["61", "62", "63"],
    locations: ["Redmond", "New York"],
    expandLocationsAt: 4,
    extraLocations: ["London", "Mountain View"],
    monthly: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
    closeAfterDays: null,
    capabilities: ["agent-orchestration", "tool-use", "planning", "agents"],
    focus: "a runtime that orchestrates agents, tools, and plans",
  },
  {
    key: "copilot",
    titles: ["Product Manager, Copilot Experiences", "Software Engineer, Copilot Surfaces"],
    org: "Microsoft 365",
    team: "Copilot Experiences",
    discipline: "PM",
    diffusion: ["PM", "Engineering", "PM"],
    levels: ["62", "63", "64"],
    locations: ["Redmond", "New York"],
    expandLocationsAt: 99,
    extraLocations: [],
    monthly: [2, 2, 2, 1, 1, 1, 2, 1, 0, 0, 0, 0],
    closeAfterDays: 75,
    capabilities: ["agents", "workflow-automation", "productization"],
    focus: "generic copilot surfaces inside existing productivity workflows",
  },
  {
    key: "fde",
    titles: ["Forward Deployed Engineer, Enterprise Agents", "Senior FDE, Customer Agent Deployments"],
    org: "Microsoft AI",
    team: "Forward Deployed Engineering",
    discipline: "FDE",
    diffusion: ["FDE", "FDE", "Engineering"],
    levels: ["62", "63", "64"],
    locations: ["New York"],
    expandLocationsAt: 6,
    extraLocations: ["London", "Redmond", "Zurich"],
    monthly: [0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2],
    closeAfterDays: null,
    capabilities: ["forward-deployed-engineering", "enterprise-ai", "customer-workflows", "agent-evals", "integration"],
    focus: "enterprise agent deployment measured against the customer workflow",
  },
  {
    key: "tpm",
    titles: ["Technical Program Manager, AI Data Infra & Systems", "Senior TPM, Evaluation Programs"],
    org: "Azure AI",
    team: "AI Data Infra",
    discipline: "TPM",
    diffusion: ["TPM", "TPM", "Engineering"],
    levels: ["62", "63", "64"],
    locations: ["Redmond"],
    expandLocationsAt: 7,
    extraLocations: ["New York", "London"],
    monthly: [0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    closeAfterDays: null,
    capabilities: ["data-infrastructure", "cross-functional-execution", "evals", "ml-systems"],
    focus: "program execution across data infrastructure and evaluation systems",
  },
  {
    key: "inference",
    titles: ["Senior Software Engineer, Inference", "Software Engineer, ML Systems"],
    org: "Azure AI",
    team: "Inference Platform",
    discipline: "Engineering",
    diffusion: ["Engineering"],
    levels: ["61", "62", "63"],
    locations: ["Redmond", "Mountain View"],
    expandLocationsAt: 99,
    extraLocations: [],
    monthly: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    closeAfterDays: null,
    capabilities: ["inference", "ml-systems", "distributed-systems", "observability"],
    focus: "inference serving and the distributed runtime under it",
  },
  {
    key: "alignment",
    titles: ["Researcher, Alignment", "Senior Researcher, AI Safety"],
    org: "Microsoft Research",
    team: "Alignment",
    discipline: "Research",
    diffusion: ["Research"],
    levels: ["64", "65", "66"],
    locations: ["Redmond", "Zurich"],
    expandLocationsAt: 99,
    extraLocations: [],
    monthly: [1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    closeAfterDays: null,
    capabilities: ["alignment", "safety", "red-teaming", "model-behavior"],
    focus: "alignment research and safety evaluation of frontier models",
  },
  {
    key: "observability",
    titles: ["Software Engineer, ML Observability", "Senior Software Engineer, Agent Telemetry"],
    org: "Microsoft AI",
    team: "Observability",
    discipline: "Engineering",
    diffusion: ["Engineering", "TPM"],
    levels: ["61", "62"],
    locations: ["Redmond"],
    expandLocationsAt: 8,
    extraLocations: ["New York"],
    monthly: [0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1],
    closeAfterDays: null,
    capabilities: ["observability", "reliability", "ml-systems", "agent-evals"],
    focus: "traces that make agent failures measurable",
  },
];

function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, values: T[]): T {
  return values[Math.floor(rng() * values.length)] ?? values[0];
}

function phrasesFor(slugs: string[]): string[] {
  return slugs.map((slug) => {
    const capability = ONTOLOGY.find((item) => item.slug === slug);
    return capability?.phrases[0] ?? slug;
  });
}

function buildJd(input: {
  title: string;
  org: string;
  team: string;
  location: string;
  discipline: Discipline;
  level: string;
  focus: string;
  capabilities: string[];
  extra?: string;
}): string {
  const phrases = phrasesFor(input.capabilities);
  const required = phrases.slice(0, 3);
  const preferred = phrases.slice(3);
  return [
    `${input.title}`,
    `Organization: ${input.org} / ${input.team}`,
    `Discipline: ${input.discipline}`,
    `Level: ${input.level}`,
    `Location: ${input.location}`,
    ``,
    `Overview`,
    `We are hiring a ${input.title} to work on ${input.focus}. The role partners across research, engineering, and customer-facing teams and treats measurement as part of the job.`,
    ``,
    `Required qualifications`,
    ...required.map((phrase) => `- Demonstrated work on ${phrase}.`),
    `- Ability to write down what good looks like before a launch.`,
    ``,
    `Preferred qualifications`,
    ...(preferred.length
      ? preferred.map((phrase) => `- Exposure to ${phrase}.`)
      : [`- Exposure to cross-functional execution.`]),
    `- Comfort with production constraints and ambiguous ownership.`,
    input.extra ?? "",
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

export function generateDataset(): Dataset {
  const rng = mulberry32(0xf0a71e);
  const jobs: Job[] = [];
  const snapshots: JobSnapshot[] = [];
  const links: Dataset["links"] = [];
  let serial = 0;

  for (const archetype of ARCHETYPES) {
    archetype.monthly.forEach((count, month) => {
      for (let n = 0; n < count; n += 1) {
        serial += 1;
        const postedAt = addDays(monthAnchor(month), Math.floor(rng() * 20));
        const id = `seed_${archetype.key}_${month}_${n}`;
        const title = archetype.titles[(month + n) % archetype.titles.length] ?? archetype.titles[0];
        const discipline =
          month >= 8
            ? pick(rng, archetype.diffusion)
            : month >= 4
              ? pick(rng, archetype.diffusion.slice(0, Math.max(2, archetype.diffusion.length - 1)))
              : archetype.discipline;
        const locationPool =
          month >= archetype.expandLocationsAt
            ? [...archetype.locations, ...archetype.extraLocations]
            : archetype.locations;
        const location = pick(rng, locationPool);
        const level = pick(rng, archetype.levels);
        const closeAt =
          archetype.closeAfterDays !== null
            ? addDays(postedAt, archetype.closeAfterDays)
            : month <= 2 && archetype.key !== "inference" && archetype.key !== "alignment"
              ? addDays(postedAt, 120)
              : null;
        const closed = closeAt !== null && closeAt <= DATA_AS_OF;
        const text = buildJd({
          title,
          org: archetype.org,
          team: archetype.team,
          location,
          discipline,
          level,
          focus: archetype.focus,
          capabilities: archetype.capabilities,
        });
        const snapshotId = `${id}_snap_1`;
        const hash = contentHash(text);
        const job: Job = {
          id,
          source: "demo-seed",
          sourceJobId: id,
          title,
          company: "Microsoft",
          org: archetype.org,
          team: archetype.team,
          discipline,
          level,
          locations: [location],
          sourceUrl: "",
          postedAt,
          firstSeenAt: postedAt,
          lastSeenAt: closed ? closeAt! : DATA_AS_OF,
          closedAt: closed ? closeAt : null,
          status: closed ? "closed" : "open",
          archetype: archetype.key,
          isDemo: true,
          createdAt: postedAt,
          updatedAt: closed ? closeAt! : DATA_AS_OF,
        };
        jobs.push(job);
        snapshots.push({
          id: snapshotId,
          jobId: id,
          capturedAt: postedAt,
          contentHash: hash,
          rawHtml: `<article data-demo="true">${text}</article>`,
          rawText: text,
          sourceMetadata: {
            archetype: archetype.key,
            isDemo: true,
            serial,
            note: "Synthetic observation. Not a live Microsoft posting.",
          },
        });
        links.push(...extractCapabilities(text, snapshotId, id, postedAt));

        if ((serial + month) % 8 === 0 && addDays(postedAt, 40) <= DATA_AS_OF && !closed) {
          const revised = `${text}\n\nUpdate\nUpdated scope now includes failure analysis alongside the post-training pipeline.`;
          const revisedId = `${id}_snap_2`;
          snapshots.push({
            id: revisedId,
            jobId: id,
            capturedAt: addDays(postedAt, 40),
            contentHash: contentHash(revised),
            rawHtml: `<article data-demo="true">${revised}</article>`,
            rawText: revised,
            sourceMetadata: { archetype: archetype.key, isDemo: true, revision: 2 },
          });
          const refreshed = extractCapabilities(revised, revisedId, id, addDays(postedAt, 40));
          for (let i = links.length - 1; i >= 0; i -= 1) {
            if (links[i]?.jobId === id) links.splice(i, 1);
          }
          links.push(...refreshed);
          job.updatedAt = addDays(postedAt, 40);
          job.lastSeenAt = DATA_AS_OF;
        }
      }
    });
  }

  if (jobs.length < 100) {
    throw new Error(`Seed produced ${jobs.length} jobs; expected at least 100.`);
  }

  const recommendations = buildRecommendations(jobs);
  const mandate = buildMandate();
  const { interviews, proposals } = buildCalibration();
  const ingestionRuns: IngestionRun[] = [
    {
      id: "run_demo_seed",
      source: "demo-seed",
      startedAt: `${DATA_AS_OF}T00:00:00.000Z`,
      completedAt: `${DATA_AS_OF}T00:05:00.000Z`,
      status: "success",
      recordsSeen: jobs.length,
      recordsCreated: jobs.length,
      recordsChanged: snapshots.length - jobs.length,
      recordsUnchanged: 0,
      recordsFailed: 0,
      errorSummary: null,
      isDemo: true,
      details: {
        kind: "deterministic-seed",
        note: "Loaded synthetic history. This is not a live Microsoft Careers sweep.",
        seenSourceJobIds: jobs.map((job) => job.sourceJobId),
      },
    },
  ];

  return {
    asOf: DATA_AS_OF,
    isDemo: true,
    capabilities: ONTOLOGY,
    jobs,
    snapshots,
    links,
    recommendations,
    mandates: [mandate.mandate],
    mandateCapabilities: mandate.capabilities,
    interviews,
    proposals,
    ingestionRuns,
  };
}

function buildRecommendations(jobs: Job[]): Recommendation[] {
  const pool = jobs
    .filter((job) => ["fde", "eval-eng", "flywheel", "tpm"].includes(job.archetype))
    .filter((job) => job.firstSeenAt >= addDays(DATA_AS_OF, -140))
    .sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt) || a.id.localeCompare(b.id));
  return pool.slice(0, 16).map((job, index) => ({
    id: `rec_${job.id}`,
    jobId: job.id,
    sourceMessageId: `demo-msg-${index + 1}`,
    recommendedAt: addDays(DATA_AS_OF, -130 + index * 8),
    recommendationRank: (index % 5) + 1,
    subject: `Recommended role: ${job.title}`,
    rawMetadata: { isDemo: true, archetype: job.archetype },
    isDemo: true,
  }));
}

function buildMandate(): { mandate: Dataset["mandates"][number]; capabilities: MandateCapability[] } {
  const rows: Array<Omit<MandateCapability, "id" | "mandateId" | "updatedAt"> & { history: MandateCapability["history"] }> = [
    row("enterprise-ai", 84, 74, 88, 0.8, "CAPE work is enterprise deployment.", [
      ["2025-10-06", 68],
      ["2026-04-02", 71],
      ["2026-07-03", 74],
    ]),
    row("customer-workflows", 88, 80, 92, 0.86, "Workflow discovery is the core of the mandate.", [
      ["2025-10-06", 74],
      ["2026-04-02", 78],
      ["2026-07-03", 80],
    ]),
    row("technical-solution-shaping", 82, 70, 88, 0.74, "Shaping the technical approach before build.", [
      ["2025-10-06", 62],
      ["2026-07-03", 70],
    ]),
    row("agent-orchestration", 72, 54, 80, 0.66, "Architecture literacy for agent deployments.", [
      ["2025-10-06", 42],
      ["2026-04-02", 48],
      ["2026-09-04", 54],
    ]),
    row("agents", 70, 62, 78, 0.7, "Need working fluency, not a research identity.", [
      ["2025-10-06", 55],
      ["2026-07-03", 62],
    ]),
    row("evals", 80, 57, 86, 0.72, "Measurement is becoming part of deployment judgment.", [
      ["2025-10-06", 40],
      ["2026-04-02", 48],
      ["2026-07-03", 53],
      ["2026-09-04", 57],
    ]),
    row("agent-evals", 76, 50, 82, 0.64, "Customer pilots fail in trajectories, not demos.", [
      ["2025-10-06", 34],
      ["2026-07-03", 44],
      ["2026-09-04", 50],
    ]),
    row("failure-analysis", 74, 48, 80, 0.6, "Failure taxonomies change the customer conversation.", [
      ["2025-10-06", 36],
      ["2026-09-04", 48],
    ]),
    row("statistical-evaluation", 68, 42, 78, 0.58, "Intervals and sample size are the leverage point.", [
      ["2025-10-06", 30],
      ["2026-04-02", 36],
      ["2026-09-04", 42],
    ]),
    row("cross-functional-execution", 86, 78, 90, 0.84, "The role already does this. Keep it sharp.", [
      ["2025-10-06", 74],
      ["2026-04-02", 78],
    ]),
    row("productization", 60, 55, 70, 0.62, "Translate pilots into a repeatable motion.", [
      ["2025-10-06", 50],
      ["2026-07-03", 55],
    ]),
    row("governance", 70, 63, 78, 0.7, "Risk and decision rights show up in every deployment.", [
      ["2025-10-06", 58],
      ["2026-07-03", 63],
    ]),
    row("executive-communication", 75, 72, 84, 0.8, "Already a strength. Depth is narrative precision.", [
      ["2025-10-06", 68],
      ["2026-04-02", 72],
    ]),
    row("reinforcement-learning", 41, 29, 55, 0.45, "Literacy for RL environments, not a research track.", [
      ["2025-10-06", 18],
      ["2026-09-04", 29],
    ]),
    row("post-training", 36, 22, 50, 0.42, "Enough depth to judge post-training claims.", [
      ["2025-10-06", 14],
      ["2026-09-04", 22],
    ]),
    row("data-flywheels", 34, 18, 48, 0.4, "Emerging. Stay literate as customer data loops appear.", [
      ["2025-10-06", 10],
      ["2026-09-04", 18],
    ]),
    row("integration", 64, 58, 74, 0.66, "Deployments die in the integration layer.", [
      ["2025-10-06", 52],
      ["2026-07-03", 58],
    ]),
  ];

  return {
    mandate: {
      id: "mandate_cape",
      name: "CAPE",
      title: "Senior Customer Program Manager — CAPE",
      organization: "Microsoft",
      description:
        "Current mandate: enterprise agent deployment, customer workflow discovery, technical solution shaping, evaluation literacy, and cross-functional execution. Analysis is anchored here.",
      activeFrom: "2025-10-06",
      activeTo: null,
      createdAt: "2025-10-06",
    },
    capabilities: rows.map((item) => ({
      ...item,
      id: `mc_${item.capabilityId}`,
      mandateId: "mandate_cape",
      updatedAt: item.history[item.history.length - 1]?.date ?? DATA_AS_OF,
    })),
  };
}

function row(
  capabilityId: string,
  importance: number,
  currentDepth: number,
  targetDepth: number,
  confidence: number,
  rationale: string,
  history: Array<[string, number]>,
): Omit<MandateCapability, "id" | "mandateId" | "updatedAt"> {
  return {
    capabilityId,
    importance,
    currentDepth,
    targetDepth,
    confidence,
    rationale,
    history: history.map(([date, depth]) => ({ date, depth })),
  };
}

function buildCalibration(): Pick<Dataset, "interviews" | "proposals"> {
  const interviews: Dataset["interviews"] = [
    {
      id: "int_2026_04",
      month: "2026-04",
      answers: {
        exercised: ["customer-workflows", "enterprise-ai"],
        leverage: "evals",
      },
      summary: "Workflow discovery stayed central. Eval design showed up as the missing measurement language.",
      completedAt: "2026-04-02",
      createdAt: "2026-04-02",
    },
    {
      id: "int_2026_07",
      month: "2026-07",
      answers: {
        exercised: ["technical-solution-shaping", "governance"],
        leverage: "agent-evals",
      },
      summary: "Solution shaping improved. Agent trajectories were still explained by another team.",
      completedAt: "2026-07-03",
      createdAt: "2026-07-03",
    },
    {
      id: "int_2026_09",
      month: "2026-09",
      answers: {
        exercised: ["evals", "agent-orchestration"],
        leverage: "statistical-evaluation",
      },
      summary: "Could scope an eval plan. Still could not defend a confidence interval without help.",
      completedAt: "2026-09-04",
      createdAt: "2026-09-04",
    },
  ];
  const proposals: Dataset["proposals"] = [
    proposal("p1", "int_2026_04", "evals", 40, 48, "Ran a first structured pilot review with an explicit pass bar."),
    proposal("p2", "int_2026_04", "customer-workflows", 74, 78, "Led discovery on two workflows without a solutions engineer in the room."),
    proposal("p3", "int_2026_07", "technical-solution-shaping", 62, 70, "Wrote the technical approach for a deployment before engineering staffing."),
    proposal("p4", "int_2026_07", "agent-evals", 34, 44, "Could name trajectory failures, still needed help designing the set."),
    proposal("p5", "int_2026_09", "evals", 53, 57, "Eval plan is now part of the deployment review, not a follow-up."),
    proposal("p6", "int_2026_09", "statistical-evaluation", 36, 42, "Asked for intervals, could not yet compute them unaided."),
    proposal("p7", "int_2026_09", "agent-orchestration", 48, 54, "Can read an orchestration design and spot missing state."),
  ];
  return { interviews, proposals };
}

function proposal(
  id: string,
  interviewId: string,
  capabilityId: string,
  oldValue: number,
  proposedValue: number,
  rationale: string,
): Dataset["proposals"][number] {
  const interviewDate = interviewId.includes("04")
    ? "2026-04-02"
    : interviewId.includes("07")
      ? "2026-07-03"
      : "2026-09-04";
  return {
    id,
    monthlyInterviewId: interviewId,
    capabilityId,
    oldValue,
    proposedValue,
    rationale,
    approved: true,
    approvedAt: interviewDate,
  };
}

let cached: Dataset | null = null;

export function getSeedDataset(): Dataset {
  if (!cached) cached = generateDataset();
  return cached;
}
