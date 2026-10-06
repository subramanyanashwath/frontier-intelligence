# Frontier Operator

AI Capability Observatory. A longitudinal reading of how technical capabilities show up in public Microsoft job postings, mapped to a current CAPE mandate and a learning portfolio.

This is not a job board. Operator Mode is the default and is meant to be screen-shareable. Career Alpha lives on separate `/private` routes.

The seed clock is **2026-10-06**. Time Machine reconstructs that history. It does not invent live market data.

## Architecture

```text
Next.js (Vercel)  →  Operator / Private / Calibration
        │
        ▼
Repository  →  in-memory demo seed, or Supabase Postgres via Drizzle
        │
        ▼
GitHub Actions  →  weekly public-job ingest, monthly metric sweep
```

Raw snapshots stay immutable. Normalized jobs and capability tags sit in the middle. Momentum, Greeks, gaps, and allocations are recomputed from that history. See `ARCHITECTURE.md`.

## Requirements

- Node.js 22
- pnpm 10
- A Supabase project only when you want persistent data. Local demo does not need one.

## Local setup

```bash
git clone <repo>
cd frontier-intelligence
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open http://localhost:3000. It redirects to `/operator`.

Without `DATABASE_URL`, migrate and seed print a demo-mode notice and exit successfully. The app generates the same deterministic dataset in memory.

Private Career Alpha in development uses the passphrase `demo-operator` unless `PRIVATE_MODE_PASSPHRASE` is set. Production without that variable keeps `/private` locked.

## Environment variables

Copy `.env.example`. Names only:

| Name | Use |
| --- | --- |
| `DATABASE_URL` | Supabase Postgres connection string (pooler is fine; the client disables prepared statements) |
| `NEXT_PUBLIC_SUPABASE_URL` | Reserved for a later Supabase Auth cutover |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Reserved |
| `SUPABASE_SERVICE_ROLE_KEY` | Not used by the app runtime in v0. Keep it in GitHub/Vercel only if a script needs it |
| `PRIVATE_MODE_PASSPHRASE` | Required in production for `/private` |
| `GMAIL_*` | Deferred. Absent credentials use the mock adapter |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | Unused in v0 |
| `INGEST_QUERY`, `INGEST_MAX_PAGES`, `INGEST_DELAY_MS`, `INGEST_DETAIL_LIMIT` | Safety valves for the public careers adapter |

Never commit `.env.local`.

## Database migration

```bash
pnpm db:migrate
```

Applies `drizzle/0000_init.sql` when `DATABASE_URL` is set. Schema source is `lib/db/schema.ts`. `pnpm db:generate` is available for later schema changes.

## Seed data

```bash
pnpm db:seed
```

Writes marked `is_demo` rows when a database is configured. Re-running replaces demo rows and leaves live ingestion rows alone. The story in the seed: evaluations and post-training rise, data flywheels appear late, generic copilot surfaces close out, and capability language spreads into TPM and FDE.

## Run locally

```bash
pnpm dev
```

Routes:

- `/operator` Pulse
- `/operator/tape`
- `/operator/surface`
- `/operator/xray` and `/operator/xray/[jobId]`
- `/operator/mandate`
- `/operator/allocate`
- `/calibration`
- `/private` after the passphrase gate

Every analytical screen honors `?asOf=YYYY-MM-DD` and `?range=1W|1M|3M|6M|1Y`.

## Tests

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm typecheck
```

`pnpm check` runs lint, typecheck, unit tests, and the production build.

## Production build

```bash
pnpm build
pnpm start
```

## Vercel deployment

1. Import the GitHub repository. Framework preset: Next.js. Install command: `pnpm install`.
2. Production branch: `main`. Other branches become preview deployments.
3. Add environment variables from `.env.example` for Production and Preview.
4. Deploy. The default `*.vercel.app` hostname is enough for v0.
5. No custom domain is required.

Mandate edits and calibration approvals need `DATABASE_URL`. On Vercel, without it, those writes go nowhere durable. The observatory itself still renders from the demo seed.

## GitHub Actions configuration

Workflows:

- `.github/workflows/ci.yml` on pull requests and pushes to `main`
- `.github/workflows/weekly-ingest.yml` Mondays 09:00 UTC, plus manual dispatch
- `.github/workflows/monthly-sweep.yml` on the 1st at 10:00 UTC, plus manual dispatch

Repository secret:

- `DATABASE_URL` — the same Postgres string, preferably the Supabase pooler URI

Ingestion uses the public Microsoft Careers search at `apply.careers.microsoft.com/api/pcsx`, which `robots.txt` allows. It identifies itself, waits between requests, and stops on HTTP 429 or 403. It does not solve CAPTCHAs or use signed-in career-hub routes. Failures are written to `ingestion_runs` and printed in the job log.

A missing `DATABASE_URL` fails the ingest and monthly workflows on purpose. CI does not need the secret.

## Supabase configuration

1. Create a free project.
2. Copy the project URL, anon key, service-role key, and the Postgres connection string (Session pooler, port 5432 or the transaction pooler).
3. Put `DATABASE_URL` in `.env.local`, in Vercel, and in GitHub Actions secrets.
4. From a machine with that URL: `pnpm db:migrate` then `pnpm db:seed`.

Auth in v0 is a passphrase cookie for `/private`, not Supabase Auth and not Entra ID.

## Troubleshooting

- **Pages say the database is empty.** `DATABASE_URL` is set and the tables have no jobs. Run `pnpm db:seed`, or unset `DATABASE_URL` to use demo mode. An empty database is not backfilled with demo rows, so live and demo are not mixed.
- **Private route says it is locked.** Set `PRIVATE_MODE_PASSPHRASE` in production.
- **Weekly ingest exits on HTTP 429.** The public endpoint rate-limited the run. The failure is stored. Lower `INGEST_MAX_PAGES` or raise `INGEST_DELAY_MS`. Do not retry in a tight loop.
- **Build cannot fetch fonts.** `next/font` downloads IBM Plex during build. The environment needs outbound network then.
- **Local mandate edits disappeared.** Demo mode stores them in `.data/overlay.json`. That file is gitignored and is not durable on Vercel.

## Known limitations

- The bundled history is synthetic and labeled `DEMO SEED`. It is not a live reading of Microsoft hiring.
- Gmail recommendation ingest is an interface plus a mock. OAuth is deferred.
- Capability tags are phrase matches, not an LLM extraction.
- Greeks, fit horizons, and Career Alpha are heuristics with their inputs shown. They are not measurements and not role probabilities.
- Surface cells beyond "Now" are decayed projections.
- Operator Mode does not render recommendation subjects, fit scores, or the Career Alpha surface. Those exist only under `/private`.
- There is no resume tool, application tracker, compensation view, or multi-user tenancy.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Local app |
| `pnpm build` / `pnpm start` | Production |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm test:e2e` | Checks |
| `pnpm db:migrate` / `pnpm db:seed` | Schema and demo rows |
| `pnpm ingest:jobs` | Public careers ingest |
| `pnpm metrics:rebuild` | Persist derived metrics |
| `pnpm sweep:monthly` | Ingest, metrics, calibration-ready marker |
| `pnpm check` | Lint, types, unit tests, build |
