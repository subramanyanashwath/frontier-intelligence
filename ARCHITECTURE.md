# Architecture

Frontier Operator is one Next.js application. Supabase Postgres is the system of record when configured. Without `DATABASE_URL`, the same screens run from a deterministic in-memory seed so local demo and tests do not require hosted services.

```text
                        USER
                         │
                         ▼
                  NEXT.JS WEB APP
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      Operator        Private       Calibration
       Mode           Alpha           Flow
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
              REPOSITORY (demo | postgres)
                         │
                         ▼
                   SUPABASE POSTGRES
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Raw Data       Normalized      Derived
      Snapshots         Records        Metrics
          │              │              │
          └──────────────┼──────────────┘
                         │
                 GITHUB ACTIONS
                  weekly / monthly
                         │
             ┌───────────┴───────────┐
             │                       │
       Microsoft Careers      Recommendation
       public job adapter     adapter (mock now)
```

## Raw, normalized, derived

- **Raw.** `job_snapshots.raw_text` and `raw_html`, plus `content_hash`, `captured_at`, and `source_metadata_json`. Recommendation rows keep message id, time, and metadata. Ingestion never overwrites a snapshot with extracted tags.
- **Normalized.** `jobs`, `job_capabilities`, `capabilities`, `mandates`, `mandate_capabilities`, `recommendations`. Capability tags in v0 come from a deterministic phrase extractor, not an LLM.
- **Derived.** Momentum, persistence, novelty, diffusion, Greeks, gaps, learning allocation, and tape events are pure functions of normalized history and an `asOf` date. `scripts/calculate-metrics.ts` can persist them to `capability_metrics` and `learning_allocations`. The UI recomputes them so a missing cache cannot invent a different number.

Demo rows use `source = 'demo-seed'` and `is_demo = true`.

## Provenance

Every derived insight the UI can open carries:

- the heuristic definition
- the inputs used
- sample counts
- a confidence band
- contributing jobs and excerpts

Confidence reflects sample size, functional spread, location spread, and persistence. Provenance (demo seed vs live sweep) is a separate badge. A large demo sample can be internally consistent and still must not be labeled as a live market sweep.

## Ingestion

`lib/ingestion/microsoft-careers.ts` calls the public Eightfold PCSX search used by Microsoft Careers:

```text
GET https://apply.careers.microsoft.com/api/pcsx/search
GET https://apply.careers.microsoft.com/api/pcsx/position_details
```

`https://apply.careers.microsoft.com/robots.txt` allows `/api/pcsx` and `/careers`. The adapter:

- sends an identifying User-Agent
- waits between requests
- stops on 429/403 instead of retrying through them
- does not solve CAPTCHA or use authenticated career-hub routes
- logs failures onto `ingestion_runs`

Idempotency key is `(source, source_job_id)`. Unchanged `content_hash` only bumps `last_seen_at`. A change inserts a new snapshot and refreshes normalized fields and capability links.

Closure requires absence from two consecutive **successful** sweeps. A failed scrape does not close anything.

## Analytics

Window momentum compares new postings in the window with the prior window of equal length:

```text
momentum = (current - prior) / (prior + 2)
```

The `+ 2` smoothing term stops tiny samples from printing three-digit percentages. The UI shows the integer percent and the raw counts.

Longer Surface horizons are labeled projections: they decay short-window momentum and lean on persistence and Vega. They are not statistical forecasts.

## Auth and the private boundary

Operator routes are readable without a session because their content is the internal-safe product.

`/private/**` is a different layout. A server check requires an HttpOnly cookie set from `PRIVATE_MODE_PASSPHRASE`. In development only, the demo passphrase is `demo-operator`. Production without a passphrase refuses private mode rather than shipping a default password.

Operator view-models do not receive recommendation subjects, fit horizons, or Career Alpha components. Private X-Ray is `/private/xray/[jobId]`, not a flag on the operator page.

There is no Supabase Auth UI in v0. When Supabase is connected, the passphrase gate remains the private boundary until Entra ID is an explicit later project. Supabase Auth can replace the gate without moving private components into the operator tree.

## GitHub Actions

- `ci.yml` — lint, typecheck, unit tests, production build.
- `weekly-ingest.yml` — migrate check, Microsoft ingestion, closures, metric rebuild.
- `monthly-sweep.yml` — ingestion, 30/90/180 metrics, events, learning allocation, calibration-ready marker.

Workflows no-op their database steps with a visible log line when secrets are absent, so a fork does not fail closed on missing credentials. A configured production repo should set the secrets.

## Vercel and Supabase

Vercel builds the Next.js app. `main` is production; other branches are previews. Supabase holds Postgres. The app uses the Postgres connection string via Drizzle. No custom domain is required.

Mandate edits and calibration approvals persist to Postgres when `DATABASE_URL` is set, and to `.data/overlay.json` in local demo mode. Serverless instances without a database do not keep those writes.

## Python

Not in v0. If a later metric genuinely needs Python, add a small `analytics-python/` batch and have it write derived rows. Do not put it on the request path first.

## Local demo

`lib/seed/generate.ts` builds 12 months of marked synthetic observations: rising evals and post-training, emerging data flywheels, agent wording that stops accelerating, copilot-era closures, diffusion into TPM and FDE, recommendation events, and approved mandate calibrations. The anchor date is `2026-10-06`.
