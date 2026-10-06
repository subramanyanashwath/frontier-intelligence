import "./load-env";
import { replaceDemoDataset } from "../lib/db/persist";
import { generateDataset } from "../lib/seed/generate";

async function main() {
  const dataset = generateDataset();
  if (!process.env.DATABASE_URL) {
    console.log(`Demo dataset is ready in memory: ${dataset.jobs.length} synthetic jobs, anchor ${dataset.asOf}.`);
    console.log("No DATABASE_URL set, so nothing was written. Start the app with pnpm dev.");
    return;
  }
  await replaceDemoDataset(dataset);
  console.log(`Seeded ${dataset.jobs.length} demo jobs into Postgres. Live rows were left in place.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
