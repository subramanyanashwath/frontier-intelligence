export const DISCIPLINES = [
  "Research",
  "Engineering",
  "TPM",
  "PM",
  "FDE",
  "Data Science",
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

export const LOCATIONS = [
  "Redmond",
  "New York",
  "Mountain View",
  "London",
  "Zurich",
] as const;

export type LocationName = (typeof LOCATIONS)[number];

export type EvidenceType = "required" | "preferred" | "inferred";

export type JobStatus = "open" | "closed";

export type Capability = {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  description: string;
  aliases: string[];
  phrases: string[];
  category: string;
  baseTheta: number;
  baseVega: number;
  adjacency: string[];
};

export type JobCapabilityLink = {
  id: string;
  jobId: string;
  capabilityId: string;
  weight: number;
  evidenceType: EvidenceType;
  confidence: number;
  evidenceQuote: string;
  sourceSnapshotId: string;
  createdAt: string;
};

export type JobSnapshot = {
  id: string;
  jobId: string;
  capturedAt: string;
  contentHash: string;
  rawHtml: string;
  rawText: string;
  sourceMetadata: Record<string, unknown>;
};

export type Job = {
  id: string;
  source: string;
  sourceJobId: string;
  title: string;
  company: string;
  org: string;
  team: string;
  discipline: Discipline;
  level: string;
  locations: string[];
  sourceUrl: string;
  postedAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  closedAt: string | null;
  status: JobStatus;
  archetype: string;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Recommendation = {
  id: string;
  jobId: string | null;
  sourceMessageId: string;
  recommendedAt: string;
  recommendationRank: number | null;
  subject: string;
  rawMetadata: Record<string, unknown>;
  isDemo: boolean;
};

export type Mandate = {
  id: string;
  name: string;
  title: string;
  organization: string;
  description: string;
  activeFrom: string;
  activeTo: string | null;
  createdAt: string;
};

export type DepthPoint = {
  date: string;
  depth: number;
};

export type MandateCapability = {
  id: string;
  mandateId: string;
  capabilityId: string;
  importance: number;
  currentDepth: number;
  targetDepth: number;
  confidence: number;
  rationale: string;
  updatedAt: string;
  history: DepthPoint[];
};

export type MonthlyInterview = {
  id: string;
  month: string;
  answers: Record<string, unknown>;
  summary: string;
  completedAt: string | null;
  createdAt: string;
};

export type CapabilityUpdateProposal = {
  id: string;
  monthlyInterviewId: string;
  capabilityId: string;
  oldValue: number;
  proposedValue: number;
  rationale: string;
  approved: boolean | null;
  approvedAt: string | null;
};

export type IngestionRun = {
  id: string;
  source: string;
  startedAt: string;
  completedAt: string | null;
  status: "success" | "partial" | "failed" | "running";
  recordsSeen: number;
  recordsCreated: number;
  recordsChanged: number;
  recordsUnchanged: number;
  recordsFailed: number;
  errorSummary: string | null;
  isDemo: boolean;
  details: Record<string, unknown>;
};

export type Dataset = {
  asOf: string;
  isDemo: boolean;
  capabilities: Capability[];
  jobs: Job[];
  snapshots: JobSnapshot[];
  links: JobCapabilityLink[];
  recommendations: Recommendation[];
  mandates: Mandate[];
  mandateCapabilities: MandateCapability[];
  interviews: MonthlyInterview[];
  proposals: CapabilityUpdateProposal[];
  ingestionRuns: IngestionRun[];
};

export type ConfidenceBand = "LOW" | "MEDIUM" | "HIGH";

export type Confidence = {
  band: ConfidenceBand;
  score: number;
  detail: string;
};

export type EvidenceJob = {
  id: string;
  title: string;
  org: string;
  team: string;
  location: string;
  discipline: string;
  date: string;
  excerpt: string;
};

export type EvidenceModel = {
  id: string;
  title: string;
  value: string;
  confidence: Confidence;
  heuristic: string;
  inputs: { label: string; value: string }[];
  jobs: EvidenceJob[];
};
