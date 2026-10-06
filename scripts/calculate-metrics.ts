import "./load-env";
import { persistDerived } from "../lib/db/persist";
import { getDataset } from "../lib/data/repository";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL. Metrics are recomputed in the app from the demo seed. Nothing to persist.");
    return;
  }
  const dataset = await getDataset();
  await persistDerived(dataset, dataset.asOf);
  console.log(`Rebuilt capability metrics, allocations, and events as of ${dataset.asOf}.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
