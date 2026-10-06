# Frontier Operator

Internal-safe name: **Frontier Operator**  
Subtitle: **AI Capability Observatory**

Private layer: **Career Alpha**

## Problem

Microsoft job descriptions are organizational telemetry. They show which capabilities are spreading, which ones are stalling, and which responsibilities are being pulled into engineering, research, TPM, PM, and forward-deployed work.

A single posting is noise. A year of postings, closures, and wording changes is a signal. The useful question is not "which job should I apply to?" It is:

> Given what Microsoft is hiring for, what has changed over time, and what the current CAPE mandate requires, what should I learn, deepen, build, or merely remain literate in?

## User

One person: a Senior Customer Program Manager in CAPE, using the system as a personal capability observatory. The default screens are safe to show to Microsoft managers and senior leaders. Career Alpha stays on separate authenticated routes.

## Internal-safe framing

Operator Mode talks about:

- capability momentum
- organizational diffusion
- mandate coverage
- frontier literacy
- learning priority
- public job evidence

Operator Mode does not talk about exit roles, compensation, application odds, target employers, or private recommendation mail.

## Screens

| Screen | Route | Question |
| --- | --- | --- |
| Pulse | `/operator` | What changed? |
| Tape | `/operator/tape` | What happened over time? |
| Surface | `/operator/surface` | Where is capability emphasis moving? |
| X-Ray | `/operator/xray/[jobId]` | What does this posting actually signal? |
| Mandate | `/operator/mandate` | What does the current CAPE mandate require? |
| Allocate | `/operator/allocate` | Where should the next 10 learning hours go? |
| Calibration | `/calibration` | What did this month actually change about my depth? |

Private routes (`/private`, `/private/recommendations`, `/private/roles`, `/private/surface`, `/private/xray/[jobId]`) add recommendation trends, role adjacency, fit horizons, and Career Alpha components. They are separate routes, not a cosmetic toggle.

## Data model

Three layers:

1. **Raw** — immutable snapshots (`job_snapshots`), recommendation metadata, content hashes, capture time.
2. **Normalized** — jobs, capabilities, mandate scores, recommendation links.
3. **Derived** — momentum, diffusion, Greeks, gaps, allocation, events. Recomputable. Never written back over raw text.

Demo records are marked `is_demo`. The UI labels demo provenance so seed history is never presented as a live sweep.

## Career Greeks

Heuristics, normalized 0–100, with inputs visible:

- **Delta** — marginal usefulness to the current mandate.
- **Gamma** — how much mastery unlocks adjacent capabilities.
- **Theta** — expected obsolescence. v0 uses an explicit prior, adjusted slightly when title churn is high.
- **Vega** — value under frontier uncertainty.
- **Implied volatility** — organizational flux: title variety, functional spread, wording changes, geographic spread.
- **Skew** — how demand sits across level, function, and location.

Career Alpha is not a fake precise formula. Market momentum, personal adjacency, strategic value, attainability, persistence, and signal confidence are computed separately. An equal-weight composite is shown only as a labeled heuristic.

## Monthly calibration

`/calibration` asks eight structured questions. Capabilities are chosen from the ontology. The system proposes `current_depth` updates and waits for explicit approval. It never silently rewrites a score.

## Time machine

Analytical screens honor `asOf` plus `1W / 1M / 3M / 6M / 1Y / TODAY`. History is replayed from snapshots, closures, and approved depth changes. Later edits do not rewrite earlier dates.

## Non-goals

v0 does not include a resume builder, application tracker, recruiter CRM, application automation, cover-letter generator, interview-prep platform, compensation optimizer, networking CRM, generic AI news feed, multi-user SaaS, billing, teams, or a native mobile app.
