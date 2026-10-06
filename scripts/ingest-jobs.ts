import "./load-env";
import { runMicrosoftIngestion } from "../lib/ingestion/run";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Ingestion does not write the demo seed.");
    process.exit(1);
  }
  const summary = await runMicrosoftIngestion();
  console.log(JSON.stringify(summary, null, 2));
  if (summary.status === "failed") process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
