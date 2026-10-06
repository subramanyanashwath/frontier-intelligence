# Frontier Operator / Career Alpha
## One-Shot Cursor Build Guide

> **Goal:** Build a production-quality personal AI capability intelligence system that tracks Microsoft job-market signals over time, compares them against my current CAPE mandate, identifies capability gaps and frontier trends, and turns those signals into a dynamic learning portfolio.
>
> **Primary deployment model:** GitHub for source control + Vercel for the live web app + Supabase for persistent Postgres data + GitHub Actions for scheduled collection/analysis.
>
> **Important framing:** This is **not a job-search app**. The internal-safe product is an **AI Capability Observatory**. The private layer may contain Career Alpha analysis, but the default visible experience must be safe to show to Microsoft managers/senior leaders.

---

# 0. Build Philosophy

This project should be:

- beautiful enough to show senior Microsoft people;
- analytically serious enough to become genuinely useful;
- simple enough for one person to maintain;
- cheap enough to run on free plans initially;
- deterministic and auditable where possible;
- longitudinal, preserving historical observations over time;
- explicitly designed to avoid scope creep.

The product metaphor is:

> **Bloomberg Terminal × Football Manager for frontier AI capability development.**

The market is changing. Job descriptions are organizational telemetry. Skills are factors. Learning is capital allocation. My current role is the underlying asset.

The system should answer:

> Given what Microsoft is hiring for, what Microsoft repeatedly recommends to me, what has changed over time, and what my current mandate requires, what should I learn, deepen, build, or merely remain literate in?

---

# 1. Product Names and Modes

Use these terms consistently.

## Product / shareable name

**Frontier Operator**

Internal-safe subtitle:

> AI Capability Observatory

Description:

> Tracking how technical capabilities, responsibilities, and organizational interfaces are evolving across AI roles, then mapping those changes to current-role learning priorities.

## Private layer

**Career Alpha**

This may include:

- personal recommendation trends;
- future-role adjacency;
- role-fit heuristics;
- optionality;
- private career projections;
- career Greeks;
- opportunity surfaces.

## Modes

Implement two distinct modes:

### Operator Mode — DEFAULT

Safe to show internally.

May include:

- capability momentum;
- role convergence;
- functional diffusion;
- organizational emphasis;
- current mandate;
- current-role skill gaps;
- technical literacy/depth priorities;
- learning allocation;
- public job evidence.

Must NOT show:

- exit-role targeting;
- compensation optimization;
- personal “likelihood of landing role X”;
- “jobs I should apply to”;
- recruiting probability;
- future employer targets;
- anything implying active job hunting.

### Private Career Mode

Authenticated/private.

May additionally show:

- personalized Microsoft recommendation distribution;
- role adjacency;
- future-role option value;
- current fit / 6m fit / 12m fit;
- private Career Alpha scores;
- career-surface analysis.

**Architectural requirement:** Operator and Private modes must be separate routes/components, not a fragile cosmetic toggle that can accidentally reveal private information during a screen share.

---

# 2. Tech Stack

Use exactly this stack for v0 unless there is a compelling technical blocker.

## Core

- **Next.js** — App Router
- **TypeScript**
- **React**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase Postgres**
- **Drizzle ORM**
- **Zod**
- **ECharts** for dense analytical charts
- **Plotly.js** only where needed for a real 3D surface
- **Vitest** for unit tests
- **Playwright** for end-to-end smoke tests
- **pnpm**
- **GitHub**
- **Vercel**
- **GitHub Actions**

## Optional / deferred

Do NOT add these unless required:

- Python
- FastAPI
- Redis
- Kafka
- Docker orchestration
- Kubernetes
- vector database beyond pgvector
- background worker service
- LangChain
- complex agent frameworks
- separate microservices

If later analytics genuinely require Python, add a small `/analytics-python` layer then. Do not preemptively create it.

---

# 3. System Architecture

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
                   SUPABASE POSTGRES
                         │
          ┌──────────────┼──────────────┐
          │              │              │
       Raw Data       Normalized      Derived
      Snapshots         Records        Metrics
          │              │              │
          └──────────────┼──────────────┘
                         │
              Scheduled collection
                         │
                 GITHUB ACTIONS
                  weekly/monthly
                         │
             ┌───────────┴───────────┐
             │                       │
       Microsoft Careers      Recommendation Email
       public job data        adapter (later)
```

Three data layers are mandatory:

## Raw

Immutable source observations.

Examples:

- exact job-page HTML/text;
- exact recommendation email metadata;
- scrape timestamp;
- source URL;
- content hash.

## Normalized

Structured facts extracted from raw sources.

Examples:

- title;
- org;
- team;
- level;
- location;
- discipline;
- required skills;
- preferred skills;
- capability tags.

## Derived

Recomputable analytics.

Examples:

- momentum;
- diffusion;
- Delta;
- Gamma;
- Theta;
- Vega;
- fit;
- gap;
- learning allocation;
- trend summaries.

**Never let an LLM overwrite raw source data.**

---

# 4. v0 Product Contract

Build exactly these six main screens plus one calibration workflow.

Do not add extra major screens during the initial build.

---

# 5. Screen 1 — PULSE

Route:

```text
/operator
```

or:

```text
/operator/pulse
```

Purpose:

> What changed?

This is the default landing screen.

## Required sections

### Market regime

Example:

```text
MSFT AI REGIME
EVALS + POST-TRAINING ACCELERATING
```

### Capability movers

Show:

- capability;
- 7d momentum;
- 30d momentum;
- 90d momentum;
- confidence.

Example:

```text
Evaluations        +27%
RL                 +34%
Data Flywheels     +21%
Agents              +4%
Generic Copilot     -8%
```

### New signals

Recent:

- new roles;
- new capability families;
- new locations;
- new role/function combinations;
- significant JD wording changes.

### Current mandate coverage

Show top current-role capability gaps.

### Learning allocation change

Example:

```text
Eval Systems        20% → 23%
RL / Post-training  14% → 18%
Statistics          12% → 15%
```

### Explainability

Every metric must be clickable.

Example:

```text
RL +34%
```

opens evidence:

- contributing job postings;
- dates;
- organizations;
- locations;
- JD excerpts;
- confidence.

---

# 6. Screen 2 — TAPE

Route:

```text
/operator/tape
```

Purpose:

> What is happening over time?

Create a chronological event stream.

Event types:

- `NEW_JOB`
- `JOB_CLOSED`
- `JOB_CHANGED`
- `NEW_CAPABILITY`
- `RECOMMENDED_TO_ME`
- `ROLE_DIFFUSION`
- `LOCATION_EXPANSION`

Example:

```text
18:42  NEW      Software Engineer, Reinforcement Learning
17:10  NEW      TPM, AI Data Infra & Systems
14:31  REC      Senior Data Scientist — FDE
11:05  CLOSED   Applied Scientist — Agent Evals
```

Filters:

- date range;
- organization;
- discipline;
- function;
- location;
- capability;
- recommended-to-me;
- level.

The page must feel like a market tape, not a generic card grid.

---

# 7. Screen 3 — SURFACE

Route:

```text
/operator/surface
```

Purpose:

> Where is the puck skating?

This is the signature analytical screen.

## Main surface

Use a 2D matrix by default because it is easier to read.

### X-axis

Capability:

- Agents
- Evaluations
- Environments
- Synthetic Data
- RL
- Post-training
- Inference
- Data Infrastructure
- Alignment / Safety
- Observability
- FDE
- Multimodal

### Y-axis

Time horizon:

- Now
- 3M
- 6M
- 12M

### Cell intensity

Derived opportunity / momentum.

Provide three views:

1. **Market Surface**
2. **Mandate Surface**
3. **Career Alpha Surface** — private only

Optional toggle:

- 3D “vol surface” visualization using Plotly.

Do not make the 3D chart the only usable visualization.

---

# 8. Screen 4 — X-RAY

Route:

```text
/operator/xray/[jobId]
```

Purpose:

> What does this specific job description actually signal?

Display:

- title;
- org/team;
- location;
- discipline;
- level;
- first seen;
- last seen;
- source URL;
- status.

## Capability fingerprint

Example:

```text
RL / optimization       ██████████
Post-training           █████████
Evaluation              ███████
Distributed systems     ██████
Data generation         █████
Agents                  ██
```

## Requirements

Separate:

- explicit required skills;
- explicit preferred skills;
- inferred capabilities.

## Organizational signal

Example:

> This role suggests RL is being operationalized alongside post-training infrastructure rather than remaining isolated in research.

## Evidence

Every inference must link to source text excerpts.

## Personal/private fields

Only in Private mode:

- current fit;
- 6m attainable fit;
- 12m attainable fit;
- learning value;
- strategic option value.

---

# 9. Screen 5 — MANDATE

Route:

```text
/operator/mandate
```

Purpose:

> What does my current CAPE mandate require, and where should I deepen?

This is the internal-safe replacement for a “player profile.”

Anchor all analysis to the current role.

## Current role

Use seeded placeholder content that is editable from the UI.

Initial title:

> Senior Customer Program Manager — CAPE

Initial mandate capability examples:

- Enterprise agent deployment
- Customer workflow discovery
- Technical solution shaping
- Agent architecture
- Evaluation / measurement
- Cross-functional execution
- Product feedback → engineering
- Governance / risk
- Executive communication

## Capability table

Columns:

- Capability
- Mandate importance
- Current depth
- Target depth
- Gap
- Frontier momentum
- Learning priority
- Confidence

Example:

```text
Capability          Mandate  Current  Gap   Frontier Δ
Agent architecture     85       76     -9       +14
Eval design            78       57    -21       +31
Statistics             62       46    -16       +25
RL environments        41       29    -12       +38
Post-training          32       20    -12       +42
```

Use normalized 0–100 visual scales, but do not imply false scientific precision.

Always show the methodology tooltip.

---

# 10. Screen 6 — ALLOCATE

Route:

```text
/operator/allocate
```

Purpose:

> What should I spend my next 10 learning hours on?

Create a dynamic learning portfolio.

Example:

```text
23%  Evaluation Systems
19%  RL / Post-training
17%  Agent Environments
14%  Statistical Evals
11%  Synthetic Data
 8%  ML Systems
 5%  AI Product
 3%  Other
```

For each allocation include:

- why now;
- market evidence;
- mandate relevance;
- current gap;
- learning objective;
- recommended action;
- time estimate;
- source jobs.

Example action:

> Implement confidence intervals and failure-distribution analysis in Gnomon.

Do not generate generic “take an online course” recommendations unless evidence supports it.

---

# 11. Monthly Calibration Workflow

Route:

```text
/calibration
```

Purpose:

Keep the model of the user current.

Create a monthly structured interview.

Questions:

1. Which technically difficult problems did you encounter this month?
2. Which capabilities did you actually exercise?
3. What did another team need to explain to you?
4. What decision can you now make faster than 30 days ago?
5. What artifact did you produce?
6. Where were you operating at the edge of your competence?
7. What capability would have created the most leverage?
8. What do you deliberately want to test next month?

Capabilities should be selectable from the ontology.

After the interview:

- propose updates to `current_depth`;
- show evidence;
- require explicit user approval before updating capability scores.

Never automatically claim:

> “Your RL skill rose from 47 to 63.”

Human approval is mandatory.

---

# 12. Career Greeks

These are analytical concepts, not financial claims.

All scores must be normalized, explainable, and labeled as heuristics.

## Delta

Definition:

> Marginal usefulness of improving a capability to the current mandate.

High Delta example:

- evaluation design.

Low Delta example:

- CUDA internals, if the current role rarely touches low-level compute.

## Gamma

Definition:

> How strongly mastering this capability unlocks adjacent valuable capabilities.

Potential high Gamma:

- statistics;
- evaluation design;
- systems thinking;
- environment design.

## Theta

Definition:

> Expected rate at which knowledge becomes obsolete or loses usefulness.

High Theta:

- vendor-specific UI tricks;
- prompt hacks;
- transient SDK syntax.

Low Theta:

- experimental design;
- statistical inference;
- systems concepts.

## Vega

Definition:

> Value of the capability under uncertainty about how the frontier evolves.

Potential high Vega:

- evaluation methodology;
- statistics;
- systems architecture;
- problem decomposition;
- customer workflow understanding.

## Implied Volatility

Definition:

> Organizational uncertainty / flux around a capability.

Potential signals:

- many inconsistent job titles;
- capability spread across research, engineering, product, TPM, FDE;
- rapidly changing wording;
- fast geographic diffusion;
- unclear ownership.

## Skew

Definition:

> Distribution of demand across level, function, location, or discipline.

Examples:

- RL demand heavily skewed toward research/senior roles;
- FDE skewed toward senior applied roles;
- evals becoming flatter across functions over time.

---

# 13. Career Alpha Scoring

Do not overfit v0.

Start with explainable heuristics.

Example conceptual score:

```text
Career Alpha =
    Market Momentum
  × Personal Adjacency
  × Strategic Value
  × Attainability
  × Persistence
  × Signal Confidence
```

Do NOT hard-code this as a fake mathematically rigorous formula with decimal precision.

Implement each component independently.

Then expose:

- raw inputs;
- normalization method;
- confidence;
- rationale.

Allow weights to be configured later.

---

# 14. Capability Ontology

Create a seeded ontology table.

Minimum initial capability families:

## Agent systems

- Agents
- Tool use
- Multi-agent systems
- Agent orchestration
- Memory
- Planning
- Workflow automation

## Evaluations

- Evals
- Agent evals
- Model evals
- Reliability
- Red teaming
- Benchmarking
- Failure analysis
- Statistical evaluation

## Training / post-training

- Reinforcement learning
- Post-training
- Preference optimization
- Reward modeling
- Synthetic data
- Data flywheels
- Feedback data

## Research / modeling

- Alignment
- Safety
- Multimodal
- Frontier modeling
- Model behavior

## Systems

- Inference
- ML systems
- Distributed systems
- HPC
- Observability
- Data infrastructure
- Compute orchestration

## Applied / field

- Forward deployed engineering
- Enterprise AI
- Customer workflows
- Governance
- Productization
- Integration

Each capability should have:

- id;
- slug;
- name;
- parent;
- description;
- aliases;
- phrases;
- default category.

---

# 15. Database Schema

Use Drizzle migrations.

Create these tables.

## `jobs`

Fields:

```text
id
source
source_job_id
title
company
org
team
discipline
level
locations_json
source_url
posted_at
first_seen_at
last_seen_at
closed_at
status
created_at
updated_at
```

Unique constraint:

```text
(source, source_job_id)
```

## `job_snapshots`

```text
id
job_id
captured_at
content_hash
raw_html
raw_text
source_metadata_json
```

Unique:

```text
(job_id, content_hash)
```

## `recommendations`

```text
id
job_id nullable
source_message_id
recommended_at
recommendation_rank nullable
subject
raw_metadata_json
```

## `capabilities`

```text
id
slug
name
parent_id nullable
description
aliases_json
created_at
```

## `job_capabilities`

```text
id
job_id
capability_id
weight
evidence_type
confidence
evidence_quote
source_snapshot_id
created_at
```

## `mandates`

```text
id
name
title
organization
description
active_from
active_to nullable
created_at
```

## `mandate_capabilities`

```text
id
mandate_id
capability_id
importance
current_depth
target_depth
confidence
rationale
updated_at
```

## `capability_metrics`

```text
id
capability_id
as_of_date
window_days
posting_count
recommendation_count
momentum
novelty
persistence
functional_diffusion
geographic_diffusion
level_diffusion
delta
gamma
theta
vega
implied_vol
confidence
inputs_json
created_at
```

## `monthly_interviews`

```text
id
month
answers_json
summary
completed_at
created_at
```

## `capability_update_proposals`

```text
id
monthly_interview_id
capability_id
old_value
proposed_value
rationale
approved
approved_at nullable
```

## `learning_allocations`

```text
id
month
capability_id
allocation_pct
rationale
recommended_action
time_estimate_hours
created_at
```

## `events`

Create a derived event table for the Tape.

```text
id
event_type
job_id nullable
capability_id nullable
occurred_at
title
summary
metadata_json
```

---

# 16. Ingestion Rules

## Microsoft Careers

Build a replaceable adapter:

```text
lib/ingestion/microsoft-careers.ts
```

Preferred order:

1. official structured endpoint if available;
2. public page JSON;
3. HTML parser;
4. Playwright browser fallback only if necessary.

Important:

- respect site terms and robots rules;
- rate-limit requests;
- identify the collector cleanly where appropriate;
- do not bypass access controls;
- do not attempt CAPTCHA circumvention;
- use public job data only;
- log failures visibly.

## Idempotency

Running ingestion twice must not duplicate jobs.

Algorithm:

```text
fetch job
↓
derive source_job_id
↓
find existing job
↓
hash normalized source content
↓
if content hash unchanged:
    update last_seen_at
    STOP
↓
if changed:
    create job_snapshot
    update normalized job
    queue capability extraction
```

## Closure

Do not immediately mark jobs closed because one scrape fails.

Require reasonable confirmation.

Example:

- not observed for 2 consecutive successful sweeps;
- then mark closed.

---

# 17. Recommendation Email Adapter

Implement the interface now.

Full Gmail OAuth integration may be deferred.

Create:

```text
lib/ingestion/recommendations/types.ts
lib/ingestion/recommendations/mock.ts
lib/ingestion/recommendations/gmail.ts
```

The application must work fully with mock recommendations if Gmail credentials are absent.

Later Gmail ingestion should:

- search only relevant Microsoft Careers emails;
- capture message ID;
- capture received date;
- extract recommended role titles/links;
- map to known jobs where possible;
- preserve source metadata;
- avoid storing unnecessary personal email content.

---

# 18. Analytics

Implement v0 analytics deterministically.

## Momentum

Compare capability frequency across configurable windows.

Example:

```text
7d vs prior 7d
30d vs prior 30d
90d vs prior 90d
```

Use smoothing for tiny sample sizes.

Always show counts beside percentages.

## Persistence

Measure whether a signal persists across multiple windows.

## Novelty

Measure whether a capability/job-family combination is new relative to history.

## Functional diffusion

Count distinct disciplines/functions containing a capability.

## Geographic diffusion

Count distinct locations.

## Level diffusion

Measure spread across seniority bands.

## Recommendation recurrence

Private only.

Track:

- recommendation count;
- recurrence;
- distribution by capability;
- distribution by archetype;
- change over time.

---

# 19. Current Mandate as the Zero Point

All personal development analysis must be anchored to the active mandate.

The application should never default to:

> “How close are you to becoming a research scientist?”

Instead:

> “What capabilities most improve execution of your current mandate while increasing frontier readiness?”

This distinction is essential.

---

# 20. Design System

The application should look like a modern analytical terminal.

## Feel

- dense;
- serious;
- fast;
- dark-first;
- restrained;
- quantitative;
- high information density;
- minimal decorative gradients;
- minimal giant empty cards.

## Inspiration

- Bloomberg Terminal information density;
- modern trading dashboards;
- Football Manager attribute views;
- frontier-research tooling;
- observability dashboards.

## Avoid

- generic SaaS dashboard;
- huge greeting banners;
- cartoon illustrations;
- “You’re crushing it!”;
- gamified confetti;
- oversized KPI cards with no evidence;
- excessive neon cyberpunk aesthetic.

## Typography

Use a clean sans-serif for UI and a good monospace for metrics.

## Navigation

Desktop:

```text
PULSE | TAPE | SURFACE | X-RAY | MANDATE | ALLOCATE
```

Persistent top bar:

- product name;
- current data date;
- last successful sweep;
- mode;
- date/time range;
- data confidence indicator.

---

# 21. Time Machine

Every analytical screen should support:

```text
AS OF: [date]
```

and quick controls:

```text
1W
1M
3M
6M
1Y
TODAY
```

The system must preserve enough historical snapshots to reconstruct what was known at prior dates.

Do not overwrite history.

---

# 22. Seed Data

The app must be useful before live integrations work.

Create deterministic seed data containing:

- at least 100 synthetic job observations;
- 6–12 months of history;
- multiple Microsoft AI-like orgs;
- research;
- engineering;
- TPM;
- PM;
- FDE;
- multiple levels;
- NYC;
- Redmond;
- Mountain View;
- London;
- Zurich;
- job openings and closures;
- changing capability trends;
- recommendation events;
- historical mandate calibration.

Seed story should intentionally produce meaningful trends:

- evals rising;
- RL/post-training rising;
- agent terminology stabilizing;
- data flywheels emerging;
- capability diffusion across functions.

All fake records must be clearly marked in the database as seed/demo data.

---

# 23. Scheduled Jobs

Use GitHub Actions.

## Weekly collection

Create:

```text
.github/workflows/weekly-ingest.yml
```

Function:

1. install dependencies;
2. run database migrations check;
3. run Microsoft Careers ingestion;
4. record snapshots;
5. update closures;
6. rebuild deterministic metrics;
7. log summary.

## Monthly sweep

Create:

```text
.github/workflows/monthly-sweep.yml
```

Function:

1. run latest ingestion;
2. calculate 30/90/180 day deltas;
3. calculate capability metrics;
4. generate events;
5. generate pending learning allocation;
6. mark monthly calibration ready.

Do not require an LLM API for the monthly job to succeed.

---

# 24. Cost Guardrails

v0 should be able to run at approximately $0 incremental monthly infrastructure cost.

Target:

```text
GitHub            Free
GitHub Actions    Free allowance
Supabase          Free tier
Vercel            Hobby while personal/non-commercial
LLM API           $0 initially
```

Design for:

- few scheduled jobs;
- no continuous worker;
- no unnecessary API calls;
- no repeated processing of unchanged jobs.

If a job content hash has not changed:

```text
DO NOT RE-EXTRACT.
```

---

# 25. Authentication

v0:

- protect Private Career Mode;
- Operator mode may initially remain protected too.

Use the simplest maintainable authentication.

Preferred:

- Supabase Auth.

Do not implement enterprise SSO in v0.

Future internal Microsoft deployment may move to Entra ID if needed.

---

# 26. GitHub

## Repository

Create one private repository:

```text
frontier-operator
```

GitHub is the source of truth for code.

GitHub does NOT host the live production application.

## Branching

Use:

```text
main
```

for production.

Feature branches:

```text
feature/<short-name>
```

Every feature branch should be deployable via Vercel Preview.

## Required files

Create:

```text
README.md
PRODUCT.md
ARCHITECTURE.md
AGENTS.md
CONTRIBUTING.md
.env.example
.gitignore
```

---

# 27. Vercel

Vercel hosts the running Next.js application.

Deployment flow:

```text
Cursor
  ↓
local repo
  ↓
git push
  ↓
GitHub
  ↓
Vercel detects push
  ↓
build
  ↓
deploy
```

## Production

`main` branch → Production deployment.

## Preview

Feature branch / PR → Preview deployment.

## Domain

Do NOT require a custom domain for v0.

Use the generated:

```text
*.vercel.app
```

URL initially.

---

# 28. Supabase

Supabase is the persistent backend.

Use for:

- Postgres;
- authentication;
- application state.

Do not store canonical data in browser local storage.

## Local development

Support either:

- hosted development Supabase project;
- or local Supabase CLI if easy.

Do not make local Supabase mandatory if it materially complicates the one-shot build.

---

# 29. Environment Variables

Create:

```text
.env.example
```

with names only.

Example:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Optional integrations
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=

# Optional future LLM extraction
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

Never commit real secrets.

Use:

- `.env.local` locally;
- Vercel Environment Variables for app runtime;
- GitHub Actions Secrets for scheduled workflows.

---

# 30. Repo Structure

Use a structure close to:

```text
frontier-operator/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── operator/
│   │   ├── page.tsx
│   │   ├── tape/
│   │   ├── surface/
│   │   ├── xray/
│   │   ├── mandate/
│   │   └── allocate/
│   │
│   ├── private/
│   │   ├── page.tsx
│   │   ├── recommendations/
│   │   └── roles/
│   │
│   ├── calibration/
│   └── api/
│
├── components/
│   ├── shell/
│   ├── terminal/
│   ├── charts/
│   ├── jobs/
│   ├── capabilities/
│   ├── mandate/
│   └── calibration/
│
├── lib/
│   ├── db/
│   ├── models/
│   ├── ingestion/
│   │   ├── microsoft-careers/
│   │   └── recommendations/
│   ├── analytics/
│   │   ├── momentum.ts
│   │   ├── diffusion.ts
│   │   ├── greeks.ts
│   │   ├── gaps.ts
│   │   └── allocation.ts
│   ├── capabilities/
│   └── auth/
│
├── scripts/
│   ├── seed.ts
│   ├── ingest-jobs.ts
│   ├── calculate-metrics.ts
│   └── monthly-sweep.ts
│
├── drizzle/
├── tests/
│   ├── unit/
│   └── e2e/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── weekly-ingest.yml
│       └── monthly-sweep.yml
│
├── public/
│
├── PRODUCT.md
├── ARCHITECTURE.md
├── AGENTS.md
├── README.md
├── CONTRIBUTING.md
├── .env.example
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

# 31. AGENTS.md

Create this exact spirit:

```md
# Engineering Rules

1. Correctness over cleverness.
2. No feature without PRODUCT.md justification.
3. Source data is immutable.
4. Derived data must preserve provenance.
5. Scheduled jobs must be idempotent.
6. Never silently swallow ingestion errors.
7. Never fabricate missing data.
8. Heuristic scores must expose their inputs.
9. LLM extraction, if later added, must use validated structured output.
10. UI must work completely with deterministic seed data.
11. Operator Mode must not imply active job searching.
12. Private Career data must never accidentally render in Operator Mode.
13. Run lint, typecheck, tests, and production build after meaningful changes.
14. Keep setup instructions current.
15. Prefer simple boring architecture.
16. Do not introduce microservices without explicit approval.
17. Do not introduce new paid infrastructure without explicit approval.
18. Do not add features beyond the v0 product contract during bootstrap.
```

---

# 32. PRODUCT.md

Document:

- problem;
- user;
- internal-safe framing;
- six screens;
- data model;
- Greeks;
- monthly calibration;
- explicit non-goals.

## Non-goals

Do NOT build in v0:

- resume builder;
- application tracker;
- recruiter CRM;
- job application automation;
- cover-letter generator;
- interview-prep platform;
- compensation optimizer;
- networking CRM;
- generic AI news feed;
- multi-user SaaS;
- billing;
- teams;
- mobile native app.

---

# 33. ARCHITECTURE.md

Explain:

- raw → normalized → derived;
- ingestion;
- provenance;
- analytics;
- auth;
- GitHub Actions;
- Vercel;
- Supabase;
- future Python escape hatch;
- private/operator boundary.

Include an ASCII system diagram.

---

# 34. README.md

README must contain a true first-run experience.

Required sections:

1. What this is
2. Architecture
3. Requirements
4. Local setup
5. Environment variables
6. Database migration
7. Seed data
8. Run locally
9. Tests
10. Production build
11. Vercel deployment
12. GitHub Actions configuration
13. Supabase configuration
14. Troubleshooting
15. Known limitations

---

# 35. Local Development

Desired command flow:

```bash
git clone <repo>
cd frontier-operator
pnpm install
cp .env.example .env.local
pnpm db:migrate
pnpm db:seed
pnpm dev
```

App:

```text
http://localhost:3000
```

If hosted Supabase credentials are unavailable, provide a demo mode that runs from deterministic local seed data.

---

# 36. package.json Scripts

Include intuitive scripts:

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "start": "...",
    "lint": "...",
    "typecheck": "...",
    "test": "...",
    "test:e2e": "...",
    "db:generate": "...",
    "db:migrate": "...",
    "db:seed": "...",
    "ingest:jobs": "...",
    "metrics:rebuild": "...",
    "sweep:monthly": "...",
    "check": "..."
  }
}
```

`pnpm check` should run:

```text
lint
typecheck
unit tests
production build
```

---

# 37. CI

Create:

```text
.github/workflows/ci.yml
```

On pull request and push to main:

- install pnpm;
- install dependencies;
- lint;
- typecheck;
- unit tests;
- production build.

Playwright smoke tests may run separately if browser setup is expensive.

---

# 38. Error Handling

Ingestion failures must be visible.

Create an `ingestion_runs` table or equivalent.

Store:

- started_at;
- completed_at;
- status;
- records_seen;
- records_created;
- records_changed;
- records_failed;
- error_summary.

Pulse should show:

```text
LAST DATA SWEEP: SUCCESS
```

or:

```text
LAST DATA SWEEP: PARTIAL
```

Never silently display stale data as current.

---

# 39. Data Confidence

Every analytical insight should expose a confidence indicator.

Confidence may account for:

- sample size;
- number of independent jobs;
- persistence;
- number of functions;
- recency;
- data completeness.

Example:

```text
Evaluation momentum: +27%
Confidence: HIGH
Based on: 31 jobs across 4 functions and 3 locations.
```

---

# 40. Evidence Drawer

Create a reusable component:

```text
<EvidenceDrawer />
```

Any derived metric should be able to show:

- source jobs;
- excerpts;
- dates;
- calculated inputs;
- formula/heuristic;
- confidence.

This is central to the product.

---

# 41. Internal Demo Story

Operator Mode must support this 10-minute story:

## 1. Pulse

> What capabilities Microsoft AI appears to be emphasizing now.

## 2. Surface

> How those capabilities are diffusing across functions, levels, and teams.

## 3. Mandate

> What I need deep expertise in vs working literacy in to become more effective in CAPE.

Click one signal such as Evaluations and trace:

```text
Evaluations ↑
      ↓
new jobs
      ↓
research + engineering + TPM + FDE diffusion
      ↓
specific JD evidence
      ↓
mandate relevance
      ↓
learning priority
```

The product should naturally support this story.

---

# 42. Privacy / Internal-Safe Rules

Operator Mode must never render:

- “Apply” buttons;
- future-employer wishlists;
- salary;
- likelihood of leaving;
- target-role probabilities;
- private recommendation-email subjects;
- personal fit for neighboring roles.

Use wording like:

- mandate coverage;
- capability depth;
- learning priority;
- frontier literacy;
- cross-functional trend;
- organizational diffusion.

Avoid:

- job hunting;
- exit;
- recruiting;
- next role;
- escape velocity.

---

# 43. One-Shot Bootstrap Sequence

Execute in this exact order.

## Phase A — Planning

1. Create `PRODUCT.md`.
2. Create `ARCHITECTURE.md`.
3. Create `AGENTS.md`.
4. Create schema definitions.
5. Create seed-data story.
6. Confirm repo structure.

Do not begin visual implementation before these exist.

## Phase B — Foundation

1. Initialize Next.js.
2. Install dependencies.
3. Configure Tailwind.
4. Configure shadcn/ui.
5. Configure Drizzle.
6. Configure Supabase.
7. Create migrations.
8. Create deterministic seed data.

## Phase C — Shared UI

1. App shell.
2. Navigation.
3. terminal-style layout.
4. date/time-machine control.
5. capability badges.
6. evidence drawer.
7. filter controls.
8. data-confidence component.

## Phase D — Six Screens

Implement in order:

1. Pulse
2. Tape
3. X-Ray
4. Mandate
5. Allocate
6. Surface

Do not move on until each page renders from seed data.

## Phase E — Calibration

Implement monthly interview.

## Phase F — Analytics

Implement:

- momentum;
- persistence;
- novelty;
- functional diffusion;
- geographic diffusion;
- level diffusion;
- gaps;
- Delta;
- Gamma;
- Theta;
- Vega;
- implied volatility;
- learning allocation.

## Phase G — Ingestion

Implement:

- adapter interface;
- Microsoft Careers adapter;
- content hashing;
- snapshots;
- closure logic;
- run logging.

## Phase H — Automation

Implement:

- CI;
- weekly ingest workflow;
- monthly sweep workflow.

## Phase I — Deployment

1. connect GitHub;
2. configure Vercel;
3. configure Supabase;
4. add environment variables;
5. deploy preview;
6. deploy production.

## Phase J — Validation

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Then:

```bash
pnpm dev
```

Use Playwright to verify:

- `/operator`
- `/operator/tape`
- `/operator/surface`
- `/operator/mandate`
- `/operator/allocate`
- `/calibration`

Fix all errors.

---

# 44. Cursor Agent Instruction

Paste everything above into the repository as:

```text
BUILD_SPEC.md
```

Then give Cursor Agent this instruction:

---

## CURSOR EXECUTION PROMPT

You are the primary engineer responsible for bootstrapping this repository.

Read `BUILD_SPEC.md` completely before touching code.

Then read/create:

- `PRODUCT.md`
- `ARCHITECTURE.md`
- `AGENTS.md`

Your job is to build the v0 product specified in `BUILD_SPEC.md` as a production-quality, maintainable application.

Do not reinterpret the product into a generic job board.

The product is a longitudinal AI capability intelligence system.

The default user-facing experience is the internal-safe **Frontier Operator / AI Capability Observatory**.

The private layer is **Career Alpha**.

### Non-negotiable technical choices

Use:

- Next.js App Router
- TypeScript
- Tailwind
- shadcn/ui
- Supabase Postgres
- Drizzle
- Zod
- ECharts
- Plotly only for the optional 3D surface
- Vitest
- Playwright
- pnpm
- GitHub Actions
- Vercel-compatible deployment

Do not introduce microservices, Kubernetes, Redis, Kafka, LangChain, or unnecessary infrastructure.

### Critical implementation constraints

1. The entire UI must work from deterministic seed data before live integrations work.
2. Raw source data, normalized data, and derived metrics must be separate.
3. Raw source data must never be overwritten by LLM-generated content.
4. All important derived insights must preserve provenance.
5. Every scheduled ingestion path must be idempotent.
6. Unchanged job content must not be reprocessed.
7. Operator Mode must be safe to screen-share internally.
8. Private Career data must never leak into Operator Mode.
9. Heuristic scores must expose methodology and confidence.
10. Do not pretend heuristic scores have scientific precision.
11. Do not add features outside the v0 product contract.
12. Do not stop after writing code.

### Execution behavior

Work autonomously through the bootstrap sequence.

When you encounter an implementation choice, prefer:

1. simplest;
2. most maintainable;
3. free-tier compatible;
4. most conventional;
5. easiest for a future coding agent to understand.

Do not ask for clarification unless blocked by a truly irreversible choice.

Use sensible placeholders where credentials are required.

Never put secrets into source control.

### Required completion checks

Before declaring success:

1. install dependencies;
2. generate migrations;
3. seed demo data;
4. run lint;
5. run typecheck;
6. run unit tests;
7. run production build;
8. run Playwright smoke tests where possible;
9. launch the local dev server;
10. verify the main routes render;
11. fix all errors;
12. update README with exact setup/deployment instructions.

### Final report

When complete, report:

- localhost URL;
- implemented screens;
- database status;
- migrations created;
- seed-data status;
- ingestion status;
- analytics implemented;
- tests run;
- build status;
- GitHub Actions created;
- Vercel readiness;
- environment variables still required;
- exact manual steps I must take in GitHub, Supabase, and Vercel;
- known limitations;
- deferred integrations.

Do not report “done” while lint, typecheck, tests, or build are failing.

---

# 45. Manual Setup I Expect to Do

Cursor cannot necessarily complete account-level setup.

I will do these manually if required.

## GitHub

1. Create private repository `frontier-operator`.
2. Push local repo.
3. Set `main` as production branch.
4. Add GitHub Actions secrets.

## Supabase

1. Create free project.
2. Copy:
   - project URL;
   - anon key;
   - service-role key;
   - database connection string.
3. Add locally to `.env.local`.
4. Add required secrets to Vercel.
5. Add required database secrets to GitHub Actions.
6. Run migrations.
7. Seed.

## Vercel

1. Sign in.
2. Import GitHub repository.
3. Select Next.js framework.
4. Add environment variables.
5. Deploy.
6. Verify production URL.
7. Keep generated `vercel.app` domain initially.

---

# 46. Deployment Mental Model

```text
LOCAL DEVELOPMENT
Cursor
  ↓
pnpm dev
  ↓
localhost:3000


SOURCE CONTROL
git push
  ↓
GitHub


PREVIEW
feature branch / PR
  ↓
GitHub
  ↓
Vercel Preview URL


PRODUCTION
main
  ↓
GitHub
  ↓
Vercel
  ↓
frontier-operator.vercel.app


PERSISTENT DATA
Vercel app
  ↕
Supabase Postgres


AUTONOMOUS COLLECTION
GitHub Actions
  ↓
Microsoft Careers
  ↓
Supabase
```

GitHub stores the source.

Vercel hosts the web application.

Supabase stores persistent data.

GitHub Actions perform scheduled jobs.

---

# 47. Acceptance Criteria

The build is successful only when all of these are true.

## Product

- [ ] Pulse works
- [ ] Tape works
- [ ] Surface works
- [ ] X-Ray works
- [ ] Mandate works
- [ ] Allocate works
- [ ] Monthly Calibration works
- [ ] Operator Mode exists
- [ ] Private Mode exists
- [ ] Seed data produces meaningful historical trends
- [ ] Time Machine works
- [ ] Evidence drawer works

## Data

- [ ] Postgres schema exists
- [ ] migrations exist
- [ ] seed command works
- [ ] raw snapshots preserved
- [ ] content hashes implemented
- [ ] idempotent ingestion tested
- [ ] closure semantics implemented
- [ ] confidence metadata exists

## Analytics

- [ ] momentum
- [ ] persistence
- [ ] novelty
- [ ] diffusion
- [ ] mandate gaps
- [ ] Delta
- [ ] Gamma
- [ ] Theta
- [ ] Vega
- [ ] implied volatility
- [ ] learning allocation

## Engineering

- [ ] lint passes
- [ ] typecheck passes
- [ ] unit tests pass
- [ ] production build passes
- [ ] smoke tests pass
- [ ] README accurate
- [ ] `.env.example` exists
- [ ] no secrets committed
- [ ] GitHub Actions exist
- [ ] Vercel deployable

## UX

- [ ] looks like an analytical terminal
- [ ] no generic SaaS fluff
- [ ] dense but readable
- [ ] responsive
- [ ] no accidental Private-mode content in Operator mode
- [ ] meaningful empty/loading/error states

---

# 48. Deferred Work

Do not block v0 on:

- Gmail OAuth;
- LLM-based extraction;
- custom domain;
- Entra ID;
- perfect job-history backfill;
- Python analytics;
- external-company ingestion;
- multi-user support;
- mobile app.

These come after the application is working, deployed, and being used.

---

# 49. Future Extensions

Only after v0 proves useful:

## Data

- OpenAI
- Anthropic
- Google DeepMind
- Meta
- xAI
- Cursor
- Reflection
- other frontier companies

## Analytics

- embeddings;
- clustering;
- time-series models;
- Bayesian trend estimates;
- confidence intervals;
- graph analytics;
- capability lead/lag relationships.

## Integrations

- Gmail recommendation ingestion;
- Microsoft Outlook recommendation ingestion;
- calendar-based monthly calibration reminder;
- paper/research recommendation engine.

## Deployment

If the project becomes a genuine Microsoft-internal tool:

- migrate hosting to Azure if appropriate;
- use Microsoft Entra ID;
- validate internal data handling requirements;
- keep public-job analysis separate from confidential internal data.

---

# 50. First Real Milestone

Do not judge v0 by how many features exist.

The first meaningful success state is:

> I can open a live URL, show a Microsoft leader three screens, click a capability trend, trace it to real job evidence, explain what changed, show how it maps to my current mandate, and show what I am deliberately learning because of it.

If that works, the system is already valuable.

Everything after that is compounding.

---

# 51. One Final Rule

The core loop must always remain:

```text
OBSERVE
  ↓
MEASURE CHANGE
  ↓
ASK WHY
  ↓
SHOW EVIDENCE
  ↓
MAP TO CURRENT MANDATE
  ↓
ALLOCATE LEARNING
  ↓
BUILD / PRACTICE
  ↓
CALIBRATE
  ↓
REPEAT
```

If a proposed feature does not strengthen this loop, do not build it.
