CREATE TABLE IF NOT EXISTS "jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "source" text NOT NULL,
  "source_job_id" text NOT NULL,
  "title" text NOT NULL,
  "company" text NOT NULL,
  "org" text NOT NULL,
  "team" text NOT NULL,
  "discipline" text NOT NULL,
  "level" text NOT NULL,
  "locations_json" jsonb NOT NULL,
  "source_url" text DEFAULT '' NOT NULL,
  "posted_at" timestamptz NOT NULL,
  "first_seen_at" timestamptz NOT NULL,
  "last_seen_at" timestamptz NOT NULL,
  "closed_at" timestamptz,
  "status" text NOT NULL,
  "archetype" text DEFAULT '' NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "jobs_source_source_job_id_idx" ON "jobs" ("source", "source_job_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_snapshots" (
  "id" text PRIMARY KEY NOT NULL,
  "job_id" text NOT NULL,
  "captured_at" timestamptz NOT NULL,
  "content_hash" text NOT NULL,
  "raw_html" text NOT NULL,
  "raw_text" text NOT NULL,
  "source_metadata_json" jsonb NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "job_snapshots_job_hash_idx" ON "job_snapshots" ("job_id", "content_hash");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recommendations" (
  "id" text PRIMARY KEY NOT NULL,
  "job_id" text,
  "source_message_id" text NOT NULL,
  "recommended_at" timestamptz NOT NULL,
  "recommendation_rank" integer,
  "subject" text NOT NULL,
  "raw_metadata_json" jsonb NOT NULL,
  "is_demo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capabilities" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "parent_id" text,
  "description" text NOT NULL,
  "aliases_json" jsonb NOT NULL,
  "phrases_json" jsonb NOT NULL,
  "category" text NOT NULL,
  "base_theta" integer NOT NULL,
  "base_vega" integer NOT NULL,
  "adjacency_json" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL,
  CONSTRAINT "capabilities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_capabilities" (
  "id" text PRIMARY KEY NOT NULL,
  "job_id" text NOT NULL,
  "capability_id" text NOT NULL,
  "weight" real NOT NULL,
  "evidence_type" text NOT NULL,
  "confidence" real NOT NULL,
  "evidence_quote" text NOT NULL,
  "source_snapshot_id" text NOT NULL,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mandates" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "title" text NOT NULL,
  "organization" text NOT NULL,
  "description" text NOT NULL,
  "active_from" timestamptz NOT NULL,
  "active_to" timestamptz,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mandate_capabilities" (
  "id" text PRIMARY KEY NOT NULL,
  "mandate_id" text NOT NULL,
  "capability_id" text NOT NULL,
  "importance" integer NOT NULL,
  "current_depth" integer NOT NULL,
  "target_depth" integer NOT NULL,
  "confidence" real NOT NULL,
  "rationale" text NOT NULL,
  "history_json" jsonb NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capability_metrics" (
  "id" text PRIMARY KEY NOT NULL,
  "capability_id" text NOT NULL,
  "as_of_date" timestamptz NOT NULL,
  "window_days" integer NOT NULL,
  "posting_count" integer NOT NULL,
  "recommendation_count" integer NOT NULL,
  "momentum" real NOT NULL,
  "novelty" real NOT NULL,
  "persistence" real NOT NULL,
  "functional_diffusion" integer NOT NULL,
  "geographic_diffusion" integer NOT NULL,
  "level_diffusion" real NOT NULL,
  "delta" real NOT NULL,
  "gamma" real NOT NULL,
  "theta" real NOT NULL,
  "vega" real NOT NULL,
  "implied_vol" real NOT NULL,
  "confidence" real NOT NULL,
  "inputs_json" jsonb NOT NULL,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_interviews" (
  "id" text PRIMARY KEY NOT NULL,
  "month" text NOT NULL,
  "answers_json" jsonb NOT NULL,
  "summary" text NOT NULL,
  "completed_at" timestamptz,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "capability_update_proposals" (
  "id" text PRIMARY KEY NOT NULL,
  "monthly_interview_id" text NOT NULL,
  "capability_id" text NOT NULL,
  "old_value" integer NOT NULL,
  "proposed_value" integer NOT NULL,
  "rationale" text NOT NULL,
  "approved" boolean,
  "approved_at" timestamptz
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "learning_allocations" (
  "id" text PRIMARY KEY NOT NULL,
  "month" text NOT NULL,
  "capability_id" text NOT NULL,
  "allocation_pct" real NOT NULL,
  "rationale" text NOT NULL,
  "recommended_action" text NOT NULL,
  "time_estimate_hours" real NOT NULL,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
  "id" text PRIMARY KEY NOT NULL,
  "event_type" text NOT NULL,
  "job_id" text,
  "capability_id" text,
  "occurred_at" timestamptz NOT NULL,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "metadata_json" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ingestion_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "source" text NOT NULL,
  "started_at" timestamptz NOT NULL,
  "completed_at" timestamptz,
  "status" text NOT NULL,
  "records_seen" integer NOT NULL,
  "records_created" integer NOT NULL,
  "records_changed" integer NOT NULL,
  "records_unchanged" integer NOT NULL,
  "records_failed" integer NOT NULL,
  "error_summary" text,
  "is_demo" boolean DEFAULT false NOT NULL,
  "details_json" jsonb NOT NULL
);
