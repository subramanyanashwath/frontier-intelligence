import "./load-env";
import { getDb } from "../lib/db/client";
import { ingestionRuns } from "../lib/db/schema";
import { persistDerived } from "../lib/db/persist";
import { getDataset } from "../lib/data/repository";
import { addDays } from "../lib/dates";
import { familyMomentum } from "../lib/analytics/momentum";
import { runMicrosoftIngestion } from "../lib/ingestion/run";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for the monthly sweep.");
    process.exit(1);
  }
  const ingest = await runMicrosoftIngestion();
  console.log("Ingestion", ingest);
  const dataset = await getDataset();
  await persistDerived(dataset, dataset.asOf);
  for (const days of [30, 90, 180]) {
    const evals = familyMomentum(dataset, dataset.asOf, "evaluations", days);
    const training = familyMomentum(dataset, dataset.asOf, "training", days);
    console.log(`${days}d evaluations ${evals.current} vs ${evals.prior}; training ${training.current} vs ${training.prior}`);
  }
  const db = getDb();
  if (db) {
    await db.insert(ingestionRuns).values({
      id: `sweep_${dataset.asOf}`,
      source: "monthly-sweep",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: ingest.status === "failed" ? "partial" : "success",
      recordsSeen: ingest.seen,
      recordsCreated: ingest.created,
      recordsChanged: ingest.changed,
      recordsUnchanged: ingest.unchanged,
      recordsFailed: ingest.failed,
      errorSummary: null,
      isDemo: false,
      detailsJson: {
        calibrationReady: true,
        month: dataset.asOf.slice(0, 7),
        windows: [30, 90, 180],
        nextWindowStart: addDays(dataset.asOf, 1),
      },
    });
  }
  console.log("Monthly calibration marked ready. No LLM call was required.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
