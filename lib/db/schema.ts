import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    source: text("source").notNull(),
    sourceJobId: text("source_job_id").notNull(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    org: text("org").notNull(),
    team: text("team").notNull(),
    discipline: text("discipline").notNull(),
    level: text("level").notNull(),
    locationsJson: jsonb("locations_json").$type<string[]>().notNull(),
    sourceUrl: text("source_url").notNull().default(""),
    postedAt: timestamp("posted_at", { withTimezone: true, mode: "string" }).notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: "string" }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "string" }).notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true, mode: "string" }),
    status: text("status").notNull(),
    archetype: text("archetype").notNull().default(""),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
  },
  (table) => [uniqueIndex("jobs_source_source_job_id_idx").on(table.source, table.sourceJobId)],
);

export const jobSnapshots = pgTable(
  "job_snapshots",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true, mode: "string" }).notNull(),
    contentHash: text("content_hash").notNull(),
    rawHtml: text("raw_html").notNull(),
    rawText: text("raw_text").notNull(),
    sourceMetadataJson: jsonb("source_metadata_json").$type<Record<string, unknown>>().notNull(),
  },
  (table) => [uniqueIndex("job_snapshots_job_hash_idx").on(table.jobId, table.contentHash)],
);

export const recommendations = pgTable("recommendations", {
  id: text("id").primaryKey(),
  jobId: text("job_id"),
  sourceMessageId: text("source_message_id").notNull(),
  recommendedAt: timestamp("recommended_at", { withTimezone: true, mode: "string" }).notNull(),
  recommendationRank: integer("recommendation_rank"),
  subject: text("subject").notNull(),
  rawMetadataJson: jsonb("raw_metadata_json").$type<Record<string, unknown>>().notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const capabilities = pgTable("capabilities", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  parentId: text("parent_id"),
  description: text("description").notNull(),
  aliasesJson: jsonb("aliases_json").$type<string[]>().notNull(),
  phrasesJson: jsonb("phrases_json").$type<string[]>().notNull(),
  category: text("category").notNull(),
  baseTheta: integer("base_theta").notNull(),
  baseVega: integer("base_vega").notNull(),
  adjacencyJson: jsonb("adjacency_json").$type<string[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const jobCapabilities = pgTable("job_capabilities", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull(),
  capabilityId: text("capability_id").notNull(),
  weight: real("weight").notNull(),
  evidenceType: text("evidence_type").notNull(),
  confidence: real("confidence").notNull(),
  evidenceQuote: text("evidence_quote").notNull(),
  sourceSnapshotId: text("source_snapshot_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const mandates = pgTable("mandates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  organization: text("organization").notNull(),
  description: text("description").notNull(),
  activeFrom: timestamp("active_from", { withTimezone: true, mode: "string" }).notNull(),
  activeTo: timestamp("active_to", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const mandateCapabilities = pgTable("mandate_capabilities", {
  id: text("id").primaryKey(),
  mandateId: text("mandate_id").notNull(),
  capabilityId: text("capability_id").notNull(),
  importance: integer("importance").notNull(),
  currentDepth: integer("current_depth").notNull(),
  targetDepth: integer("target_depth").notNull(),
  confidence: real("confidence").notNull(),
  rationale: text("rationale").notNull(),
  historyJson: jsonb("history_json").$type<{ date: string; depth: number }[]>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const capabilityMetrics = pgTable("capability_metrics", {
  id: text("id").primaryKey(),
  capabilityId: text("capability_id").notNull(),
  asOfDate: timestamp("as_of_date", { withTimezone: true, mode: "string" }).notNull(),
  windowDays: integer("window_days").notNull(),
  postingCount: integer("posting_count").notNull(),
  recommendationCount: integer("recommendation_count").notNull(),
  momentum: real("momentum").notNull(),
  novelty: real("novelty").notNull(),
  persistence: real("persistence").notNull(),
  functionalDiffusion: integer("functional_diffusion").notNull(),
  geographicDiffusion: integer("geographic_diffusion").notNull(),
  levelDiffusion: real("level_diffusion").notNull(),
  delta: real("delta").notNull(),
  gamma: real("gamma").notNull(),
  theta: real("theta").notNull(),
  vega: real("vega").notNull(),
  impliedVol: real("implied_vol").notNull(),
  confidence: real("confidence").notNull(),
  inputsJson: jsonb("inputs_json").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const monthlyInterviews = pgTable("monthly_interviews", {
  id: text("id").primaryKey(),
  month: text("month").notNull(),
  answersJson: jsonb("answers_json").$type<Record<string, unknown>>().notNull(),
  summary: text("summary").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const capabilityUpdateProposals = pgTable("capability_update_proposals", {
  id: text("id").primaryKey(),
  monthlyInterviewId: text("monthly_interview_id").notNull(),
  capabilityId: text("capability_id").notNull(),
  oldValue: integer("old_value").notNull(),
  proposedValue: integer("proposed_value").notNull(),
  rationale: text("rationale").notNull(),
  approved: boolean("approved"),
  approvedAt: timestamp("approved_at", { withTimezone: true, mode: "string" }),
});

export const learningAllocations = pgTable("learning_allocations", {
  id: text("id").primaryKey(),
  month: text("month").notNull(),
  capabilityId: text("capability_id").notNull(),
  allocationPct: real("allocation_pct").notNull(),
  rationale: text("rationale").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  timeEstimateHours: real("time_estimate_hours").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  jobId: text("job_id"),
  capabilityId: text("capability_id"),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "string" }).notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>().notNull(),
});

export const ingestionRuns = pgTable("ingestion_runs", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true, mode: "string" }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
  status: text("status").notNull(),
  recordsSeen: integer("records_seen").notNull(),
  recordsCreated: integer("records_created").notNull(),
  recordsChanged: integer("records_changed").notNull(),
  recordsUnchanged: integer("records_unchanged").notNull(),
  recordsFailed: integer("records_failed").notNull(),
  errorSummary: text("error_summary"),
  isDemo: boolean("is_demo").notNull().default(false),
  detailsJson: jsonb("details_json").$type<Record<string, unknown>>().notNull(),
});
