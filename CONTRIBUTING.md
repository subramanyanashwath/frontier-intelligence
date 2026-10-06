# Contributing

This repository is a single-user observatory. Changes should strengthen the loop: observe, measure change, show evidence, map to the current mandate, allocate learning, calibrate.

## Setup

See README.md. Use pnpm. Do not commit `.env.local`, `.data/`, or real credentials.

## Branches

Production is `main`. Feature work uses `feature/<short-name>`. This agent branch uses the `cursor/` prefix required by the cloud environment.

## Pull requests

- Keep Operator Mode free of private Career Alpha fields.
- Mark synthetic fixtures as demo data.
- Add or update a unit test for analytics, ingestion, or boundary changes.
- Run `pnpm check` before asking for review.

## Data rules

- Do not edit raw snapshot text in place.
- Do not re-extract capabilities when the content hash is unchanged.
- Do not auto-apply calibration proposals.

## Out of scope

Resume tools, application tracking, compensation, recruiting automation, and extra major screens. See PRODUCT.md.
